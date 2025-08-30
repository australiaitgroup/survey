# Company Surveys Management Feature

## Overview

The Company Surveys Management feature allows super administrators to view and edit survey details for any company in the system. This is particularly useful for:

- Database troubleshooting and debugging
- Deployment-level error resolution
- Monitoring survey configurations across companies
- Administrative oversight of survey settings

## Features

### 1. Survey List View
- View all surveys created by users within a specific company
- Display key information: title, type, question count, status, creation date
- Click on any survey row to open detailed view

### 2. Survey Detail Modal
- **View Mode**: Display comprehensive survey information
- **Edit Mode**: Modify survey settings and configurations
- **Real-time Updates**: Changes are immediately reflected in the UI

### 3. Editable Fields
- **Basic Information**: title, description, type, status
- **Configuration**: time limit, max attempts, instructions, navigation mode
- **Settings**: security settings, scoring settings
- **Status Management**: active/inactive status with proper synchronization

### 4. Enhanced Data Display
- Question bank information (if applicable)
- Response statistics and activity metrics
- Security and scoring configuration details
- Creation and last activity timestamps

## Technical Implementation

### Backend API Endpoints

#### GET `/api/sa/companies/:id/surveys`
- Lists all surveys for a specific company
- Returns enhanced survey data with additional fields
- Includes question count and basic metadata

#### GET `/api/sa/surveys/:id`
- Retrieves detailed survey information
- Populates related data (question bank, responses)
- Includes response count and last activity

#### PUT `/api/sa/surveys/:id`
- Updates survey information
- Validates field changes
- Maintains data integrity (status/isActive sync)
- Audits all changes for security

### Frontend Components

#### SurveyDetailModal
- **Location**: `super-admin/src/components/companies/SurveyDetailModal.tsx`
- **Features**:
  - Responsive design with grid layouts
  - Form validation and error handling
  - Success/error message display
  - Edit/view mode toggle

#### CompanyDetailView Integration
- **Location**: `super-admin/src/components/companies/CompanyDetailView.tsx`
- **Enhancements**:
  - Clickable survey table rows
  - Hover effects for better UX
  - Modal state management
  - Real-time data updates

## Usage Instructions

### For Super Administrators

1. **Access Company Management**
   - Navigate to Companies section in super admin
   - Select a specific company

2. **View Company Surveys**
   - Scroll to "Company Surveys" section
   - View list of all surveys with key metrics

3. **Examine Survey Details**
   - Click on any survey row
   - Review comprehensive survey information
   - Check configuration and statistics

4. **Edit Survey Settings**
   - Click "Edit" button in survey detail modal
   - Modify desired fields
   - Save changes or cancel modifications

### Common Use Cases

#### Database Troubleshooting
- Verify survey data integrity
- Check question configurations
- Validate status and settings

#### Deployment Support
- Monitor survey configurations
- Identify configuration issues
- Verify feature implementations

#### Administrative Oversight
- Review company survey usage
- Monitor survey performance
- Ensure compliance with policies

## Security Features

### Authentication
- All endpoints require super admin authentication
- JWT token validation on every request
- Role-based access control

### Audit Logging
- All survey modifications are logged
- Tracks old and new values
- Records user and timestamp information

### Data Validation
- Field-level validation
- Type checking and sanitization
- Prevents invalid data updates

## Configuration

### Environment Variables
No additional environment variables required. Uses existing authentication and database configuration.

### Database Requirements
- Survey model with enhanced field selection
- Response model for statistics
- QuestionBank model for related data

### API Rate Limiting
Standard rate limiting applies to all endpoints.

## Troubleshooting

### Common Issues

1. **Survey Not Found**
   - Verify survey ID exists
   - Check company association
   - Ensure proper permissions

2. **Update Failures**
   - Validate field values
   - Check required fields
   - Verify data types

3. **Permission Errors**
   - Confirm super admin role
   - Check authentication token
   - Verify endpoint access

### Debug Information
- API responses include detailed error messages
- Frontend displays validation errors
- Console logging for development debugging

## Future Enhancements

### Planned Features
- Bulk survey operations
- Survey template management
- Advanced filtering and search
- Export functionality

### Potential Improvements
- Real-time collaboration
- Version history tracking
- Advanced analytics integration
- Automated health checks

## Support

For technical support or feature requests, contact the development team or create an issue in the project repository.

## Changelog

### Version 1.0.0
- Initial implementation of Company Surveys Management
- Basic CRUD operations for surveys
- Enhanced survey detail view
- Integration with existing company management system
