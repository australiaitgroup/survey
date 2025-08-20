#!/bin/bash

# Frontend S3 Migration Deployment Script
set -e

echo "🚀 Starting Frontend migration to S3..."

# Configuration
BUCKET_NAME="${S3_BUCKET_NAME:-jr-sigma-survey-prod}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
CLIENT_PATH="client"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if client directory exists
if [ ! -d "$CLIENT_PATH" ]; then
    print_error "Client directory not found: $CLIENT_PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "$CLIENT_PATH/package.json" ]; then
    print_error "package.json not found in $CLIENT_PATH"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed or not in PATH"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    print_info "Please run: aws configure"
    exit 1
fi

print_info "Configuration:"
print_info "  S3 Bucket: $BUCKET_NAME"
print_info "  AWS Region: $AWS_REGION"
print_info "  Client Path: $CLIENT_PATH"

# Navigate to client directory
cd "$CLIENT_PATH"

print_status "Installing dependencies..."
npm install

print_status "Building production build..."
NODE_ENV=production npm run build

# Verify build output
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Build completed successfully"

# List build contents
print_info "Build contents:"
ls -la dist/

print_status "Starting S3 deployment..."

# Backup existing Super Admin files first (if they exist)
print_info "Checking for existing Super Admin files..."
if aws s3 ls s3://${BUCKET_NAME}/super-admin/ --region ${AWS_REGION} &> /dev/null; then
    print_warning "Super Admin files detected - creating backup..."
    aws s3 sync s3://${BUCKET_NAME}/super-admin/ s3://${BUCKET_NAME}/backup/super-admin-$(date +%Y%m%d_%H%M%S)/ --region ${AWS_REGION}
    print_status "Super Admin backup created"
fi

# Upload static assets (excluding HTML and JSON files)
print_info "Uploading static assets..."
aws s3 sync dist/ s3://${BUCKET_NAME}/ \
    --region ${AWS_REGION} \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "super-admin/*"

# Upload HTML and JSON files with no-cache headers
print_info "Uploading HTML and JSON files..."
aws s3 sync dist/ s3://${BUCKET_NAME}/ \
    --region ${AWS_REGION} \
    --include "*.html" \
    --include "*.json" \
    --exclude "super-admin/*" \
    --cache-control "no-cache, no-store, must-revalidate"

# Set specific content type for index.html
print_info "Setting content type for index.html..."
aws s3 cp s3://${BUCKET_NAME}/index.html \
    s3://${BUCKET_NAME}/index.html \
    --region ${AWS_REGION} \
    --content-type "text/html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE

# Restore Super Admin files if they existed
if aws s3 ls s3://${BUCKET_NAME}/backup/super-admin* --region ${AWS_REGION} &> /dev/null; then
    print_info "Restoring Super Admin files..."
    LATEST_BACKUP=$(aws s3 ls s3://${BUCKET_NAME}/backup/ --region ${AWS_REGION} | grep super-admin | sort | tail -n 1 | awk '{print $2}')
    if [ ! -z "$LATEST_BACKUP" ]; then
        aws s3 sync s3://${BUCKET_NAME}/backup/${LATEST_BACKUP} s3://${BUCKET_NAME}/super-admin/ --region ${AWS_REGION}
        print_status "Super Admin files restored"
    fi
fi

print_status "S3 deployment completed successfully!"

# Test the deployment
print_info "Testing deployment..."
S3_WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

if curl -s --head "$S3_WEBSITE_URL" | grep -q "200 OK"; then
    print_status "Deployment test successful!"
else
    print_warning "Deployment test inconclusive - manual verification may be needed"
fi

echo
print_status "Frontend migration to S3 completed!"
echo
print_info "Access URLs:"
print_info "  S3 Website: $S3_WEBSITE_URL"
print_info "  Domain (after Nginx update): https://sigma.jiangren.com.au"
print_info "  Super Admin: https://sigma.jiangren.com.au/super-admin"
echo
print_warning "Next steps:"
print_warning "1. Update Nginx configuration to proxy to S3"
print_warning "2. Test domain access"
print_warning "3. Stop Docker containers on EC2 (if migration successful)"
echo
print_info "To update Nginx automatically, use the Jenkins pipeline with UPDATE_NGINX=true"
