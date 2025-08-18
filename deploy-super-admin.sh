#!/bin/bash

# Super Admin S3 Deployment Script
set -e

echo "🚀 Starting Super Admin deployment to S3..."

# Configuration
BUCKET_NAME="${S3_BUCKET_NAME:-jr-sigma-survey-prod}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
SUPER_ADMIN_PATH="super-admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" = "your-bucket-name" ]; then
    print_error "Please set S3_BUCKET_NAME environment variable"
    exit 1
fi

# Navigate to super-admin directory
cd "$(dirname "$0")/super-admin"

print_status "Building Super Admin application..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build the application
NODE_ENV=production npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Build completed successfully!"

# Sync files to S3
print_status "Uploading files to S3..."

# Upload with proper content types and cache headers
aws s3 sync dist/ s3://$BUCKET_NAME/$SUPER_ADMIN_PATH/ \
    --region $AWS_REGION \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML files with no-cache headers
aws s3 sync dist/ s3://$BUCKET_NAME/$SUPER_ADMIN_PATH/ \
    --region $AWS_REGION \
    --include "*.html" \
    --include "*.json" \
    --cache-control "no-cache, no-store, must-revalidate"

# Set proper content types for specific files
aws s3 cp s3://$BUCKET_NAME/$SUPER_ADMIN_PATH/index.html s3://$BUCKET_NAME/$SUPER_ADMIN_PATH/index.html \
    --region $AWS_REGION \
    --content-type "text/html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE

print_status "Files uploaded to S3 successfully!"

print_status "🎉 Super Admin deployment completed!"
print_status "Your application should be available at: http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com/$SUPER_ADMIN_PATH"

echo ""
echo "Next steps:"
echo "1. Make sure your S3 bucket is configured for static website hosting"
echo "2. Set up proper routing rules if needed"
echo "3. Configure custom domain if required"
