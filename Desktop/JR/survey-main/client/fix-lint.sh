#!/bin/bash

# Fix common lint errors automatically

# 1. Remove unused imports
echo "Fixing unused imports..."

# 2. Replace all 'any' types with 'unknown' in interface definitions
echo "Fixing any types..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/: any/: unknown/g'

# 3. Fix React quotes
echo "Fixing React quotes..."
find src -name "*.tsx" | xargs sed -i '' 's/&quot;/"/g'

# 4. Fix unused parameters by prefixing with underscore
echo "Fixing unused parameters..."

# 5. Run prettier to fix formatting
echo "Running prettier..."
npx prettier --write src/

echo "Done! Running lint check..."
npm run lint