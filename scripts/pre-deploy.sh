#!/bin/bash

# Pre-deployment script for Survey Multi-tenant Migration
# This script runs before deploying to UAT/PROD environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups/$(date +%Y%m%d_%H%M%S)"
ENVIRONMENT=${DEPLOY_ENV:-"unknown"}

log_info "🚀 Starting pre-deployment checks for environment: $ENVIRONMENT"

# Function to check if we're in a deployment environment
is_production_like() {
    [[ "$ENVIRONMENT" == "uat" ]] || [[ "$ENVIRONMENT" == "prod" ]] || [[ "$ENVIRONMENT" == "production" ]]
}

# Function to create database backup
create_backup() {
    if [[ "${MIGRATION_BACKUP:-true}" == "true" ]] && is_production_like; then
        log_info "📦 Creating database backup..."
        
        mkdir -p "$BACKUP_DIR"
        
        # Extract MongoDB URI components
        if [[ -n "$MONGODB_URI" ]]; then
            log_info "Creating MongoDB backup..."
            
            # Use mongodump if available
            if command -v mongodump >/dev/null 2>&1; then
                mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb" --gzip
                log_success "Database backup created at: $BACKUP_DIR/mongodb"
            else
                log_warn "mongodump not available, skipping database backup"
                log_warn "Ensure you have a recent backup before proceeding"
            fi
        else
            log_warn "MONGODB_URI not set, cannot create backup"
        fi
    else
        log_info "Backup disabled or not in production-like environment"
    fi
}

# Function to run migration analysis
run_migration_analysis() {
    log_info "🔍 Analyzing migration requirements..."
    
    cd "$PROJECT_ROOT"
    
    # Run migration analysis in dry-run mode
    export MIGRATION_DRY_RUN=true
    export MIGRATION_LOG_LEVEL=info
    
    if node scripts/auto-migrate-surveys.js; then
        log_success "Migration analysis completed successfully"
    else
        log_error "Migration analysis failed"
        return 1
    fi
}

# Function to validate environment
validate_environment() {
    log_info "🔧 Validating deployment environment..."
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
    
    # Check if required environment variables are set
    local required_vars=("MONGODB_URI")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable '$var' is not set"
            return 1
        fi
    done
    
    # Check if MongoDB is accessible
    log_info "Testing database connectivity..."
    if node -e "
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGODB_URI)
          .then(() => { console.log('✅ Database connection successful'); process.exit(0); })
          .catch(err => { console.error('❌ Database connection failed:', err.message); process.exit(1); });
    "; then
        log_success "Database connectivity verified"
    else
        log_error "Cannot connect to database"
        return 1
    fi
    
    log_success "Environment validation completed"
}

# Function to check migration safety
check_migration_safety() {
    log_info "🛡️  Performing safety checks..."
    
    # Check if there are any surveys that might cause issues
    cd "$PROJECT_ROOT"
    
    node -e "
        const mongoose = require('mongoose');
        const Survey = require('./models/Survey');
        
        async function safetyCheck() {
            try {
                await mongoose.connect(process.env.MONGODB_URI);
                
                // Check for surveys with problematic data
                const totalSurveys = await Survey.countDocuments();
                const surveysWithEmptySlug = await Survey.countDocuments({ slug: { \$in: ['', null] } });
                const surveysWithLongSlug = await Survey.countDocuments({ slug: { \$regex: /.{100,}/ } });
                
                console.log('Safety Check Results:');
                console.log('  Total surveys:', totalSurveys);
                console.log('  Surveys with empty/null slug:', surveysWithEmptySlug);
                console.log('  Surveys with very long slug:', surveysWithLongSlug);
                
                if (surveysWithEmptySlug > 0) {
                    console.warn('⚠️  Warning: Found surveys with empty or null slugs');
                }
                
                if (surveysWithLongSlug > 0) {
                    console.warn('⚠️  Warning: Found surveys with very long slugs');
                }
                
                process.exit(0);
            } catch (error) {
                console.error('Safety check failed:', error.message);
                process.exit(1);
            } finally {
                await mongoose.disconnect();
            }
        }
        
        safetyCheck();
    "
    
    log_success "Safety checks completed"
}

# Main execution
main() {
    log_info "Environment: $ENVIRONMENT"
    log_info "Project root: $PROJECT_ROOT"
    log_info "Backup directory: $BACKUP_DIR"
    
    # Step 1: Validate environment
    if ! validate_environment; then
        log_error "Environment validation failed"
        exit 1
    fi
    
    # Step 2: Create backup (only in production-like environments)
    create_backup
    
    # Step 3: Run safety checks
    if ! check_migration_safety; then
        log_error "Safety checks failed"
        exit 1
    fi
    
    # Step 4: Run migration analysis
    if ! run_migration_analysis; then
        log_error "Migration analysis failed"
        exit 1
    fi
    
    log_success "🎉 Pre-deployment checks completed successfully!"
    log_info "Ready for deployment to $ENVIRONMENT"
    
    # Export backup path for post-deploy script
    echo "BACKUP_PATH=$BACKUP_DIR" > /tmp/deploy-backup-path
}

# Run main function
main "$@"