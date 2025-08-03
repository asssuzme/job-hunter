# autoapply.ai

## Overview

autoapply.ai is a web service designed to automate job applications. It scrapes LinkedIn job data using the Apify API, enriches it with contact information, and generates AI-powered emails for application. The platform features Google OAuth authentication, a modern SaaS-inspired UI with glassmorphism effects, a marble/statue aesthetic, dark mode support, and Framer Motion animations. Key capabilities include resume upload (text and PDF), automated resume storage and reuse, and a comprehensive job search form with location autocomplete and predefined job roles. The service integrates with Cashfree for payment processing, targeting a seamless and efficient job application experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2025-08-04**: Simplified navigation structure:
  - Removed redundant Dashboard menu item from sidebar
  - Made Job Search the primary landing page (/)
  - Consolidated user experience by eliminating duplicate functionality

- **2025-08-04**: Enhanced job search loading experience:
  - Created full-screen immersive loading animation that replaces the form during processing
  - Added smooth animated progress bar that increases gradually (1% every 100ms)
  - Implemented status-specific animations (globe, search, filter, mail icons)
  - Added tips carousel that rotates every 5 seconds with helpful information
  - Created animated job card previews that slide across the screen
  - Added abort functionality with Cancel button and X icon to stop job search
  - Fixed scrolling issues by adding overflow-y-auto to dialog containers
  - Extended cancel functionality to results page for viewing ongoing searches
  - Added X close button and Cancel Search button to results page loading animation

- **2025-08-04**: Updated all contact email addresses site-wide to team@gigfloww.com:
  - Replaced all instances of autoapply.ai email addresses across footer, contact page, legal pages
  - Consolidated all support/privacy/legal/DPO emails to single email: team@gigfloww.com
  - Updated refund request instructions to use team@gigfloww.com

- **2025-08-04**: Fixed and finalized fake data system for consistent job counts:
  - New searches generate random fake total (500-2000) that's permanently stored
  - Old searches use consistent hash-based generation from search ID
  - Dashboard correctly sums all fake totals (both new and old searches)
  - Numbers never change once generated - completely consistent across refreshes
  - Restored job count widgets on recent search cards
  - Free jobs = actual jobs with contacts, locked jobs = fake total minus free jobs

- **2025-08-03**: Removed Supabase and implemented direct Google OAuth:
  - Completely removed Supabase dependency
  - Implemented Passport.js with Google OAuth 2.0 strategy
  - Updated frontend to use direct Google OAuth endpoints
  - Simplified authentication flow with session-based auth
  - All authentication now handled directly through Google

- **2025-08-04**: Shifted back to production environment for https://gigfloww.com:
  - Re-enabled production detection with gigfloww.com domain checks
  - Updated session cookies to use secure settings with sameSite: 'none' for production
  - Set cookie domain to '.gigfloww.com' for cross-subdomain compatibility
  - Added CORS headers for production domains (gigfloww.com, www.gigfloww.com)
  - Updated Gmail OAuth to dynamically generate redirect URLs based on request hostname
  - Configured frontend auth logic to use Google OAuth for production domain
  - All OAuth callbacks now work properly with both development and production URLs

- **2025-08-03**: Reverted to development environment:
  - Shifted back to development URL (http://localhost:5000) due to multiple bugs in production
  - Session persistence issues causing repeated logouts
  - Job search form submission not working properly
  - Development environment provides better stability for testing and debugging
  - Removed production-specific configurations temporarily

- **2025-08-03**: Fixed production deployment issues for https://gigfloww.com:
  - Updated session cookie configuration to work with custom domain
  - Added proper CORS headers for production domains
  - Fixed Gmail OAuth callback URLs to use correct production domain
  - Improved production environment detection for Replit deployment
  - Set cookie domain to `.gigfloww.com` for cross-subdomain compatibility
  - Ensured secure cookies with sameSite: 'none' for production

- **2025-08-03**: Complete Vercel serverless deployment conversion:
  - Converted entire backend from Express.js to Vercel serverless functions
  - Migrated from session-based to JWT token authentication for stateless serverless compatibility
  - Created comprehensive API endpoint structure with proper authentication and CORS handling
  - Implemented JWT token management with localStorage storage and Authorization headers
  - Updated all client-side authentication flows to work with new JWT system
  - Created utility libraries for auth, database connections, and CORS management
  - Built complete serverless API covering dashboard stats, job scraping, email generation/sending
  - Added Gmail OAuth integration and resume upload functionality for serverless environment
  - Updated database operations to work with per-request connections in serverless functions
  - Created detailed deployment guide and environment variable configuration
  - Architecture now fully compatible with Vercel's serverless platform for global scalability

- **2025-08-03**: Fixed production authentication persistence issue:
  - Resolved session cookies not persisting in production due to incorrect environment detection
  - Updated session configuration to properly detect production environment using Replit domain
  - Fixed cookie settings to use `sameSite: "none"` with secure cookies for production HTTPS
  - Authentication now persists correctly after login on production URLs
  - Sessions maintain state across page refreshes and navigation

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