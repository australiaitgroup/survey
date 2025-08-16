#!/usr/bin/env node

/**
 * Script to initialize default super admin account
 * This will create a default super admin if it doesn't exist
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Company = require('../models/Company');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

// Default super admin credentials
const DEFAULT_SUPER_ADMIN = {
    email: 'superadmin@system.com',
    password: 'SuperAdmin@2024!',
    name: 'System Administrator',
    role: 'superAdmin'
};

async function initSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connected to MongoDB');

        // Check if super admin already exists
        let superAdmin = await User.findOne({ email: DEFAULT_SUPER_ADMIN.email });
        
        if (superAdmin) {
            console.log('ℹ️  Super Admin already exists');
            
            // Update role to superAdmin if needed
            if (superAdmin.role !== 'superAdmin') {
                superAdmin.role = 'superAdmin';
                await superAdmin.save();
                console.log('✅ Updated existing user to Super Admin role');
            }
        } else {
            // Check if system company exists
            let systemCompany = await Company.findOne({ slug: 'system' });
            
            if (!systemCompany) {
                // Create system company
                systemCompany = new Company({
                    name: 'System',
                    slug: 'system',
                    industry: 'Technology',
                    size: '1-10',
                    description: 'System administration company',
                    settings: {
                        themeColor: '#3B82F6',
                        customLogoEnabled: false,
                        defaultLanguage: 'en',
                        autoNotifyCandidate: false
                    },
                    subscription: {
                        type: 'enterprise',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                        features: {
                            maxSurveys: -1, // unlimited
                            maxResponses: -1, // unlimited
                            maxUsers: -1, // unlimited
                            customBranding: true,
                            apiAccess: true,
                            exportData: true,
                            prioritySupport: true
                        }
                    }
                });
                await systemCompany.save();
                console.log('✅ Created system company');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(DEFAULT_SUPER_ADMIN.password, 10);

            // Create super admin user
            superAdmin = new User({
                name: DEFAULT_SUPER_ADMIN.name,
                email: DEFAULT_SUPER_ADMIN.email,
                password: hashedPassword,
                role: DEFAULT_SUPER_ADMIN.role,
                company: systemCompany._id,
                isEmailVerified: true,
                createdAt: new Date(),
                lastLogin: null,
                settings: {
                    language: 'en',
                    notifications: {
                        email: false,
                        inApp: true
                    }
                }
            });

            await superAdmin.save();
            console.log('✅ Created Super Admin user');
        }

        console.log('\n========================================');
        console.log('🔐 Super Admin Account Details:');
        console.log('========================================');
        console.log(`📧 Email: ${DEFAULT_SUPER_ADMIN.email}`);
        console.log(`🔑 Password: ${DEFAULT_SUPER_ADMIN.password}`);
        console.log(`🌐 Login URL: http://localhost:5050/super-admin`);
        console.log('========================================\n');
        console.log('⚠️  IMPORTANT: Please change the password after first login!');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
    }
}

// Run the initialization
initSuperAdmin();