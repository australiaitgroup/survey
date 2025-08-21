# SigmaQ Frontend

This is the frontend application for SigmaQ Survey Platform built with React, TypeScript, and Vite.

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on port 5050

### Installation

```bash
npm install
```

### Running in Development

```bash
npm run dev
```

The frontend will run on **http://localhost:5051**

### Environment Variables

The application uses environment variables for configuration:

- **Development** (`.env.development`):
    - `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:5050/api)
    - `VITE_APP_URL`: Frontend URL (default: http://localhost:5051)

- **Production** (`.env.production`):
    - `VITE_API_BASE_URL`: Your production API endpoint
    - `VITE_APP_URL`: Your production frontend URL

### Frontend-Backend Separation

The frontend and backend are completely separated:

1. **Frontend**: Runs on port 5051 (development)
2. **Backend**: Runs on port 5050

In development, Vite proxy is configured to forward API requests from `/api` to `http://localhost:5050/api`.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to S3 or any static hosting service.

### Deploying to S3

1. Build the application:

    ```bash
    npm run build
    ```

2. Configure your S3 bucket for static website hosting

3. Upload the contents of the `dist` directory to your S3 bucket

4. Update the `.env.production` file with your actual API endpoint before building

### API Configuration

All API calls go through the configured axios instance in `src/utils/axiosConfig.ts`. The base URL is automatically determined based on the environment:

- **Development**: Uses Vite proxy (`/api`)
- **Production**: Uses the configured `VITE_API_BASE_URL`

### Important Notes

- Make sure the backend CORS is configured to allow requests from the frontend domain
- Update environment variables before building for production
- The frontend can be deployed independently from the backend
