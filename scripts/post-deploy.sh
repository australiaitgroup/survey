#!/bin/bash

# Post-deployment script for Survey Multi-tenant Migration
# This script runs after successful deployment to UAT/PROD environments

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
ENVIRONMENT=${DEPLOY_ENV:-"unknown"}

log_info "🚀 Starting post-deployment migration for environment: $ENVIRONMENT"

# Function to check if we're in a deployment environment
is_production_like() {
    [[ "$ENVIRONMENT" == "uat" ]] || [[ "$ENVIRONMENT" == "prod" ]] || [[ "$ENVIRONMENT" == "production" ]]
}

# Function to wait for application to be ready
wait_for_app() {
    log_info "⏳ Waiting for application to be ready..."
    
    local max_attempts=30
    local attempt=1
    local app_url="${APP_URL:-http://localhost:5050}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$app_url/api/health" >/dev/null 2>&1; then
            log_success "Application is ready"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Application not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Application failed to become ready after $max_attempts attempts"
    return 1
}

# Function to run database migration
run_migration() {
    log_info "🔄 Running database migration..."
    
    cd "$PROJECT_ROOT"
    
    # Set migration configuration for production
    export AUTO_MIGRATE_SURVEYS=true
    export MIGRATION_DRY_RUN=false
    export MIGRATION_LOG_LEVEL=info
    export MIGRATION_BACKUP=true
    
    # Run the migration
    if node scripts/auto-migrate-surveys.js; then
        log_success "Database migration completed successfully"
    else
        log_error "Database migration failed"
        return 1
    fi
}

# Function to verify migration results
verify_migration() {
    log_info "✅ Verifying migration results..."
    
    cd "$PROJECT_ROOT"
    
    node -e "
        const mongoose = require('mongoose');
        const Survey = require('./models/Survey');
        const Company = require('./models/Company');
        
        async function verify() {
            try {
                await mongoose.connect(process.env.MONGODB_URI);
                
                const totalSurveys = await Survey.countDocuments();
                const surveysWithCompanyId = await Survey.countDocuments({ 
                    companyId: { \$exists: true, \$ne: null } 
                });
                const surveysWithoutCompanyId = totalSurveys - surveysWithCompanyId;
                const totalCompanies = await Company.countDocuments();
                
                console.log('Migration Verification Results:');
                console.log('  Total surveys:', totalSurveys);
                console.log('  Surveys with companyId:', surveysWithCompanyId);
                console.log('  Surveys without companyId:', surveysWithoutCompanyId);
                console.log('  Total companies:', totalCompanies);
                
                if (surveysWithoutCompanyId > 0) {
                    console.error('❌ Migration verification failed: Some surveys still lack companyId');
                    process.exit(1);
                } else {
                    console.log('✅ Migration verification passed: All surveys have companyId');
                }
                
                process.exit(0);
            } catch (error) {
                console.error('Verification failed:', error.message);
                process.exit(1);
            } finally {
                await mongoose.disconnect();
            }
        }
        
        verify();
    "
    
    log_success "Migration verification completed"
}

# Function to run smoke tests
run_smoke_tests() {
    log_info "🧪 Running smoke tests..."
    
    local app_url="${APP_URL:-http://localhost:5050}"
    
    # Test 1: Check if API endpoints are working
    log_info "Testing basic API functionality..."
    
    # Test health endpoint
    if ! curl -f -s "$app_url/api/health" >/dev/null; then
        log_error "Health endpoint test failed"
        return 1
    fi
    
    # Test if we can access a multi-tenant route (if companies exist)
    cd "$PROJECT_ROOT"
    local first_company_slug=$(node -e "
        const mongoose = require('mongoose');
        const Company = require('./models/Company');
        mongoose.connect(process.env.MONGODB_URI)
            .then(() => Company.findOne({}, 'slug'))
            .then(company => {
                if (company) console.log(company.slug);
                process.exit(0);
            })
            .catch(() => process.exit(1));
    " 2>/dev/null)
    
    if [[ -n "$first_company_slug" ]]; then
        log_info "Testing multi-tenant route with company: $first_company_slug"
        # Just test that the route doesn't return a 500 error
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$app_url/$first_company_slug/api/health" 2>/dev/null || echo "000")
        if [[ "$status_code" != "200" ]] && [[ "$status_code" != "404" ]]; then
            log_error "Multi-tenant route test failed (status: $status_code)"
            return 1
        fi
    fi
    
    log_success "Smoke tests passed"
}

# Function to send deployment notification
send_notification() {
    local status="$1"
    local message="$2"
    
    log_info "📢 Sending deployment notification..."
    
    # You can customize this to send to Slack, email, etc.
    local notification_payload=$(cat <<EOF
{
    "environment": "$ENVIRONMENT",
    "timestamp": "$(date -Iseconds)",
    "status": "$status",
    "message": "$message",
    "migration_completed": true
}
EOF
)
    
    # Example: Send to webhook (uncomment and configure as needed)
    # if [[ -n "$DEPLOYMENT_WEBHOOK_URL" ]]; then
    #     curl -X POST "$DEPLOYMENT_WEBHOOK_URL" \
    #          -H "Content-Type: application/json" \
    #          -d "$notification_payload" \
    #          --max-time 10 || log_warn "Failed to send webhook notification"
    # fi
    
    log_info "Deployment notification prepared"
    echo "$notification_payload"
}

# Function to cleanup old backups
cleanup_old_backups() {
    if is_production_like; then
        log_info "🧹 Cleaning up old backups..."
        
        local backup_root="${PROJECT_ROOT}/backups"
        if [[ -d "$backup_root" ]]; then
            # Keep only the latest 5 backups
            find "$backup_root" -maxdepth 1 -type d -name "????????_??????" | \
            sort -r | tail -n +6 | xargs -r rm -rf
            
            log_success "Old backups cleaned up"
        fi
    fi
}

# Function to handle rollback if needed
handle_rollback() {
    log_error "💥 Deployment verification failed!"
    
    if [[ -f "/tmp/deploy-backup-path" ]]; then
        local backup_path=$(cat /tmp/deploy-backup-path | cut -d'=' -f2)
        log_warn "Backup available at: $backup_path"
        log_warn "Consider rolling back if issues persist"
    fi
    
    send_notification "failed" "Post-deployment migration failed"
    exit 1
}

# Main execution
main() {
    log_info "Environment: $ENVIRONMENT"
    log_info "Project root: $PROJECT_ROOT"
    
    # Step 1: Wait for application to be ready
    if ! wait_for_app; then
        handle_rollback
    fi
    
    # Step 2: Run database migration
    if ! run_migration; then
        handle_rollback
    fi
    
    # Step 3: Verify migration results
    if ! verify_migration; then
        handle_rollback
    fi
    
    # Step 4: Run smoke tests
    if ! run_smoke_tests; then
        handle_rollback
    fi
    
    # Step 5: Cleanup old backups
    cleanup_old_backups
    
    # Step 6: Send success notification
    send_notification "success" "Deployment and migration completed successfully"
    
    log_success "🎉 Post-deployment migration completed successfully!"
    log_info "System is ready and fully migrated to multi-tenant architecture"
    
    # Clean up temporary files
    rm -f /tmp/deploy-backup-path
}

# Trap errors and handle rollback
trap 'handle_rollback' ERR

# Run main function
main "$@"