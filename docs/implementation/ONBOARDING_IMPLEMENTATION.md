# Enterprise Onboarding Flow Implementation

This document describes the implementation of the enterprise onboarding flow for the Survey SaaS project.

## Overview

The onboarding flow guides new enterprise users through a 4-step process to set up their company information, contact details, brand settings, and system preferences.

## Features

### ✅ Implemented Features

1. **4-Step Onboarding Wizard**
    - Step 1: Company basic information (name, logo, industry, size)
    - Step 2: Contact information (name, email, role)
    - Step 3: Brand settings (theme color, custom logo toggle)
    - Step 4: System preferences (language, notification settings)

2. **Backend Infrastructure**
    - Extended Company model with onboarding fields
    - New API endpoints for company data management
    - Onboarding completion tracking

3. **Frontend Components**
    - Responsive multi-step wizard UI
    - Progress indicator with step navigation
    - Form validation and error handling
    - Auto-save functionality for each step

4. **User Experience**
    - Automatic redirect to onboarding for new companies
    - Skip options for optional steps
    - Visual feedback and loading states
    - Mobile-responsive design

5. **Image Upload Integration**
    - Cloudinary integration for logo uploads
    - Drag-and-drop file upload
    - Image validation and error handling

## File Structure

```
├── models/
│   └── Company.js                          # Extended with onboarding fields
├── routes/
│   └── companies.js                        # New API routes for company management
├── client/src/
│   ├── components/onboarding/
│   │   ├── OnboardingPage.tsx             # Main onboarding container
│   │   ├── Step1CompanyInfo.tsx           # Company information step
│   │   ├── Step2ContactInfo.tsx           # Contact information step
│   │   ├── Step3BrandSettings.tsx         # Brand customization step
│   │   └── Step4SystemPreferences.tsx     # System settings step
│   ├── contexts/
│   │   └── OnboardingContext.tsx          # State management for onboarding
│   ├── types/
│   │   └── api.ts                         # Updated Company interface
│   └── utils/
│       └── cloudinaryUpload.ts            # Image upload utility
```

## Database Schema Changes

### Company Model Extensions

```javascript
// New fields added to Company schema
{
  // Company size
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+']
  },

  // Contact information
  contactName: String,
  contactEmail: String,
  role: String,

  // Brand settings
  themeColor: { type: String, default: '#3B82F6' },
  customLogoEnabled: { type: Boolean, default: false },

  // System preferences
  defaultLanguage: { type: String, enum: ['en', 'zh', 'es', 'fr', 'de', 'ja'], default: 'en' },
  autoNotifyCandidate: { type: Boolean, default: true },

  // Onboarding tracking
  isOnboardingCompleted: { type: Boolean, default: false }
}
```

## API Endpoints

### Company Management

```
GET    /api/companies/current              # Get current user's company
PATCH  /api/companies/current              # Update company information
POST   /api/companies/complete-onboarding  # Mark onboarding as completed
```

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### Cloudinary Setup

1. Create a Cloudinary account at https://cloudinary.com
2. Go to your dashboard and note your Cloud Name
3. Create an unsigned upload preset:
    - Go to Settings → Upload
    - Add upload preset
    - Set signing mode to "Unsigned"
    - Configure folder and transformations as needed
4. Update your environment variables

## User Flow

### New User Registration

1. User registers for an account
2. System creates user and company records
3. User is automatically redirected to `/onboarding`
4. User completes 4-step onboarding process
5. System marks `isOnboardingCompleted = true`
6. User is redirected to admin dashboard

### Existing User Login

1. User logs in
2. System checks `isOnboardingCompleted` status
3. If incomplete, redirect to `/onboarding`
4. If complete, proceed to admin dashboard

## Component Architecture

### OnboardingContext

Manages the entire onboarding state including:

- Current step tracking
- Form data for each step
- API communication
- Error handling
- Loading states

### Step Components

Each step is a self-contained component that:

- Manages its own form state
- Validates input data
- Communicates with the context
- Provides navigation controls

### Main OnboardingPage

- Provides the overall layout
- Renders step indicator
- Routes to appropriate step component
- Wraps everything in OnboardingProvider

## Validation Rules

### Step 1 - Company Info

- Company name is required
- Logo upload is optional but validated for file type/size
- Industry and size are optional selections

### Step 2 - Contact Info

- Contact name is required
- Contact email is required and must be valid email format
- Role is optional selection

### Step 3 - Brand Settings

- Theme color must be valid hex color
- Custom logo toggle is boolean
- Step can be skipped

### Step 4 - System Preferences

- Default language selection from predefined options
- Auto-notify toggle is boolean
- Step saves preferences and completes onboarding

## Error Handling

- Network errors are caught and displayed to user
- Form validation errors are shown inline
- Upload errors provide specific feedback
- Loading states prevent multiple submissions

## Mobile Responsiveness

- All components use responsive Tailwind CSS classes
- Step indicator adapts to smaller screens
- Forms stack appropriately on mobile devices
- Touch-friendly upload areas

## Future Enhancements

Potential improvements that could be added:

1. **Progress Persistence**
    - Save partial progress if user leaves mid-flow
    - Resume from last completed step

2. **Advanced Customization**
    - Custom CSS upload
    - Multiple theme options
    - Advanced branding settings

3. **Integration Settings**
    - Email provider configuration
    - Third-party integrations
    - Webhook configurations

4. **Team Management**
    - Invite team members during onboarding
    - Role-based permissions setup

5. **Analytics Setup**
    - Tracking preferences
    - Data collection consent
    - Integration with analytics platforms

## Testing

To test the onboarding flow:

1. Register a new user account
2. Verify automatic redirect to `/onboarding`
3. Complete each step and verify data persistence
4. Test form validation and error states
5. Test image upload functionality
6. Verify completion redirects to admin dashboard
7. Test that completed users don't see onboarding again

## Troubleshooting

### Common Issues

1. **Cloudinary Upload Fails**
    - Check environment variables are set correctly
    - Verify upload preset is configured as "unsigned"
    - Check network connectivity

2. **Onboarding Loop**
    - Verify `isOnboardingCompleted` is being set to `true`
    - Check API endpoint responses
    - Clear localStorage and try again

3. **Styling Issues**
    - Ensure Tailwind CSS is properly configured
    - Check for conflicting CSS rules
    - Verify responsive classes are applied

4. **Navigation Issues**
    - Check React Router configuration
    - Verify route paths match component expectations
    - Test browser back/forward button behavior
