#!/bin/bash

# Script to add Super Admin S3 proxy configuration to Nginx
# Usage: ./apply-nginx-super-admin-proxy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Super Admin S3 Nginx Proxy Setup ===${NC}"

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    echo -e "${YELLOW}Running as root${NC}"
elif sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}sudo access available${NC}"
else
    echo -e "${RED}Error: This script requires sudo access${NC}"
    echo "Please run with: sudo ./apply-nginx-super-admin-proxy.sh"
    exit 1
fi

# Find Nginx configuration file for sigma.jiangren.com.au
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_CONF_FILE=""

# Common possible configuration file names
POSSIBLE_CONF_FILES=(
    "sigma.jiangren.com.au"
    "sigma"
    "default"
    "jiangren"
    "survey"
)

echo "Searching for Nginx configuration file..."
for conf_file in "${POSSIBLE_CONF_FILES[@]}"; do
    if [[ -f "$NGINX_SITES_DIR/$conf_file" ]]; then
        # Check if this file contains sigma.jiangren.com.au
        if grep -q "sigma\.jiangren\.com\.au" "$NGINX_SITES_DIR/$conf_file" 2>/dev/null; then
            NGINX_CONF_FILE="$NGINX_SITES_DIR/$conf_file"
            echo -e "${GREEN}Found configuration file: $NGINX_CONF_FILE${NC}"
            break
        fi
    fi
done

if [[ -z "$NGINX_CONF_FILE" ]]; then
    echo -e "${RED}Error: Could not find Nginx configuration file for sigma.jiangren.com.au${NC}"
    echo "Please specify the configuration file manually:"
    echo "Available files in $NGINX_SITES_DIR:"
    ls -la "$NGINX_SITES_DIR/" 2>/dev/null || echo "Directory not accessible"
    exit 1
fi

# Backup original configuration
BACKUP_FILE="${NGINX_CONF_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "Creating backup: $BACKUP_FILE"
sudo cp "$NGINX_CONF_FILE" "$BACKUP_FILE"

# Check if super-admin location already exists
if grep -q "location /super-admin/" "$NGINX_CONF_FILE" 2>/dev/null; then
    echo -e "${YELLOW}Warning: /super-admin/ location already exists in configuration${NC}"
    echo "Please review the configuration manually or remove existing super-admin configuration first"
    exit 1
fi

# Add the super-admin proxy configuration
echo "Adding Super Admin proxy configuration..."

# Create temporary file with the new location block
TEMP_LOCATION_FILE="/tmp/super-admin-location.conf"
cat > "$TEMP_LOCATION_FILE" << 'EOF'

    # Super Admin S3 Proxy - Added automatically
    location /super-admin/ {
        proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/;
        proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
            proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
EOF

# Insert the location block before the last closing brace of the server block
# Find the last occurrence of "}" which should be the server block closing
TEMP_CONF_FILE="/tmp/nginx_updated.conf"
sudo awk '
    /^[[:space:]]*}[[:space:]]*$/ && !found_last {
        # This might be the last closing brace, store it
        last_brace_line = $0
        last_brace_nr = NR
    }
    END {
        # Process the file again to insert before the last closing brace
        while ((getline line < FILENAME) > 0) {
            if (NR == last_brace_nr) {
                # Insert the super-admin location before the last closing brace
                while ((getline location_line < "/tmp/super-admin-location.conf") > 0) {
                    print location_line
                }
                close("/tmp/super-admin-location.conf")
            }
            print line
        }
    }
' "$NGINX_CONF_FILE" > "$TEMP_CONF_FILE"

# If awk method doesn't work, use sed as fallback
if [[ ! -s "$TEMP_CONF_FILE" ]]; then
    echo "Using sed method to insert configuration..."
    # Find the last closing brace and insert before it
    sudo sed -e '/^[[:space:]]*}[[:space:]]*$/{
        $!b
        i\
    # Super Admin S3 Proxy - Added automatically\
    location /super-admin/ {\
        proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/;\
        proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_redirect off;\
        \
        # Cache static assets\
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\
            proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;\
            proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;\
            expires 1y;\
            add_header Cache-Control "public, immutable";\
        }\
    }
    }' "$NGINX_CONF_FILE" > "$TEMP_CONF_FILE"
fi

# Test the new configuration
echo "Testing Nginx configuration..."
sudo nginx -t -c /dev/stdin < "$TEMP_CONF_FILE" 2>/dev/null || {
    echo -e "${RED}Error: Invalid Nginx configuration generated${NC}"
    echo "Please check the configuration manually"
    rm -f "$TEMP_CONF_FILE" "$TEMP_LOCATION_FILE"
    exit 1
}

# Apply the new configuration
sudo mv "$TEMP_CONF_FILE" "$NGINX_CONF_FILE"
rm -f "$TEMP_LOCATION_FILE"

# Test the final configuration
echo "Testing final Nginx configuration..."
if sudo nginx -t; then
    echo -e "${GREEN}Configuration test passed${NC}"

    # Reload Nginx
    echo "Reloading Nginx..."
    sudo systemctl reload nginx || sudo service nginx reload

    echo -e "${GREEN}=== Setup Complete ===${NC}"
    echo "Super Admin should now be accessible at:"
    echo "https://sigma.jiangren.com.au/super-admin/"
    echo ""
    echo "Backup created at: $BACKUP_FILE"
else
    echo -e "${RED}Error: Configuration test failed${NC}"
    echo "Restoring backup..."
    sudo mv "$BACKUP_FILE" "$NGINX_CONF_FILE"
    exit 1
fi

# Clean up
rm -f "$TEMP_CONF_FILE" "$TEMP_LOCATION_FILE"
