# autoapply.ai

## Overview

autoapply.ai is a web service designed to automate job applications. It scrapes LinkedIn job data, enriches it with contact information, and generates AI-powered emails for application. The platform features Google OAuth authentication, a modern SaaS-inspired UI with glassmorphism effects, a marble/statue aesthetic, dark mode support, and Framer Motion animations. Key capabilities include resume upload (text and PDF), automated resume storage and reuse, and a comprehensive job search form with location autocomplete and predefined job roles. The service integrates with Cashfree for payment processing, targeting a seamless and efficient job application experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom glassmorphism, gradient designs, and animation utilities.
- **State Management**: TanStack Query (React Query) for server state management.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Design Features**: Modern UI with gradient buttons, glassmorphic cards, animated elements, dark/light mode, and enhanced visual feedback, inspired by Linear.app/Framer/Vercel. Color scheme: deep navy blue, marble white, and muted gold accent.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful API supporting async job processing and status polling.
- **Data Validation**: Zod schemas for request validation.
- **Error Handling**: Centralized middleware for structured error responses.

### Data Storage Solutions
- **Database**: PostgreSQL with Neon Database serverless PostgreSQL.
- **ORM**: Drizzle ORM with TypeScript-first schema definitions and Drizzle Kit for migrations.
- **Schema Design**: Tables for job scraping requests (metadata, status, results JSON), user data (including resume storage), and subscription/payment information.

### API Architecture
- **Request Flow**: Asynchronous job processing, returning tracking IDs for polling.
- **Status Polling**: Clients poll GET endpoints for real-time status updates.
- **Data Validation**: LinkedIn URL validation, AI-powered location normalization to LinkedIn geoIds, and work type mapping.
- **Gmail Integration**: Automatic token refresh for Gmail API to send emails on behalf of users.

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL).
- **UI Framework**: Radix UI.
- **Build Tools**: ESBuild (server bundling), Vite (client-side development).
- **Validation**: Zod.
- **Styling**: Tailwind CSS.
- **Authentication**: Google OAuth 2.0 (for user authentication and Gmail API access).
- **APIs**: Apify (for LinkedIn job scraping and email verification), OpenAI (for personalized email generation), Cashfree (for payment gateway integration).

## Recent Changes

- **2025-08-04**: Successfully implemented two-step OAuth flow with completely separate authentication flows:
  - **Regular Login**: Uses Passport.js with basic Google scopes (profile, email) via /api/auth/google/callback
  - **Gmail Authorization**: Uses direct OAuth2Client with gmail.send scope only via /api/auth/gmail/callback
  - **Key Innovation**: Completely separate OAuth flows prevent configuration mismatches that caused "invalid_credentials" errors
  - Users can login with any Google account and authorize Gmail sending with a different Gmail account
  - Added /api/auth/gmail/callback to Google Cloud Console authorized redirect URIs
  - Eliminated session persistence issues by keeping OAuth flows independent
  - Progressive permission model: basic auth first, Gmail permissions only when needed for email sending
  - Fixed all authentication errors by maintaining consistent OAuth client configuration within each flow

- **2025-08-04**: Enhanced Apply button UX with smart Gmail flow:
  - **New users**: Apply button first checks Gmail authorization, shows Gmail setup prompt if needed
  - **Authorized users**: Apply button automatically generates and shows email (no regenerate button needed)
  - Streamlined experience eliminates manual regenerate step for users with Gmail permissions
  - Added Gmail authorization modal with privacy-focused messaging directly in job cards
  - Email composer now conditionally shows regenerate button only when email hasn't been auto-generated

- **2025-08-04**: Fixed persistent logout issue by implementing PostgreSQL session store:
  - **Root Cause**: Default memory store was losing sessions between server restarts/requests in production
  - **Solution**: Replaced memory store with PostgreSQL-based session persistence using connect-pg-simple
  - Sessions now persist across server restarts and maintain user login state reliably
  - Enhanced session debugging with detailed logging for troubleshooting authentication issues
  - Session table automatically created in PostgreSQL database for production session storage