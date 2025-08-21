# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Server (Root Directory)

- `npm start` - Start the Express server (production)
- `node server.js` - Start the Express server directly
- `npm run lint` - Run ESLint on JS/TS files

### Client (React Frontend)

- `cd client && npm run dev` - Start Vite development server
- `cd client && npm run build` - Build React app for production
- `cd client && npm run preview` - Preview production build

### Full Development Setup

```bash
# Install server dependencies
npm install

# Install client dependencies and build
cd client
npm install
npm run build
cd ..

# Start server (serves built client at /dist)
npm start
```

## Architecture Overview

This is a full-stack survey application with MongoDB, Express, React, and Node.js.

### Backend Structure

- **Entry Point**: `server.js` - Express server with session management and static file serving
- **Models**: `models/` - Mongoose schemas (Survey, Response)
- **Routes**: `routes/` - API endpoints organized by feature (surveys, responses, admin, questions)
- **Controllers**: `controllers/` - Business logic handlers, uses Zod schemas for validation
- **Services**: `services/` - Data access layer interfacing with MongoDB
- **Schemas**: `schemas/` - Zod validation schemas (both JS and TS versions exist)
- **Middlewares**: `middlewares/` - Error handling and async wrapper utilities
- **Utils**: `utils/` - File helpers and custom error classes

### Frontend Structure

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: React Router DOM for SPA navigation
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios for API communication
- **Components**: `client/src/` contains main components (Survey, Admin, TakeSurvey, SurveyForm)

### Key Features

- Survey management with dynamic questions from `questions.json`
- Admin authentication via environment variables (ADMIN_USERNAME/ADMIN_PASSWORD)
- Response collection and statistics viewing
- Session-based admin login
- MongoDB for data persistence

### Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/survey)
- `ADMIN_USERNAME` - Admin login username (default: admin)
- `ADMIN_PASSWORD` - Admin login password (default: password)
- `PORT` - Server port (default: 5050)

### Mixed TypeScript/JavaScript Codebase

This project contains both .js and .ts files. The backend is primarily JavaScript with some TypeScript files for schemas and controllers. The frontend is fully TypeScript. When editing, match the existing file's language choice.

## 🚨 CRITICAL AI CODING RULES 🚨

### INDENTATION RULES - MANDATORY

- **USE TABS ONLY - SIZE 4 CHARACTERS**
- **NEVER use spaces for indentation**
- This applies to ALL files: JS, TS, JSX, TSX, CSS, HTML, JSON, MD
- Project is configured with `.editorconfig`, `.prettierrc`, and `.eslintrc.json` to enforce this

### Constants Usage - MANDATORY

- **ALWAYS use constants from `/client/src/constants/index.ts`**
- **NEVER use hardcoded strings** like 'assessment', 'quiz', 'single_choice'
- Examples:
    - Use `SURVEY_TYPE.ASSESSMENT` instead of `'assessment'`
    - Use `QUESTION_TYPE.SINGLE_CHOICE` instead of `'single_choice'`
    - Use `TYPES_REQUIRING_ANSWERS.includes(type)` instead of `['assessment', 'quiz', 'iq'].includes(type)`

### Configuration Files

- `.editorconfig` - Universal editor settings (tabs, size 4)
- `client/.prettierrc` - Code formatting rules
- `client/.eslintrc.json` - Linting rules
- `.vscode/settings.json` - VSCode configuration
- `.gitattributes` - Git line ending settings

### Code Quality

- Always follow existing project patterns
- Use TypeScript types properly
- Handle errors appropriately
- Test changes with `npm run build` and `npm run dev`

📖 **See `AI_CODING_RULES.md` for complete documentation**
