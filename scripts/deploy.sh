#!/bin/bash

# Deployment script for Survey Application
# This script sets up the environment and initializes necessary data

set -e

echo "🚀 Survey Application Deployment Script"
echo "======================================="

# Detect environment from parameter or default to production
ENVIRONMENT=${1:-production}
echo "📦 Deploying for environment: $ENVIRONMENT"

# Load environment-specific variables
if [ "$ENVIRONMENT" = "uat" ]; then
    export SUPER_ADMIN_EMAIL=${UAT_SUPER_ADMIN_EMAIL:-"superadmin@uat.system.com"}
    export SUPER_ADMIN_PASSWORD=${UAT_SUPER_ADMIN_PASSWORD:-"SuperAdmin@UAT2024!"}
    export MONGODB_URI=${UAT_MONGODB_URI:-"mongodb://localhost:27017/survey_uat"}
elif [ "$ENVIRONMENT" = "production" ]; then
    export SUPER_ADMIN_EMAIL=${PROD_SUPER_ADMIN_EMAIL:-"superadmin@prod.system.com"}
    export SUPER_ADMIN_PASSWORD=${PROD_SUPER_ADMIN_PASSWORD:-"SuperAdmin@PROD2024!"}
    export MONGODB_URI=${PROD_MONGODB_URI:-"mongodb://localhost:27017/survey_prod"}
else
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "   Usage: ./deploy.sh [uat|production]"
    exit 1
fi

export SUPER_ADMIN_NAME="System Administrator"
export NODE_ENV=$ENVIRONMENT

echo ""
echo "📋 Configuration:"
echo "  - MongoDB URI: $MONGODB_URI"
echo "  - Super Admin Email: $SUPER_ADMIN_EMAIL"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Build frontend if it exists
if [ -d "client" ] && [ ! -d "client/dist" ]; then
    echo "🔨 Building frontend..."
    cd client
    npm install
    npm run build
    cd ..
fi

# Run database migrations if they exist
if [ -d "migrations" ]; then
    echo "🗄️ Running database migrations..."
    npm run migrate || true
fi

# Start the application
echo ""
echo "🎯 Starting application..."
echo "======================================="

# The application will auto-initialize super admin on startup
npm start

echo ""
echo "✅ Deployment complete!"
echo "📧 Super Admin Email: $SUPER_ADMIN_EMAIL"
echo "🌐 Application URL: http://localhost:5050"
echo "🔐 Please change the super admin password after first login!"