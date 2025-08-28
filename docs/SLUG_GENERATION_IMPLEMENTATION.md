# Slug Generation Implementation

## Overview

This document describes the implementation of the centralized slug generation system for SigmaQ surveys and assessments, ensuring all slugs are limited to 16 characters maximum with proper collision handling.

## Requirements Implemented

✅ **16-Character Limit**: All new slugs are automatically truncated to 16 characters maximum  
✅ **Uniqueness Guarantee**: Collision detection with random suffix generation  
✅ **Centralized Logic**: Single utility function for all slug generation  
✅ **Backward Compatibility**: Existing slugs remain unchanged unless migrated  
✅ **Multi-Type Support**: Works for Survey, Assessment, Onboarding, Kahoot (Live Quiz)  
✅ **Comprehensive Tests**: Unit tests covering all scenarios  

## Implementation Details

### Core Utility Function

**Location**: `utils/slugUtils.js`

```javascript
generateUniqueSlug(title, Model, excludeId = null, maxLength = 16)
```

**Features**:
- Converts titles to URL-safe slugs
- Truncates to specified maximum length (default: 16)
- Handles collisions with 2-character random suffixes
- Supports non-ASCII titles with fallback generation
- Excludes current document from uniqueness checks (for updates)
- Infinite loop protection (fallback to random slug after 100 attempts)

### Updated Components

1. **Survey Model** (`models/Survey.js`)
   - Updated `generateSlug` static method to use new utility
   - Maintains backward compatibility

2. **Survey Controller** (`controllers/surveyController.js`)
   - Direct integration with slug utility for new surveys

3. **Company Routes** (`routes/companies.js`)
   - Updated all company creation and update logic
   - Handles legacy company slug generation

4. **Admin Routes** (`routes/admin/auth.js`, `routes/admin/profile.js`)
   - Updated company creation in admin flows

5. **Scripts** (`scripts/addCompanySlug.js`)
   - Updated existing migration script to use new utility

### Migration Script

**Location**: `scripts/migrate-long-slugs.js`

**Purpose**: Migrate existing slugs that exceed 16 characters

**Features**:
- Finds all surveys and companies with slugs > 16 characters
- Generates new compliant slugs while maintaining uniqueness
- Provides verification and summary statistics
- Safe to run multiple times (idempotent)

**Usage**:
```bash
node scripts/migrate-long-slugs.js
```

## Testing

### Unit Tests

**Location**: `test/test_slug_utils.js`

**Coverage**:
- ✅ Slug validation (format, length)
- ✅ Slug sanitization and truncation
- ✅ Unique slug generation
- ✅ Collision handling with suffixes
- ✅ Non-ASCII title handling
- ✅ Custom length limits
- ✅ Edge cases (empty strings, special characters)

**Migration Test**:
**Location**: `test/test_migration.js`
- ✅ Migration logic validation
- ✅ Length compliance verification

**Running Tests**:
```bash
node test/test_slug_utils.js
node test/test_migration.js
```

## API Changes

### Survey Creation
```javascript
// Before: Manual slug generation in multiple places
// After: Automatic slug generation with 16-char limit

POST /api/surveys
{
  "title": "My Very Long Survey Title That Exceeds Sixteen Characters"
}
// Returns slug: "my-very-long-sur" (16 chars max)
```

### Company Creation
```javascript
// Before: Various slug generation implementations
// After: Centralized slug generation

POST /api/companies
{
  "name": "My Very Long Company Name That Exceeds Sixteen Characters"
}
// Returns slug: "my-very-long-com" (16 chars max)
```

## Collision Handling

When a generated slug already exists:

1. **First attempt**: `my-survey` (if available)
2. **Collision detected**: Generate 2-character random suffix
3. **Result**: `my-survey-ab` (truncated base + dash + suffix = ≤16 chars)
4. **If still collision**: Try again with different suffix
5. **Safety mechanism**: After 100 attempts, generate completely random slug

## Examples

### Normal Cases
```javascript
"My Test Survey" → "my-test-survey" (14 chars)
"Assessment 2024" → "assessment-2024" (15 chars)
```

### Truncation Cases
```javascript
"This is a very long survey title" → "this-is-a-very-l" (16 chars)
"My Super Long Assessment Name" → "my-super-long-as" (16 chars)
```

### Collision Cases
```javascript
"My Survey" → "my-survey" (first)
"My Survey" → "my-survey-a3" (collision, with suffix)
```

### Non-ASCII Cases
```javascript
"中文标题" → "item-mevbeqrk-d3a1b2" (fallback generation)
"Café & Restaurant" → "cafe-restaurant" (sanitized)
```

## Database Schema

No schema changes required. The existing `slug` field in Survey and Company models continues to work with the new length constraint.

## Deployment

1. **Deploy code changes** (no breaking changes)
2. **Run migration script** to update existing long slugs:
   ```bash
   node scripts/migrate-long-slugs.js
   ```
3. **Verify** no slugs exceed 16 characters

## Monitoring

The migration script provides verification:
- Counts entities before/after migration
- Verifies no remaining long slugs
- Provides detailed logging

## Future Enhancements

- **Database Index**: Consider adding index on slug length for performance
- **Metrics**: Track slug collision rates
- **Customization**: Allow per-model max length configuration
- **Validation**: Add database-level length constraints

## Backward Compatibility

- ✅ Existing slugs remain unchanged until migrated
- ✅ All existing API endpoints work without modification
- ✅ Legacy slug generation methods still function (via delegation)
- ✅ No breaking changes to client applications