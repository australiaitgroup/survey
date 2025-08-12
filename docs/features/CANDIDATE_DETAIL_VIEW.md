# Candidate Detail View Feature

## Overview
This feature allows administrators to view detailed statistics and information about individual candidates who have completed surveys/assessments. By clicking on a candidate's name in the statistics view, users can access comprehensive information about that candidate's performance.

## Features Implemented

### 1. Backend API Endpoint
- **Endpoint**: `GET /admin/responses/:responseId`
- **Location**: `/routes/admin/responses.js:34-195`
- **Authentication**: Required (JWT)
- **Authorization**: Only survey creators can view responses

#### Response Data Structure:
```javascript
{
  _id: "response_id",
  candidateInfo: {
    name: "Candidate Name",
    email: "candidate@email.com",
    submittedAt: "2024-01-01T12:00:00Z",
    metadata: {
      userAgent: "browser info",
      ipAddress: "192.168.1.1",
      deviceType: "desktop"
    }
  },
  surveyInfo: {
    _id: "survey_id",
    title: "Survey Title",
    type: "assessment",
    description: "Survey description"
  },
  statistics: {
    completion: {
      totalQuestions: 10,
      answeredQuestions: 9,
      skippedQuestions: 1,
      completionRate: 90
    },
    timing: {
      totalTimeSpent: 300, // seconds
      averageTimePerQuestion: 30,
      isAutoSubmit: false,
      questionTimeStats: {
        fastest: 5,
        slowest: 60,
        average: 30,
        median: 28
      }
    }
  },
  score: {
    totalPoints: 80,
    maxPossiblePoints: 100,
    correctAnswers: 8,
    wrongAnswers: 2,
    percentage: 80,
    displayScore: 80,
    scoringMode: "percentage",
    passed: true
  },
  questionDetails: [
    {
      questionIndex: 0,
      questionText: "Question text",
      questionType: "single_choice",
      options: ["Option A", "Option B"],
      userAnswer: "Option A",
      correctAnswer: 0,
      isCorrect: true,
      pointsAwarded: 10,
      maxPoints: 10,
      timeSpent: 25,
      difficulty: "medium",
      tags: ["topic1"],
      explanation: "Explanation text"
    }
  ]
}
```

### 2. Frontend Component
- **Component**: `CandidateDetailView.tsx`
- **Location**: `/client/src/components/surveys/CandidateDetailView.tsx`

#### Features:
1. **Three Tab Views**:
   - **Overview Tab**: Displays summary statistics
     - Completion statistics (questions answered, skipped, completion rate)
     - Time statistics (total time, average per question, fastest/slowest)
     - Score breakdown (for assessments/quizzes)
     - Device information (IP, device type, user agent)
   
   - **Answer Details Tab**: Shows question-by-question responses
     - Question text and type
     - User's answer vs correct answer
     - Points awarded
     - Time spent per question
     - Difficulty level and tags
     - Explanations (if available)
   
   - **Performance Analysis Tab**: Visual analytics
     - Question performance chart
     - Performance by difficulty level
     - Time distribution analysis
     - Performance by topic/tags

2. **Visual Indicators**:
   - Color-coded score indicators (green for pass, red for fail)
   - Progress bars for question performance
   - Time indicators with clock icons
   - Difficulty badges (easy/medium/hard)

3. **Navigation**:
   - Back button to return to statistics view
   - Smooth tab transitions
   - Responsive layout for mobile devices

### 3. Integration with Survey Statistics
- **Modified**: `SurveyDetailView.tsx`
- **Changes**:
  - Added clickable candidate names in statistics view
  - Candidate names appear as blue links on hover
  - Clicking navigates to detailed view
  - Maintains state for seamless navigation back

## Common Metrics Tracked

### 1. Basic Information
- Candidate name and email
- Submission timestamp
- Survey/Assessment information

### 2. Performance Metrics
- **Score**: Total points, percentage, pass/fail status
- **Accuracy**: Correct vs incorrect answers
- **Completion**: Questions answered vs skipped
- **Time Management**: Total time, time per question

### 3. Detailed Analytics
- **Question-level Analysis**:
  - Individual question performance
  - Time spent per question
  - Points earned vs possible
  
- **Difficulty Analysis**:
  - Performance grouped by difficulty
  - Success rate per difficulty level
  
- **Topic Performance**:
  - Performance by question tags
  - Strengths and weaknesses identification

### 4. Session Information
- IP address for security tracking
- Device type (mobile/desktop/tablet)
- Browser information (user agent)
- Auto-submit status (if time limit exceeded)

## Usage

### For Administrators:
1. Navigate to Survey/Assessment statistics
2. View list of candidates who completed the survey
3. Click on any candidate's name to view detailed statistics
4. Use tabs to explore different aspects of performance
5. Click "Back to Statistics" to return to the list

### Benefits:
- **Individual Assessment**: Evaluate each candidate's performance in detail
- **Identify Patterns**: Spot common areas of difficulty
- **Time Analysis**: Understand which questions took longest
- **Fair Evaluation**: See if auto-submit affected results
- **Security**: Track submission metadata for verification

## Technical Implementation

### State Management:
- Uses React hooks for local state
- Maintains selected response ID
- Tab navigation handled locally

### Data Flow:
1. User clicks candidate name
2. Response ID stored in state
3. API call fetches detailed data
4. Component renders three-tab view
5. Back button clears selection

### Error Handling:
- Loading states during data fetch
- Error messages for failed requests
- Graceful fallbacks for missing data

## Future Enhancements

Potential improvements for this feature:
1. Export candidate report to PDF
2. Comparison view between candidates
3. Historical performance tracking
4. Email report to candidate
5. Advanced filtering and search
6. Batch operations on multiple candidates
7. Integration with external HR systems
8. Custom report templates