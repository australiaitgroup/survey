# Survey Question Count Feature

## Overview
Added the ability to display question counts for surveys in the super admin Company detail page. This feature allows super admins to quickly see how many questions each survey contains.

## Changes Made

### Backend Changes

#### 1. Updated Super Admin Surveys API Endpoint
**File:** `routes/superAdmin.js`
**Endpoint:** `GET /api/sa/companies/:id/surveys`

**Changes:**
- Modified the survey query to include the `questions` field in the select statement
- Added logic to calculate and include `questionCount` for each survey
- The API now returns surveys with an additional `questionCount` field

**Before:**
```javascript
const surveys = await Survey.find({ createdBy: { $in: userIdStrings } })
    .select('_id title type status createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

res.json({ success: true, data: surveys });
```

**After:**
```javascript
const surveys = await Survey.find({ createdBy: { $in: userIdStrings } })
    .select('_id title type status createdAt updatedAt questions')
    .sort({ createdAt: -1 })
    .lean();

// Add question count to each survey
const surveysWithQuestionCount = surveys.map(survey => ({
    ...survey,
    questionCount: survey.questions ? survey.questions.length : 0
}));

res.json({ success: true, data: surveysWithQuestionCount });
```

### Frontend Changes

#### 1. Updated TypeScript Interface
**File:** `super-admin/src/components/companies/CompanyDetailView.tsx`

**Changes:**
- Updated the `companySurveys` state type to include `questionCount: number`
- This ensures type safety for the new question count field

#### 2. Enhanced Surveys Table
**File:** `super-admin/src/components/companies/CompanyDetailView.tsx`

**Changes:**
- Added a new "Questions" column to the surveys table
- The column displays the question count with a visual badge
- Styled with blue background and question mark icon for better visibility

**New Column Structure:**
```typescript
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
```

**Question Count Display:**
```typescript
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        📝 {s.questionCount || 0} questions
    </span>
</td>
```

## Features

### 1. Question Count Display
- Shows the exact number of questions in each survey
- Displays "0 questions" for surveys with no questions
- Uses a visually appealing badge format

### 2. Real-time Data
- Question count is calculated from the actual survey data
- Updates automatically when surveys are refreshed
- No caching - always shows current data

### 3. Visual Design
- Blue badge with question mark icon (📝)
- Consistent with existing UI design patterns
- Clear and easy to read

## API Response Format

The surveys endpoint now returns data in this format:

```json
{
  "success": true,
  "data": [
    {
      "_id": "survey_id",
      "title": "Survey Title",
      "type": "survey",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "questionCount": 15
    }
  ]
}
```

## Testing

### Manual Testing
1. Navigate to the super admin dashboard
2. Go to Companies page
3. Click on any company to view details
4. Scroll down to the "Company Surveys" section
5. Verify that the "Questions" column shows the correct question count for each survey

### Automated Testing
A test script is available at `test/test_survey_question_count.js` to verify the API endpoint functionality.

## Benefits

1. **Better Overview**: Super admins can quickly see which surveys have more content
2. **Content Assessment**: Helps evaluate the complexity and scope of surveys
3. **Data Insights**: Provides useful metrics for company survey analysis
4. **User Experience**: Clear visual representation of survey question counts

## Future Enhancements

Potential improvements that could be added:
1. Question count filtering (show only surveys with X+ questions)
2. Question count sorting (sort by number of questions)
3. Question count statistics (average questions per survey)
4. Question type breakdown (multiple choice, text, etc.)

## Technical Notes

- The feature uses the existing `questions` array field from the Survey model
- No database schema changes were required
- The implementation is backward compatible
- Performance impact is minimal as we only fetch the questions array length
