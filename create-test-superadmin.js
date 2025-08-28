#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import User model
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if superadmin already exists
        const existingSuperAdmin = await User.findOne({ email: 'superadmin@system.com' });
        
        if (existingSuperAdmin) {
            console.log('Super admin already exists!');
            console.log('Email:', existingSuperAdmin.email);
            console.log('Role:', existingSuperAdmin.role);
            console.log('ID:', existingSuperAdmin._id);
            
            // Generate JWT token for testing
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
            
            const token = jwt.sign(
                {
                    id: existingSuperAdmin._id,
                    email: existingSuperAdmin.email,
                    role: existingSuperAdmin.role,
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log('\nTest token for API calls:');
            console.log(token);
            
            return;
        }

        // Hash password
        const password = 'superadmin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create super admin user
        const superAdmin = new User({
            name: 'Super Administrator',
            email: 'superadmin@system.com',
            password: hashedPassword,
            role: 'superAdmin',
            isActive: true,
        });

        await superAdmin.save();
        console.log('✅ Super admin created successfully!');
        console.log('Email: superadmin@system.com');
        console.log('Password: superadmin123');
        console.log('Role: superAdmin');
        console.log('ID:', superAdmin._id);

        // Generate JWT token for testing
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
        
        const token = jwt.sign(
            {
                id: superAdmin._id,
                email: superAdmin.email,
                role: superAdmin.role,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('\nTest token for API calls:');
        console.log(token);

        // Create some test users for testing user management
        console.log('\nCreating test users...');
        
        const testUsers = [
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: await bcrypt.hash('password123', saltRounds),
                role: 'admin',
                department: 'Engineering',
                isActive: true,
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                password: await bcrypt.hash('password123', saltRounds),
                role: 'teacher',
                department: 'Education',
                studentId: 'T001',
                isActive: true,
            },
            {
                name: 'Bob Wilson',
                email: 'bob.wilson@example.com',
                password: await bcrypt.hash('password123', saltRounds),
                role: 'user',
                department: 'Sales',
                isActive: false,
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`Created test user: ${userData.name} (${userData.email})`);
            } else {
                console.log(`Test user already exists: ${userData.name} (${userData.email})`);
            }
        }

        console.log('\n🎉 Setup complete!');

    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

createSuperAdmin();