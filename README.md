# SigmaQ - AI-Powered Assessment & Survey Platform

**SigmaQ** ([sigmaq.co](https://sigmaq.co)) is a comprehensive, enterprise-grade survey and assessment platform built for modern organizations. It combines powerful question bank management, AI-driven features, and flexible survey types to deliver professional assessment experiences.

*SigmaQ is proudly developed by **[JR Academy](https://jracademy.ai)** - Building the future of learning and assessment technology.*

## 🚀 Platform Overview

SigmaQ is designed as a multi-tenant SaaS platform that enables organizations to:

- **Create Professional Assessments**: Build skill-based assessments, knowledge tests, and employee evaluations
- **Manage Question Banks**: Organize reusable question libraries with advanced categorization
- **Collect Survey Data**: Gather feedback through surveys, onboarding flows, and live quizzes  
- **Analyze Results**: Get actionable insights with built-in analytics and reporting
- **Scale Operations**: Support multiple companies with role-based access control

## 🎯 Core Features

### 📚 Question Bank Management
- **Centralized Library**: Organize questions by topic, difficulty, and tags
- **Required Questions**: Mark questions as mandatory for assessments
- **Import/Export**: CSV import with validation and bulk operations
- **Public Marketplace**: Access and share question banks across organizations
- **Rich Content**: Support for markdown descriptions and image attachments

### 🎯 Assessment Types
- **Skills Assessment**: Technical and professional skill evaluation
- **Knowledge Tests**: Quiz-style assessments with automatic scoring
- **Survey Collection**: Feedback and opinion gathering
- **Onboarding Flows**: New hire and customer onboarding processes
- **Live Quizzes**: Real-time interactive question sessions

### 🎨 Survey Builder
- **Flexible Sources**: Create from question banks, manual selection, or multi-bank combinations
- **Question Types**: Single choice, multiple choice, and short text responses
- **Smart Selection**: Automatic question selection with required question enforcement
- **Custom Scoring**: Configurable scoring systems and passing thresholds
- **Anti-Cheat Protection**: Built-in security measures for assessment integrity

### 📊 Analytics & Insights
- **Real-time Results**: Live response tracking and statistics
- **Candidate Profiles**: Detailed individual performance analysis
- **Response Analytics**: Question-level performance metrics
- **Export Capabilities**: Download results in multiple formats
- **Visual Charts**: Interactive data visualization with Recharts

### 🛡️ Security & Administration
- **Multi-tenant Architecture**: Complete data isolation between organizations
- **Role-based Access**: Admin, user, and super-admin permission levels
- **JWT Authentication**: Secure token-based authentication system
- **Audit Logging**: Comprehensive activity tracking and compliance
- **Anti-cheat Features**: Tab switching detection and time monitoring

## 🏗️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js 20+ with Express.js framework
- **Database**: MongoDB with Mongoose ODM for data modeling
- **Authentication**: JWT-based auth with bcrypt password hashing
- **File Upload**: Multer for file handling with Cloudinary integration
- **Email Service**: Nodemailer for transactional emails
- **Payment Processing**: Stripe integration for subscription billing
- **Validation**: Zod schemas for runtime type checking

### Frontend Stack
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom component library
- **Routing**: React Router v6 with protected routes
- **State Management**: React Context API with custom hooks
- **Forms**: React Hook Form with validation resolvers
- **Rich Text**: TipTap editor for markdown content creation
- **Drag & Drop**: DnD Kit for question reordering
- **Charts**: Recharts for data visualization
- **Icons**: Heroicons for consistent iconography
- **Animations**: Framer Motion for smooth transitions

### Additional Tools
- **Internationalization**: i18next for multi-language support (EN/中文)
- **Code Quality**: ESLint + Prettier for consistent code formatting
- **Type Safety**: Full TypeScript coverage across frontend and backend APIs
- **Development**: Hot reload, source maps, and development proxy setup

## 📁 Project Structure

```
sigmaq/
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── surveys/        # Survey management components
│   │   │   ├── questionBanks/  # Question bank components
│   │   │   ├── collections/    # Collection management
│   │   │   ├── modals/         # Modal dialogs
│   │   │   ├── layout/         # Layout components
│   │   │   ├── landing/        # Public website pages
│   │   │   └── common/         # Shared components
│   │   ├── contexts/           # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── constants/          # Application constants
│   ├── public/                 # Static assets and localization files
│   └── dist/                   # Production build output
├── super-admin/                # Super Admin Dashboard (Separate React App)
│   ├── src/
│   │   ├── components/         # Admin-specific components
│   │   ├── types/              # Admin type definitions
│   │   └── api/                # Admin API clients
│   └── dist/                   # Admin build output
├── models/                     # MongoDB Schema Definitions
│   ├── Survey.js              # Survey model with multi-source support
│   ├── QuestionBank.js        # Question bank with required questions
│   ├── Response.js            # Response model with scoring
│   ├── Collection.js          # Survey collections
│   ├── Company.js             # Multi-tenant company model
│   ├── User.js                # User model with roles
│   └── PublicBank.js          # Public question bank marketplace
├── routes/                    # Express API Routes
│   ├── surveys.js            # Public survey endpoints
│   ├── assessments.js        # Assessment-specific logic
│   ├── questionBanks.js      # Question bank management
│   ├── collections.js        # Collection management
│   ├── publicBanks.js        # Public marketplace
│   ├── invitations.js        # Survey invitations
│   ├── superAdmin.js         # Super admin endpoints
│   └── admin/                # Admin-specific routes
├── controllers/              # Business logic controllers
├── middlewares/              # Express middleware (auth, validation, etc.)
├── services/                 # Business service layer
├── schemas/                  # Validation schemas
├── scripts/                  # Utility and setup scripts
├── docs/                     # Comprehensive documentation
├── shared/                   # Shared constants and utilities
└── server.js                 # Main application entry point
```

## 🌐 Application Architecture

### Multi-Tenant Design
SigmaQ uses a **domain-based multi-tenancy** approach:
- Each organization gets a subdomain: `{company}.sigmaq.co`
- Complete data isolation between tenants
- Shared infrastructure with tenant-specific routing
- Cross-tenant administration through super-admin interface

### Survey Source Types
The platform supports multiple question sources:

1. **Manual Creation** (`manual`): Questions created directly in the survey
2. **Question Bank** (`question_bank`): Select from existing question banks
3. **Multi-Bank Selection** (`multi_question_bank`): Combine multiple banks with filters
4. **Manual Selection** (`manual_selection`): Cherry-pick specific questions

### Question Bank Features
- **Hierarchical Organization**: Categories, tags, and difficulty levels
- **Required Questions**: Enforce specific questions in all assessments
- **Import/Export**: CSV-based bulk operations with validation
- **Public Marketplace**: Share and discover question banks
- **Rich Content**: Markdown descriptions and image support

### Assessment Logic
- **Smart Selection**: Automatically include required questions
- **Randomization**: Shuffle questions while respecting constraints  
- **Scoring Engine**: Flexible scoring with percentage and point-based systems
- **Anti-cheat**: Tab switching detection and time limit enforcement
- **Response Tracking**: Detailed candidate journey analytics

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ (recommended: 20.11.0 LTS)
- **MongoDB** 7+ (local instance or MongoDB Atlas)
- **npm** or **yarn** package manager

### Environment Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd sigmaq
   npm install
   cd client && npm install
   cd ../super-admin && npm install
   ```

2. **Environment Configuration**
   Create `.env` file in root:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/sigmaq
   
   # Authentication
   JWT_SECRET=your-super-secure-jwt-secret
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-admin-password
   
   # Server
   PORT=5050
   NODE_ENV=development
   
   # Services (Optional)
   STRIPE_SECRET_KEY=sk_test_...
   CLOUDINARY_CLOUD_NAME=your-cloud
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-secret
   
   # Email (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email
   EMAIL_PASS=your-password
   ```

3. **Start Development**
   ```bash
   # Terminal 1: Backend server
   npm start
   
   # Terminal 2: Frontend development
   cd client && npm run dev
   
   # Terminal 3: Super Admin dashboard (optional)
   cd super-admin && npm run dev
   ```

### Access Points
- **Public Website**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **Super Admin**: http://localhost:5051/super-admin
- **API Endpoints**: http://localhost:5050/api

## 📋 API Overview

### Public Endpoints
```
GET    /api/surveys                    # List active surveys
GET    /api/survey/:slug              # Get survey details  
POST   /api/surveys/:id/responses     # Submit response
GET    /api/assessment/:slug          # Get assessment metadata
POST   /api/assessment/:slug/start    # Start assessment session
POST   /api/assessment/:slug/submit   # Submit assessment
POST   /api/contact                   # Contact form submission
```

### Admin Endpoints (JWT Required)
```
POST   /api/admin/login               # Admin authentication
GET    /api/admin/profile            # Admin profile
GET    /api/admin/surveys            # List all surveys
POST   /api/admin/surveys            # Create survey
PUT    /api/admin/surveys/:id        # Update survey  
DELETE /api/admin/surveys/:id        # Delete survey
GET    /api/admin/question-banks     # List question banks
POST   /api/admin/question-banks     # Create question bank
GET    /api/admin/collections        # List collections
```

### Super Admin Endpoints (Super Admin Role Required)
```
GET    /api/sa/stats                 # System statistics
GET    /api/sa/companies            # List all companies
PUT    /api/sa/companies/:id        # Update company
GET    /api/sa/public-banks         # Manage public banks
GET    /api/sa/audit               # System audit logs
POST   /api/sa/impersonate         # User impersonation
```

## 🎯 Usage Examples

### Creating an Assessment
1. **Set up Question Bank**:
   - Navigate to Question Banks tab
   - Create new bank or import from CSV
   - Mark important questions as "Required"

2. **Build Assessment**:
   - Create new survey with type "Assessment"
   - Select question bank as source
   - Set question count and passing threshold
   - Configure scoring and security settings

3. **Deploy & Monitor**:
   - Activate survey to enable access
   - Share assessment URL with candidates
   - Monitor real-time results in admin dashboard

### Multi-Bank Assessments
```javascript
// Example configuration for combining multiple question banks
{
  "sourceType": "multi_question_bank",
  "multiQuestionBankConfig": [
    {
      "questionBankId": "bank1_id",
      "questionCount": 5,
      "filters": {
        "difficulty": "hard",
        "tags": ["javascript", "backend"]
      }
    },
    {
      "questionBankId": "bank2_id", 
      "questionCount": 3,
      "filters": {
        "questionTypes": ["multiple_choice"]
      }
    }
  ]
}
```

## 🔒 Security Features

- **Data Isolation**: Complete tenant separation in multi-tenant environment
- **Authentication**: JWT-based with secure password hashing  
- **Authorization**: Role-based access control (admin, user, superAdmin)
- **Input Validation**: Zod schema validation on all API endpoints
- **XSS Protection**: Sanitized HTML rendering and content security
- **CSRF Protection**: Token-based request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **Audit Trail**: Comprehensive logging for compliance requirements

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[📖 Documentation Index](./docs/README.md)** - Complete navigation
- **[🔐 Admin Features](./docs/admin/)** - Administrative functionality
- **[⚡ Platform Features](./docs/features/)** - Core platform capabilities  
- **[🔧 Implementation](./docs/implementation/)** - Technical architecture
- **[🧪 Testing](./docs/testing/)** - Test strategies and results
- **[🚀 Deployment](./docs/deployment/)** - Production deployment guides

## 🤝 Contributing

We welcome contributions to SigmaQ! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)  
5. **Open** pull request

### Development Standards
- **TypeScript**: Maintain type safety across all components
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update docs for any API or feature changes
- **Code Style**: Follow ESLint and Prettier configurations
- **Commit Messages**: Use conventional commit format

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**SigmaQ** ([sigmaq.co](https://sigmaq.co)) - Empowering organizations with intelligent assessment solutions.

*Proudly developed by [JR Academy](https://jracademy.ai) - Building the future of learning and assessment technology.*