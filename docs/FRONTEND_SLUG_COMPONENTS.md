# Frontend Slug Management Components

## Overview

This document provides React component examples for handling slug management in the SigmaQ frontend, including warnings for long slugs and automatic shortening functionality.

## Components

### 1. SlugManager Component

**Purpose**: Individual survey/assessment slug management with validation and automatic shortening.

**Features**:
- ✅ Real-time slug validation
- ✅ Length indicator (16 char limit)
- ✅ Warning for long slugs
- ✅ Automatic shortening button
- ✅ Custom slug editing with suggestions
- ✅ URL preview

**Usage**:
```tsx
<SlugManager
  surveyId="survey-123"
  currentSlug="my-very-long-survey-title-that-exceeds-limit"
  title="My Very Long Survey Title"
  onSlugUpdated={(newSlug) => console.log('Updated:', newSlug)}
/>
```

### 2. BulkSlugManager Component

**Purpose**: Admin dashboard for bulk slug management across all surveys and companies.

**Features**:
- ✅ Scan for all long slugs
- ✅ Bulk processing with progress
- ✅ Statistics display
- ✅ Individual item management

**Usage**:
```tsx
<BulkSlugManager />
```

## API Integration

### Required API Endpoints

1. **POST /api/slug-management/surveys/:id/shorten-slug**
   - Automatically shorten individual survey slug

2. **POST /api/slug-management/validate-slug**
   - Validate custom slug format and uniqueness

3. **GET /api/slug-management/check-long-slugs**
   - Get all items with long slugs

4. **POST /api/slug-management/bulk-shorten**
   - Bulk process all long slugs

## UI/UX Guidelines

### Visual Indicators

- 🟢 **Green checkmark**: Valid slug
- 🟡 **Yellow warning**: Slug too long but functional
- 🔴 **Red error**: Invalid format or duplicate
- 📊 **Character counter**: Shows current length vs 16 char limit

### User Experience Flow

1. **New Survey Creation**: Automatic slug generation (≤16 chars)
2. **Existing Long Slug**: Show warning with "Fix Slug" button
3. **Manual Editing**: Real-time validation with suggestions
4. **Bulk Management**: Admin dashboard for system-wide cleanup

### Responsive Design

- Mobile-friendly form inputs
- Collapsible sections for detailed information
- Progressive disclosure for advanced options

## Implementation Notes

### State Management

```tsx
interface SlugState {
  currentSlug: string;
  isValid: boolean;
  isLongSlug: boolean;
  validation: ValidationResult | null;
  isLoading: boolean;
}
```

### Error Handling

- Network errors: Show retry button
- Validation errors: Display inline with suggestions
- Server errors: Graceful fallback with manual input

### Performance Considerations

- Debounced validation (500ms delay)
- Cached validation results
- Optimistic updates for better UX

## Accessibility

- ARIA labels for form inputs
- Screen reader announcements for validation
- Keyboard navigation support
- High contrast mode compatibility

## Testing Strategy

- Unit tests for validation logic
- Integration tests for API calls
- E2E tests for user workflows
- Visual regression tests for UI components