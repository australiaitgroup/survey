import { PublicBank } from '../types/publicBanks';

export const mockPublicBanks: PublicBank[] = [
  {
    _id: '1',
    title: 'General Knowledge Bank',
    description: 'A comprehensive collection of general knowledge questions',
    type: 'free',
    tags: ['general', 'knowledge', 'trivia'],
    locales: ['en', 'zh'],
    isActive: true,
    questions: [
      {
        text: 'What is the capital of France?',
        type: 'single_choice',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 1,
        points: 1,
        difficulty: 'easy',
        tags: ['geography', 'europe'],
        explanation: 'Paris is the capital and largest city of France.'
      },
      {
        text: 'Which of the following are prime numbers?',
        type: 'multiple_choice',
        options: ['2', '3', '4', '5', '6', '7'],
        correctAnswer: [0, 1, 3, 5],
        points: 2,
        difficulty: 'medium',
        tags: ['math', 'numbers'],
        explanation: '2, 3, 5, and 7 are prime numbers.'
      },
      {
        text: 'Explain the theory of relativity',
        type: 'short_text',
        correctAnswer: 'The theory of relativity consists of two interrelated theories by Albert Einstein',
        points: 3,
        difficulty: 'hard',
        tags: ['physics', 'science'],
        explanation: 'The theory includes special relativity and general relativity.'
      }
    ],
    questionCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    title: 'Advanced Mathematics',
    description: 'Complex mathematical problems and concepts',
    type: 'paid',
    priceOneTime: 29.99,
    tags: ['math', 'advanced', 'calculus'],
    locales: ['en'],
    isActive: true,
    questions: [],
    questionCount: 0,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  },
  {
    _id: '3',
    title: 'Language Learning - Spanish',
    description: 'Spanish language questions for beginners',
    type: 'free',
    tags: ['language', 'spanish', 'beginner'],
    locales: ['en', 'es'],
    isActive: false,
    questions: [],
    questionCount: 0,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z'
  }
];