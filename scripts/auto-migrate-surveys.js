#!/usr/bin/env node

/**
 * Automated Survey Multi-Tenant Migration Script for Production Deployment
 * 
 * This script automatically migrates surveys to multi-tenant architecture
 * during deployment without user interaction.
 */

const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const Company = require('../models/Company');

// Configuration
const MIGRATION_CONFIG = {
  // Environment variables to control migration behavior
  AUTO_MIGRATE: process.env.AUTO_MIGRATE_SURVEYS !== 'false', // Default: true
  DEFAULT_COMPANY_SLUG: process.env.DEFAULT_COMPANY_SLUG || 'default',
  DRY_RUN: process.env.MIGRATION_DRY_RUN === 'true', // Default: false
  BACKUP_ENABLED: process.env.MIGRATION_BACKUP !== 'false', // Default: true
  LOG_LEVEL: process.env.MIGRATION_LOG_LEVEL || 'info', // info, debug, warn, error
};

// Logging utility
const logger = {
  error: (msg, ...args) => console.error(`❌ [ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`⚠️  [WARN]  ${msg}`, ...args),
  info: (msg, ...args) => console.info(`ℹ️  [INFO]  ${msg}`, ...args),
  debug: (msg, ...args) => {
    if (MIGRATION_CONFIG.LOG_LEVEL === 'debug') {
      console.log(`🐛 [DEBUG] ${msg}`, ...args);
    }
  },
  success: (msg, ...args) => console.log(`✅ [SUCCESS] ${msg}`, ...args),
};

class MigrationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'MigrationError';
    this.code = code;
  }
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';
  logger.debug('Connecting to MongoDB:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
  
  await mongoose.connect(MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  logger.success('Connected to MongoDB');
}

async function analyzeCurrentState() {
  logger.info('Analyzing current database state...');
  
  const totalSurveys = await Survey.countDocuments();
  const surveysWithCompanyId = await Survey.countDocuments({ 
    companyId: { $exists: true, $ne: null } 
  });
  const surveysWithoutCompanyId = totalSurveys - surveysWithCompanyId;
  
  const companies = await Company.countDocuments();
  
  const analysis = {
    totalSurveys,
    surveysWithCompanyId,
    surveysWithoutCompanyId,
    totalCompanies: companies,
    migrationNeeded: surveysWithoutCompanyId > 0,
  };
  
  logger.info('Database Analysis:');
  logger.info(`  Total surveys: ${analysis.totalSurveys}`);
  logger.info(`  Already migrated: ${analysis.surveysWithCompanyId}`);
  logger.info(`  Need migration: ${analysis.surveysWithoutCompanyId}`);
  logger.info(`  Total companies: ${analysis.totalCompanies}`);
  
  return analysis;
}

async function checkMigrationPrerequisites() {
  logger.info('Checking migration prerequisites...');
  
  // Check if required indexes exist
  const db = mongoose.connection.db;
  const indexes = await db.collection('surveys').indexes();
  
  const hasCompoundIndex = indexes.some(idx => 
    idx.key?.slug === 1 && idx.key?.companyId === 1 && idx.unique
  );
  
  if (!hasCompoundIndex) {
    logger.warn('Compound index {slug: 1, companyId: 1} not found, creating...');
    try {
      await db.collection('surveys').createIndex(
        { slug: 1, companyId: 1 }, 
        { 
          unique: true,
          partialFilterExpression: { 
            slug: { $exists: true, $type: 'string' },
            companyId: { $exists: true }
          },
          name: 'slug_companyId_unique_auto'
        }
      );
      logger.success('Created compound index for multi-tenant support');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw new MigrationError(`Failed to create compound index: ${error.message}`, 'INDEX_ERROR');
      }
    }
  }
  
  logger.success('Prerequisites check completed');
}

async function createDefaultCompany() {
  logger.info(`Ensuring default company '${MIGRATION_CONFIG.DEFAULT_COMPANY_SLUG}' exists...`);
  
  let defaultCompany = await Company.findOne({ 
    slug: MIGRATION_CONFIG.DEFAULT_COMPANY_SLUG 
  });
  
  if (!defaultCompany) {
    if (MIGRATION_CONFIG.DRY_RUN) {
      logger.info(`[DRY RUN] Would create default company: ${MIGRATION_CONFIG.DEFAULT_COMPANY_SLUG}`);
      return { _id: 'dry-run-company-id', slug: MIGRATION_CONFIG.DEFAULT_COMPANY_SLUG };
    }
    
    logger.info('Creating default company...');
    defaultCompany = new Company({
      name: 'Default Company',
      slug: MIGRATION_CONFIG.DEFAULT_COMPANY_SLUG,
      description: 'Default company for legacy surveys (auto-created during migration)',
      isActive: true,
      industry: 'General',
      size: '1-10',
    });
    
    await defaultCompany.save();
    logger.success(`Created default company: ${defaultCompany.slug}`);
  } else {
    logger.info(`Default company already exists: ${defaultCompany.slug}`);
  }
  
  return defaultCompany;
}

async function handleSlugConflicts(defaultCompanyId) {
  logger.info('Checking for slug conflicts...');
  
  // Find surveys that would conflict after migration
  const pipeline = [
    {
      $group: {
        _id: '$slug',
        surveys: { $push: { _id: '$_id', title: '$title', companyId: '$companyId' } },
        count: { $sum: 1 }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ];
  
  const conflicts = await Survey.aggregate(pipeline);
  
  if (conflicts.length === 0) {
    logger.success('No slug conflicts found');
    return;
  }
  
  logger.warn(`Found ${conflicts.length} slug conflicts, resolving...`);
  
  for (const conflict of conflicts) {
    const { _id: slug, surveys } = conflict;
    
    // Skip if all surveys will belong to the same company (default)
    const futureCompanyIds = surveys.map(s => s.companyId || defaultCompanyId.toString());
    const uniqueCompanies = [...new Set(futureCompanyIds)];
    
    if (uniqueCompanies.length <= 1) {
      logger.debug(`Slug '${slug}' will belong to single company, no conflict`);
      continue;
    }
    
    // Resolve conflicts by renaming surveys (keep first one as-is)
    const surveysToRename = surveys.slice(1);
    
    for (let i = 0; i < surveysToRename.length; i++) {
      const survey = surveysToRename[i];
      const newSlug = `${slug}-${i + 1}`;
      
      if (MIGRATION_CONFIG.DRY_RUN) {
        logger.info(`[DRY RUN] Would rename survey '${survey.title}' slug: '${slug}' → '${newSlug}'`);
        continue;
      }
      
      await Survey.updateOne(
        { _id: survey._id },
        { $set: { slug: newSlug } }
      );
      
      logger.success(`Renamed survey '${survey.title}': '${slug}' → '${newSlug}'`);
    }
  }
}

async function migrateSurveysToDefaultCompany(defaultCompany) {
  logger.info('Migrating surveys without companyId to default company...');
  
  const surveysToMigrate = await Survey.find({
    $or: [
      { companyId: { $exists: false } },
      { companyId: null }
    ]
  }, { _id: 1, title: 1, slug: 1, type: 1 });
  
  if (surveysToMigrate.length === 0) {
    logger.success('No surveys need migration');
    return 0;
  }
  
  logger.info(`Found ${surveysToMigrate.length} surveys to migrate`);
  
  if (MIGRATION_CONFIG.DRY_RUN) {
    logger.info('[DRY RUN] Would migrate the following surveys:');
    surveysToMigrate.forEach(survey => {
      logger.info(`  - ${survey.title} (${survey.slug || 'no-slug'}) [${survey.type}]`);
    });
    return surveysToMigrate.length;
  }
  
  const result = await Survey.updateMany(
    {
      $or: [
        { companyId: { $exists: false } },
        { companyId: null }
      ]
    },
    { $set: { companyId: defaultCompany._id } }
  );
  
  logger.success(`Successfully migrated ${result.modifiedCount} surveys to default company`);
  return result.modifiedCount;
}

async function createMigrationLog(analysis, migratedCount, conflicts) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version || 'unknown',
    config: MIGRATION_CONFIG,
    beforeMigration: analysis,
    migratedSurveys: migratedCount,
    resolvedConflicts: conflicts,
    status: 'completed'
  };
  
  if (MIGRATION_CONFIG.DRY_RUN) {
    logger.info('[DRY RUN] Migration log would be:');
    console.log(JSON.stringify(logEntry, null, 2));
    return;
  }
  
  // In a real deployment, you might want to log this to a file or database
  logger.debug('Migration completed successfully:', logEntry);
}

async function verifyMigration() {
  logger.info('Verifying migration results...');
  
  const analysisAfter = await analyzeCurrentState();
  
  if (analysisAfter.surveysWithoutCompanyId > 0) {
    throw new MigrationError(
      `Migration incomplete: ${analysisAfter.surveysWithoutCompanyId} surveys still without companyId`,
      'INCOMPLETE_MIGRATION'
    );
  }
  
  logger.success('Migration verification passed');
  return analysisAfter;
}

async function main() {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Starting automated survey migration...');
    
    if (MIGRATION_CONFIG.DRY_RUN) {
      logger.warn('🔍 DRY RUN MODE - No actual changes will be made');
    }
    
    // Step 1: Connect to database
    await connectDB();
    
    // Step 2: Analyze current state
    const analysis = await analyzeCurrentState();
    
    // Step 3: Check if migration is needed
    if (!analysis.migrationNeeded) {
      logger.success('✨ No migration needed - all surveys already have companyId');
      process.exit(0);
    }
    
    if (!MIGRATION_CONFIG.AUTO_MIGRATE) {
      logger.warn('⏸️  Auto-migration disabled by configuration');
      logger.info('Set AUTO_MIGRATE_SURVEYS=true to enable automatic migration');
      process.exit(0);
    }
    
    // Step 4: Check prerequisites
    await checkMigrationPrerequisites();
    
    // Step 5: Create default company
    const defaultCompany = await createDefaultCompany();
    
    // Step 6: Handle potential slug conflicts
    await handleSlugConflicts(defaultCompany);
    
    // Step 7: Migrate surveys
    const migratedCount = await migrateSurveysToDefaultCompany(defaultCompany);
    
    // Step 8: Verify migration
    const finalAnalysis = await verifyMigration();
    
    // Step 9: Create log
    await createMigrationLog(analysis, migratedCount, 0);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    logger.success(`🎉 Migration completed successfully in ${duration}s!`);
    logger.info(`   Migrated: ${migratedCount} surveys`);
    logger.info(`   Total surveys: ${finalAnalysis.totalSurveys}`);
    logger.info(`   All surveys now have companyId assigned`);
    
  } catch (error) {
    logger.error('💥 Migration failed:', error.message);
    
    if (error instanceof MigrationError) {
      logger.error(`Error Code: ${error.code}`);
      process.exit(1);
    } else {
      logger.error('Unexpected error:', error);
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.warn('Migration interrupted by user');
  await mongoose.disconnect();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  logger.warn('Migration terminated by system');
  await mongoose.disconnect();
  process.exit(143);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeCurrentState,
  migrateSurveysToDefaultCompany,
  createDefaultCompany,
  handleSlugConflicts,
  MIGRATION_CONFIG
};