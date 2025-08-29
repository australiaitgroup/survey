#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5050';
const API_BASE = `${BASE_URL}/api/sa`;

// Mock super admin token - in real implementation this would be from login
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NTBkZjI2YzJmZDY4NjI3ZGRlNjQzMCIsImVtYWlsIjoic3VwZXJhZG1pbkBzeXN0ZW0uY29tIiwicm9sZSI6InN1cGVyQWRtaW4iLCJpYXQiOjE3MzMyNzQ5MTgsImV4cCI6MTczMzM2MTMxOH0.test';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${mockToken}`
};

async function testUserAPI() {
    console.log('🚀 Testing User Management API...\n');

    try {
        // Test 1: Get users list
        console.log('📋 Test 1: Getting users list...');
        try {
            const usersResponse = await axios.get(`${API_BASE}/users`, { headers });
            console.log('✅ Users list API works!');
            console.log(`   Found ${usersResponse.data.data?.length || 0} users`);
            console.log(`   Total: ${usersResponse.data.pagination?.total || 0}`);
        } catch (error) {
            console.log('❌ Users list API failed:', error.response?.data?.error || error.message);
        }

        // Test 2: Create a test user (if we have the endpoint)
        console.log('\n👤 Test 2: Creating test user...');
        const testUser = {
            name: 'Test User',
            email: 'testuser@example.com',
            role: 'user',
            password: 'temppassword123',
            companyId: null
        };

        let testUserId = null;
        try {
            // First try to create via admin endpoint (if exists)
            const createResponse = await axios.post(`${BASE_URL}/api/admin/users`, testUser, { headers });
            testUserId = createResponse.data.data?._id;
            console.log('✅ Test user created!');
            console.log(`   User ID: ${testUserId}`);
        } catch (error) {
            console.log('⚠️ Create user API not available or failed:', error.response?.data?.error || error.message);
            
            // Try to find existing user for testing update
            try {
                const usersResponse = await axios.get(`${API_BASE}/users?limit=1`, { headers });
                if (usersResponse.data.data && usersResponse.data.data.length > 0) {
                    testUserId = usersResponse.data.data[0]._id;
                    console.log(`   Using existing user for testing: ${testUserId}`);
                }
            } catch (err) {
                console.log('❌ Cannot find existing user for testing');
            }
        }

        if (!testUserId) {
            console.log('❌ No user available for testing update functionality');
            return;
        }

        // Test 3: Get specific user
        console.log('\n🔍 Test 3: Getting specific user...');
        try {
            const userResponse = await axios.get(`${API_BASE}/users/${testUserId}`, { headers });
            console.log('✅ Get user API works!');
            console.log(`   User: ${userResponse.data.data.name} (${userResponse.data.data.email})`);
            console.log(`   Role: ${userResponse.data.data.role}`);
            console.log(`   Status: ${userResponse.data.data.isActive ? 'Active' : 'Inactive'}`);
        } catch (error) {
            console.log('❌ Get user API failed:', error.response?.data?.error || error.message);
        }

        // Test 4: Update user
        console.log('\n✏️ Test 4: Updating user...');
        const updateData = {
            name: 'Updated Test User',
            department: 'Testing Department',
            role: 'teacher'
        };

        try {
            const updateResponse = await axios.put(`${API_BASE}/users/${testUserId}`, updateData, { headers });
            console.log('✅ Update user API works!');
            console.log(`   Updated user: ${updateResponse.data.data.name}`);
            console.log(`   Department: ${updateResponse.data.data.department || 'Not set'}`);
            console.log(`   Role: ${updateResponse.data.data.role}`);
        } catch (error) {
            console.log('❌ Update user API failed:', error.response?.data?.error || error.message);
            console.log('   Status:', error.response?.status);
            console.log('   Response:', error.response?.data);
        }

        // Test 5: Reset password
        console.log('\n🔑 Test 5: Testing password reset...');
        try {
            const resetResponse = await axios.post(`${API_BASE}/users/${testUserId}/reset-password`, {}, { headers });
            console.log('✅ Password reset API works!');
            console.log(`   Message: ${resetResponse.data.message}`);
            if (resetResponse.data.data?.temporaryPassword) {
                console.log(`   Temporary password: ${resetResponse.data.data.temporaryPassword}`);
            }
        } catch (error) {
            console.log('❌ Password reset API failed:', error.response?.data?.error || error.message);
        }

        // Test 6: Update user status
        console.log('\n🔄 Test 6: Testing user status toggle...');
        try {
            const statusResponse = await axios.put(`${API_BASE}/users/${testUserId}/status`, { isActive: false }, { headers });
            console.log('✅ User status API works!');
            console.log(`   Message: ${statusResponse.data.message}`);
            console.log(`   New status: ${statusResponse.data.data.isActive ? 'Active' : 'Inactive'}`);
            
            // Toggle back
            await axios.put(`${API_BASE}/users/${testUserId}/status`, { isActive: true }, { headers });
            console.log('   Status toggled back to active');
        } catch (error) {
            console.log('❌ User status API failed:', error.response?.data?.error || error.message);
        }

        // Test 7: Get user stats
        console.log('\n📊 Test 7: Testing user statistics...');
        try {
            const statsResponse = await axios.get(`${API_BASE}/users/${testUserId}/stats`, { headers });
            console.log('✅ User stats API works!');
            console.log(`   Surveys: ${statsResponse.data.data.surveyCount}`);
            console.log(`   Responses: ${statsResponse.data.data.responseCount}`);
            console.log(`   Question Banks: ${statsResponse.data.data.questionBankCount}`);
            console.log(`   Last Activity: ${new Date(statsResponse.data.data.lastActivity).toLocaleString()}`);
        } catch (error) {
            console.log('❌ User stats API failed:', error.response?.data?.error || error.message);
        }

        console.log('\n🎉 API Testing Complete!');

    } catch (error) {
        console.error('💥 Unexpected error during testing:', error.message);
    }
}

// Run the test
testUserAPI().catch(console.error);