# autoapply.ai

## Overview

autoapply.ai is a web service designed to automate job applications. It scrapes LinkedIn job data using the Apify API, enriches it with contact information, and generates AI-powered emails for application. The platform features Google OAuth authentication, a modern SaaS-inspired UI with glassmorphism effects, a marble/statue aesthetic, dark mode support, and Framer Motion animations. Key capabilities include resume upload (text and PDF), automated resume storage and reuse, and a comprehensive job search form with location autocomplete and predefined job roles. The service integrates with Cashfree for payment processing, targeting a seamless and efficient job application experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2025-08-03**: Enhanced Gmail integration with improved permissions and unlinking functionality:
  - Reduced Gmail OAuth scope from multiple permissions to minimum required (`gmail.send` only)
  - Added Gmail unlinking feature allowing users to disconnect without deleting credentials
  - Implemented `isActive` field in gmailCredentials table for soft disconnect/reconnect
  - Created `/api/auth/gmail/unlink` endpoint for managing Gmail connection state
  - Updated email composer modal with unlink button for connected Gmail accounts
  - Modified email sending logic to check both token validity and active status
  - Users can now unlink and relink Gmail accounts anytime without re-authorization
  - Created Privacy Policy and Terms of Service pages for Google OAuth verification compliance
  - Fixed white screen issue after login caused by incorrect component imports

- **2025-08-03**: Fixed critical authentication issues and implemented Gmail OAuth integration:
  - Resolved database foreign key constraint violation by updating user upsert logic to preserve existing user IDs
  - Fixed infinite authentication loop by removing redundant auth state listeners
  - Simplified authentication flow to work properly with Supabase OAuth
  - Authentication now successfully syncs between Supabase and backend sessions
  - Implemented hybrid authentication solution: Supabase for sign-in + Gmail OAuth for email sending
  - Added Gmail credentials table and storage methods for managing Gmail tokens
  - Created complete Gmail OAuth flow with authorization, callback handling, and token refresh
  - Updated email sending to use Gmail API directly when user has authorized access
  - Added Gmail authorization UI in email composer modal with clear user prompts
  - Emails are now sent directly from users' personal Gmail accounts when authorized

- **2025-08-03**: Comprehensive code cleanup and quality improvements:
  - Fixed all database field naming inconsistencies (snake_case to camelCase)
  - Removed console.log statements throughout the codebase for cleaner production code
  - Replaced direct database queries with proper storage interface calls
  - Improved type safety in frontend components
  - Enhanced error handling by removing verbose logging
  - Cleaned up unused code and simplified data calculations
  - Fixed type errors in home.tsx for better TypeScript compliance
  - Streamlined Cashfree payment service implementations

- **2025-08-03**: Enhanced loading animations throughout the application:
  - Created comprehensive loading animation components with Framer Motion for smooth, professional animations
  - Replaced all basic Loader2 spinners with new animated components (Spinner, GridLoader, DotsLoader, PageLoader)
  - Updated auth-callback.tsx to use GridLoader with smooth scale and fade animations
  - Updated landing.tsx to use PageLoader component for initial auth loading
  - Updated home.tsx stat cards to use animated Spinner component
  - Updated job-scraper.tsx submit button to use DotsLoader animation
  - Updated email-composer-modal.tsx with DotsLoader for email generation and Spinner for send operations
  - Updated analytics.tsx to use PageLoader for loading state
  - Updated App.tsx initial loading to use PageLoader component
  - Added skeleton loaders for stat cards and progress bar components for better UX

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