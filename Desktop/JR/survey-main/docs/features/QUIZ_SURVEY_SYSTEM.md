# Enhanced Quiz/Survey System Documentation

## Overview

This system supports both survey and quiz/assessment functionality with the following features:

- **Survey Mode**: Collect feedback without correct answers
- **Quiz/Assessment/IQ Mode**: Test knowledge with scoring and correct answers
- **Single Choice Questions**: Radio button selections
- **Multiple Choice Questions**: Checkbox selections with multiple correct answers
- **Automatic Scoring**: Calculate scores, percentages, and pass/fail status
- **Detailed Statistics**: Question-level and overall response analytics

## Question Types

### 1. Single Choice Questions (单选题)

- User can select only one option
- Displayed as radio buttons
- Correct answer stored as a number (option index)

### 2. Multiple Choice Questions (多选题)

- User can select multiple options
- Displayed as checkboxes
- Correct answers stored as an array of numbers (option indices)

## Survey Types

### 1. Survey (`survey`)

- **Purpose**: Collect opinions and feedback
- **Correct Answers**: Not required
- **Scoring**: No scoring applied
- **Use Cases**: Customer satisfaction, feedback collection, opinion polls

### 2. Quiz (`quiz`)

- **Purpose**: Test knowledge in a casual setting
- **Correct Answers**: Required for all questions
- **Scoring**: Automatic calculation with results shown
- **Use Cases**: Educational quizzes, training assessments

### 3. Assessment (`assessment`)

- **Purpose**: Formal evaluation of knowledge/skills
- **Correct Answers**: Required for all questions
- **Scoring**: Comprehensive scoring with pass/fail
- **Use Cases**: Certification exams, course evaluations

### 4. IQ Test (`iq`)

- **Purpose**: Measure cognitive abilities
- **Correct Answers**: Required for all questions
- **Scoring**: Advanced scoring algorithms
- **Use Cases**: Intelligence testing, cognitive assessments

## API Endpoints

### Create Survey

```http
POST /api/surveys
```

**Request Body:**

```json
{
	"title": "Customer Satisfaction Survey",
	"description": "Help us improve our services",
	"type": "survey",
	"questions": [
		{
			"text": "How satisfied are you with our product?",
			"type": "single_choice",
			"options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"],
			"correctAnswer": null
		}
	]
}
```

### Create Quiz

```http
POST /api/surveys
```

**Request Body:**

```json
{
	"title": "Math Quiz",
	"description": "Test your math skills",
	"type": "quiz",
	"scoringSettings": {
		"passingScore": 70,
		"showScore": true,
		"showCorrectAnswers": true
	},
	"questions": [
		{
			"text": "What is 2 + 2?",
			"type": "single_choice",
			"options": ["3", "4", "5", "6"],
			"correctAnswer": 1,
			"explanation": "2 + 2 equals 4",
			"points": 1
		},
		{
			"text": "Which are even numbers?",
			"type": "multiple_choice",
			"options": ["1", "2", "3", "4", "5"],
			"correctAnswer": [1, 3],
			"explanation": "Even numbers are divisible by 2",
			"points": 2
		}
	]
}
```

### Submit Response

```http
POST /api/surveys/{surveyId}/responses
```

**Request Body:**

```json
{
	"name": "John Doe",
	"email": "john@example.com",
	"answers": {
		"0": 1,
		"1": [1, 3]
	},
	"timeSpent": 120
}
```

### Get Survey Statistics

```http
GET /api/surveys/{surveyId}/statistics
```

**Response:**

```json
{
	"success": true,
	"data": {
		"totalResponses": 100,
		"averageScore": 75.5,
		"passRate": 80.0,
		"questionStatistics": [
			{
				"questionIndex": 0,
				"questionText": "What is 2 + 2?",
				"questionType": "single_choice",
				"totalAnswers": 100,
				"correctAnswerRate": 95.0,
				"optionStatistics": [
					{
						"optionIndex": 0,
						"optionText": "3",
						"count": 2,
						"percentage": 2.0
					},
					{
						"optionIndex": 1,
						"optionText": "4",
						"count": 95,
						"percentage": 95.0
					}
				]
			}
		]
	}
}
```

## Data Models

### Survey Schema

```javascript
{
  title: String,
  description: String,
  type: String, // 'survey' | 'quiz' | 'assessment' | 'iq'
  questions: [{
    text: String,
    type: String, // 'single_choice' | 'multiple_choice'
    options: [String],
    correctAnswer: Number | [Number] | null,
    explanation: String,
    points: Number
  }],
  scoringSettings: {
    totalPoints: Number,
    passingScore: Number,
    showScore: Boolean,
    showCorrectAnswers: Boolean
  }
}
```

### Response Schema

```javascript
{
  name: String,
  email: String,
  surveyId: ObjectId,
  answers: Map, // { questionIndex: answer }
  score: {
    totalPoints: Number,
    correctAnswers: Number,
    wrongAnswers: Number,
    percentage: Number,
    passed: Boolean
  },
  timeSpent: Number,
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceType: String
  }
}
```

## Answer Formats

### Single Choice

- **Storage**: `{ "0": 1, "1": 2 }`
- **Meaning**: Question 0 → Option 1, Question 1 → Option 2

### Multiple Choice

- **Storage**: `{ "0": [1, 3], "1": [0, 2, 4] }`
- **Meaning**: Question 0 → Options 1&3, Question 1 → Options 0&2&4

## Scoring System

### For Quiz/Assessment/IQ Types:

1. **Points Calculation**: Sum of points for correct answers
2. **Percentage**: (Points Earned / Total Points) × 100
3. **Pass/Fail**: Based on configured passing score
4. **Statistics**: Question-level and overall analytics

### For Survey Types:

- No scoring applied
- Focus on response collection and analysis
- Statistical summaries of option selections

## Validation Rules

### Quiz/Assessment/IQ Questions:

- Must have `correctAnswer` field
- Single choice: `correctAnswer` must be a number
- Multiple choice: `correctAnswer` must be an array of numbers
- All indices must be valid (within options array bounds)

### Survey Questions:

- `correctAnswer` field is optional/null
- Focus on collecting responses without validation against correct answers

## Usage Examples

### Creating a Customer Satisfaction Survey

```javascript
const survey = {
	title: 'Customer Satisfaction Survey',
	type: 'survey',
	questions: [
		{
			text: 'How would you rate our service?',
			type: 'single_choice',
			options: ['Excellent', 'Good', 'Fair', 'Poor'],
		},
		{
			text: 'What improvements would you suggest?',
			type: 'multiple_choice',
			options: ['Faster response', 'Better quality', 'Lower prices', 'More features'],
		},
	],
};
```

### Creating a Programming Quiz

```javascript
const quiz = {
	title: 'JavaScript Fundamentals Quiz',
	type: 'quiz',
	scoringSettings: {
		passingScore: 70,
		showScore: true,
		showCorrectAnswers: true,
	},
	questions: [
		{
			text: 'What is the output of console.log(typeof []);?',
			type: 'single_choice',
			options: ["'array'", "'object'", "'undefined'", "'function'"],
			correctAnswer: 1,
			explanation: 'Arrays are objects in JavaScript',
			points: 2,
		},
		{
			text: 'Which are JavaScript primitive types?',
			type: 'multiple_choice',
			options: ['string', 'number', 'object', 'boolean', 'array'],
			correctAnswer: [0, 1, 3],
			explanation: 'string, number, and boolean are primitive types',
			points: 3,
		},
	],
};
```

### Submitting a Response

```javascript
const response = {
	name: 'John Doe',
	email: 'john@example.com',
	answers: {
		0: 1, // Single choice: selected option 1
		1: [0, 1, 3], // Multiple choice: selected options 0, 1, and 3
	},
	timeSpent: 180, // 3 minutes
};
```

## Features Summary

✅ **Single Choice Questions** - Radio button selection
✅ **Multiple Choice Questions** - Checkbox selections  
✅ **Survey Mode** - No correct answers required
✅ **Quiz/Assessment Mode** - Correct answers required
✅ **Automatic Scoring** - Points, percentages, pass/fail
✅ **Detailed Statistics** - Question-level analytics
✅ **Response Validation** - Comprehensive input validation
✅ **Metadata Tracking** - Device, browser, timing information
✅ **Flexible Configuration** - Customizable scoring and display settings

This enhanced system provides a complete solution for both survey collection and knowledge assessment with comprehensive analytics and reporting capabilities.
