# Super Admin Dashboard - React + TypeScript

Modern Super Admin dashboard for the Survey application built with React, TypeScript, and Vite for optimal developer experience and type safety.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks

## Project Structure

```
super-admin/
├── public/                     # Static assets
├── src/                        # Source files
│   ├── index.tsx              # Entry point (React app root)
│   ├── App.tsx                # Main app component with routing
│   ├── components/            # Reusable components
│   │   ├── pages/             # Page components
│   │   │   ├── Overview.tsx       # Dashboard overview
│   │   │   ├── Companies.tsx      # Companies management
│   │   │   ├── PublicBanks.tsx    # Public banks list
│   │   │   ├── PublicBankDetailPage.tsx # Bank detail view
│   │   │   ├── Transactions.tsx   # Transaction history
│   │   │   └── Audit.tsx          # Audit logs
│   │   ├── companies/         # Company-specific components
│   │   │   └── CompanyDetailView.tsx # Company detail component
│   │   ├── publicBanks/       # Public banks feature modules
│   │   │   ├── PublicBankDetailView.tsx # Bank detail view
│   │   │   ├── PublicBankModal.tsx      # Create/Edit modal
│   │   │   ├── QuestionDrawer.tsx       # Question add/edit drawer
│   │   │   ├── ImportResultModal.tsx    # CSV import results
│   │   │   └── index.ts                 # Module exports
│   │   ├── ProtectedRoute.tsx # Authentication guard
│   │   └── layout components
│   ├── types/                 # TypeScript type definitions
│   │   ├── index.ts              # Common types
│   │   ├── companies.ts          # Company-related types
│   │   ├── publicBanks.ts        # Public banks types
│   │   ├── audit.ts              # Audit log types
│   │   └── transactions.ts       # Transaction types
│   ├── api/                   # API client modules
│   │   ├── index.ts              # API configuration
│   │   └── publicBanks.ts        # Public banks API client
│   ├── data/                  # Mock data (development)
│   └── utils/                 # Utility functions
├── dist/                      # Built files (generated)
├── index.html                 # HTML entry point
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build output
npm run clean
```

### Development Server

The development server runs on `http://localhost:3000` with:
- Hot Module Replacement (HMR)
- TypeScript compilation
- Real-time error reporting

## Features

### ✅ Completed Features

- **Companies Management**
  - Company list with filtering and pagination
  - Company detail view with user management
  - Status modification (active/suspended/pending)
  - Plan information display
  - User list for each company

- **Public Banks Management**
  - Banks list with CRUD operations
  - Question management with drawer interface
  - CSV import/export functionality
  - Usage statistics and analytics

- **System Overview**
  - Real-time statistics dashboard
  - Growth charts and metrics
  - System health indicators

- **Authentication & Authorization**
  - JWT-based authentication
  - Super Admin role protection
  - Cross-tenant access controls

### 🚧 In Progress

- Audit logs interface
- Transaction management
- Advanced filtering and search

## API Integration

The dashboard integrates with the main survey application's API:

- **Base URL**: `/api/sa/` (Super Admin endpoints)
- **Authentication**: Bearer token in Authorization header
- **Data Format**: JSON with standardized response structure

### Key Endpoints

- `GET /api/sa/stats` - System statistics
- `GET /api/sa/companies` - Companies list
- `GET /api/sa/companies/:id/users` - Company users
- `GET /api/sa/public-banks` - Public banks list
- `POST /api/sa/public-banks` - Create public bank

## Type Safety

Full TypeScript implementation with:

- **Strict Type Checking** - Enabled in tsconfig.json
- **Interface Definitions** - All data models properly typed
- **API Response Types** - Type-safe API interactions
- **Component Props** - Fully typed React components
- **Route Parameters** - Type-safe routing

## Component Architecture

### Modular Design

Components follow a modular architecture with:

- **Page Components** - Top-level route components
- **Feature Components** - Business logic components
- **UI Components** - Reusable interface elements
- **Layout Components** - Navigation and structure

### State Management

Using React's built-in state management:

- **useState** - Local component state
- **useEffect** - Side effects and API calls
- **Custom Hooks** - Shared stateful logic
- **Context API** - Global state (authentication)

## Build & Deployment

### Production Build

```bash
npm run build
```

Generates optimized static files in `dist/` directory with:
- TypeScript compilation
- Asset bundling and optimization
- Code splitting
- Static asset handling

### Environment Configuration

The app adapts to different environments:

- **Development**: `http://localhost:3000` with HMR
- **Production**: Served from main application at `/super-admin/`

## Best Practices

### Code Organization

- Components under 1000 lines (enforced)
- Single responsibility principle
- Clear separation of concerns
- Consistent naming conventions

### Performance

- Lazy loading for routes
- Efficient re-renders with React.memo
- Optimized bundle splitting
- Asset optimization

### Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance