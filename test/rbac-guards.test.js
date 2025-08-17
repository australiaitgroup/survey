const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { 
    authenticateUser, 
    requireSuperAdmin, 
    enforceCompanyScoping,
    applyScopingToQuery,
    canAccessResource
} = require('../middlewares/rbacGuards');
const { JWT_SECRET } = require('../middlewares/jwtAuth');
const User = require('../models/User');
const Company = require('../models/Company');

describe('RBAC Guards', () => {
    let mongoServer;
    let app;
    let companyAdmin;
    let superAdmin;
    let testCompany;
    let companyAdminToken;
    let superAdminToken;

    beforeAll(async () => {
        // Setup in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Create test app
        app = express();
        app.use(express.json());

        // Create test data
        testCompany = new Company({
            name: 'Test Company',
            slug: 'test-company',
            contactEmail: 'test@company.com',
        });
        await testCompany.save();

        companyAdmin = new User({
            name: 'Company Admin',
            email: 'admin@company.com',
            role: 'admin',
            companyId: testCompany._id,
        });
        await companyAdmin.save();

        superAdmin = new User({
            name: 'Super Admin',
            email: 'super@admin.com',
            role: 'superAdmin',
        });
        await superAdmin.save();

        // Generate tokens
        companyAdminToken = jwt.sign({
            id: companyAdmin._id,
            email: companyAdmin.email,
            role: companyAdmin.role,
        }, JWT_SECRET);

        superAdminToken = jwt.sign({
            id: superAdmin._id,
            email: superAdmin.email,
            role: superAdmin.role,
        }, JWT_SECRET);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('Authentication Middleware', () => {
        beforeAll(() => {
            app.get('/test-auth', authenticateUser, (req, res) => {
                res.json({ user: req.user });
            });
        });

        test('should authenticate valid company admin token', async () => {
            const response = await request(app)
                .get('/test-auth')
                .set('Authorization', `Bearer ${companyAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.user.role).toBe('admin');
            expect(response.body.user.companyId).toBe(testCompany._id.toString());
        });

        test('should authenticate valid super admin token', async () => {
            const response = await request(app)
                .get('/test-auth')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.user.role).toBe('superAdmin');
        });

        test('should reject invalid token', async () => {
            const response = await request(app)
                .get('/test-auth')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });

        test('should reject missing token', async () => {
            const response = await request(app)
                .get('/test-auth');

            expect(response.status).toBe(401);
        });
    });

    describe('Super Admin Middleware', () => {
        beforeAll(() => {
            app.get('/test-super-admin', authenticateUser, requireSuperAdmin, (req, res) => {
                res.json({ message: 'Super admin access granted' });
            });
        });

        test('should allow super admin access', async () => {
            const response = await request(app)
                .get('/test-super-admin')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Super admin access granted');
        });

        test('should deny company admin access', async () => {
            const response = await request(app)
                .get('/test-super-admin')
                .set('Authorization', `Bearer ${companyAdminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.code).toBe('SUPER_ADMIN_REQUIRED');
        });
    });

    describe('Company Scoping Middleware', () => {
        beforeAll(() => {
            app.get('/test-scoping', authenticateUser, enforceCompanyScoping, (req, res) => {
                res.json({ 
                    companyFilter: req.companyFilter,
                    isCrossTenantRequest: req.isCrossTenantRequest 
                });
            });

            app.get('/sa/test-scoping', authenticateUser, enforceCompanyScoping, (req, res) => {
                res.json({ 
                    companyFilter: req.companyFilter,
                    isCrossTenantRequest: req.isCrossTenantRequest 
                });
            });
        });

        test('should apply company scoping for company admin', async () => {
            const response = await request(app)
                .get('/test-scoping')
                .set('Authorization', `Bearer ${companyAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.companyFilter).toEqual({ companyId: testCompany._id.toString() });
            expect(response.body.isCrossTenantRequest).toBe(false);
        });

        test('should allow cross-tenant access for super admin on /sa/* routes', async () => {
            const response = await request(app)
                .get('/sa/test-scoping')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.isCrossTenantRequest).toBe(true);
        });

        test('should deny company admin access to /sa/* routes', async () => {
            const response = await request(app)
                .get('/sa/test-scoping')
                .set('Authorization', `Bearer ${companyAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.companyFilter).toEqual({ companyId: testCompany._id.toString() });
            expect(response.body.isCrossTenantRequest).toBe(false);
        });
    });

    describe('Query Scoping Utilities', () => {
        test('applyScopingToQuery should add company filter for regular requests', () => {
            const mockReq = {
                user: { companyId: testCompany._id.toString() },
                isCrossTenantRequest: false,
            };

            const query = { name: 'test' };
            const scopedQuery = applyScopingToQuery(query, mockReq);

            expect(scopedQuery).toEqual({
                name: 'test',
                companyId: testCompany._id.toString(),
            });
        });

        test('applyScopingToQuery should not modify query for cross-tenant requests', () => {
            const mockReq = {
                user: { role: 'superAdmin' },
                isCrossTenantRequest: true,
            };

            const query = { name: 'test' };
            const scopedQuery = applyScopingToQuery(query, mockReq);

            expect(scopedQuery).toEqual({ name: 'test' });
        });

        test('canAccessResource should allow super admin cross-tenant access', () => {
            const mockReq = {
                user: { role: 'superAdmin', companyId: 'different-company' },
                isCrossTenantRequest: true,
            };

            const result = canAccessResource(mockReq, testCompany._id.toString());
            expect(result).toBe(true);
        });

        test('canAccessResource should restrict company admin to own company', () => {
            const mockReq = {
                user: { role: 'admin', companyId: testCompany._id.toString() },
                isCrossTenantRequest: false,
            };

            // Access to own company - should be allowed
            const ownResult = canAccessResource(mockReq, testCompany._id.toString());
            expect(ownResult).toBe(true);

            // Access to different company - should be denied
            const otherResult = canAccessResource(mockReq, 'different-company-id');
            expect(otherResult).toBe(false);
        });
    });

    describe('Cross-tenant Route Access', () => {
        beforeAll(() => {
            // Simulate super admin route
            app.get('/sa/companies', authenticateUser, requireSuperAdmin, (req, res) => {
                res.json({ message: 'Cross-tenant companies access' });
            });

            // Simulate regular company route
            app.get('/companies', authenticateUser, enforceCompanyScoping, (req, res) => {
                res.json({ 
                    message: 'Company scoped access',
                    companyId: req.user.companyId 
                });
            });
        });

        test('super admin should access cross-tenant routes', async () => {
            const response = await request(app)
                .get('/sa/companies')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Cross-tenant companies access');
        });

        test('company admin should not access cross-tenant routes', async () => {
            const response = await request(app)
                .get('/sa/companies')
                .set('Authorization', `Bearer ${companyAdminToken}`);

            expect(response.status).toBe(403);
        });

        test('company admin should access company-scoped routes', async () => {
            const response = await request(app)
                .get('/companies')
                .set('Authorization', `Bearer ${companyAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.companyId).toBe(testCompany._id.toString());
        });
    });

    describe('Edge Cases', () => {
        test('should handle user without company for regular routes', async () => {
            // Create user without company
            const userWithoutCompany = new User({
                name: 'No Company User',
                email: 'nocompany@user.com',
                role: 'user',
            });
            await userWithoutCompany.save();

            const tokenWithoutCompany = jwt.sign({
                id: userWithoutCompany._id,
                email: userWithoutCompany.email,
                role: userWithoutCompany.role,
            }, JWT_SECRET);

            const response = await request(app)
                .get('/companies')
                .set('Authorization', `Bearer ${tokenWithoutCompany}`);

            expect(response.status).toBe(403);
            expect(response.body.code).toBe('NO_COMPANY_ASSOCIATION');
        });

        test('should handle inactive user', async () => {
            // Create inactive user
            const inactiveUser = new User({
                name: 'Inactive User',
                email: 'inactive@user.com',
                role: 'admin',
                companyId: testCompany._id,
                isActive: false,
            });
            await inactiveUser.save();

            const inactiveToken = jwt.sign({
                id: inactiveUser._id,
                email: inactiveUser.email,
                role: inactiveUser.role,
            }, JWT_SECRET);

            const response = await request(app)
                .get('/test-auth')
                .set('Authorization', `Bearer ${inactiveToken}`);

            expect(response.status).toBe(401);
            expect(response.body.code).toBe('USER_NOT_FOUND');
        });
    });
});