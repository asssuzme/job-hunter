# LinkedIn Job Scraper

## Overview

A sophisticated web service that leverages Apify API to scrape, filter, and enrich LinkedIn job data with advanced contact information extraction and AI-powered email generation capabilities. Features Google OAuth authentication for seamless user access and a modern SaaS-inspired interface with glassmorphism effects, marble/statue aesthetic, dark mode support, and Framer Motion animations. Supports resume upload functionality for both text and PDF files with automatic text extraction.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2, 2025)

### Job Search Form Update
- **Replaced LinkedIn URL Input**: Changed from single URL input to comprehensive job search form
- **New Form Fields**:
  - Job Keyword: Text input for job titles/keywords
  - Location: Free text input with AI-powered normalization
  - Work Type: Dropdown with On-site, Remote, and Hybrid options
- **LinkedIn URL Generation**: New `/api/generate-linkedin-url` endpoint uses OpenAI to:
  - Normalize location names to LinkedIn geoIds (supports major Indian cities)
  - Map work types to LinkedIn format (1=On-site, 2=Remote, 3=Hybrid)
  - Generate proper LinkedIn search URLs automatically
- **Seamless Integration**: Generated URLs pass directly to existing scraping pipeline

### Gmail Token Refresh Implementation
- **Fixed Token Expiration Issue**: Implemented automatic token refresh for Gmail API
- **Refresh Token Function**: Added `refreshGoogleToken` function to handle expired access tokens
- **Enhanced Send-Email Endpoint**: Updated to automatically refresh tokens on 401 errors
- **Session Management**: Properly stores new access tokens after refresh
- **User Experience**: Eliminates repeated sign-in requirements, tokens refresh seamlessly

## Recent Changes (August 1, 2025)

### Resume Storage and Automatic Reuse
- **Persistent Resume Storage**: User resumes are now permanently stored in the database
- **Database Schema Update**: Added resumeText, resumeFileName, and resumeUploadedAt fields to users table
- **Automatic Loading**: Resume automatically loads when users visit job scraper or results pages
- **API Endpoints**: New `/api/user/resume` endpoint to check and retrieve stored resumes
- **Email Personalization**: Stored resume is automatically used for all email generation
- **One-time Upload**: Users only need to upload their resume once; it's reused for all future applications

### Complete UI/UX Redesign - SaaS-Style Interface
- **Design System**: Implemented modern SaaS-inspired UI similar to Linear.app/Framer/Vercel
- **Color Scheme**: Deep navy blue (#0a0f1c), marble white (#fafafa), and muted gold accent (#d4af37)
- **Theme Support**: Added dark/light mode toggle with proper theme provider implementation
- **Layout**: Implemented DashboardLayout component with animated sidebar navigation
- **Glassmorphism**: Applied glass-card effects throughout all components with backdrop blur
- **Marble Aesthetic**: Landing page features statue/marble theme with gradient backgrounds
- **Animations**: Integrated Framer Motion for smooth page transitions and interactive elements
- **Components Updated**:
  - Landing page: Centered auth card with marble aesthetic and animated elements
  - Home page: Dashboard layout with sidebar, stats cards, and animated progress rings
  - Job Scraper: Modern form design with glassmorphism and progress indicators
  - Results page: Dashboard layout with categorized tabs and modern job cards
  - FilteredJobCard: Glassmorphic design with hover effects and smooth transitions

## Previous Changes (August 1, 2025)

### Authentication Update
- **Replaced Replit Auth with Google OAuth 2.0**: Full migration to Google OAuth authentication
- **Gmail Integration**: Added full Gmail API access scopes for sending emails on behalf of users
- **OAuth Scopes**: Configured with openid, email, profile, and Gmail send/compose/modify permissions
- **Session Management**: Using PostgreSQL-backed sessions with secure cookies
- **Google Client Credentials**: Using new OAuth 2.0 client with ID: 819154232203-ank4nbeji2dge34c7lqob8qgt3ng8bqe.apps.googleusercontent.com

## Previous Changes (August 1, 2025)

### UI/UX Enhancements
- **Modern Design System**: Implemented glassmorphism effects across all cards and containers
- **Color Scheme**: Added gradient designs with primary/secondary color combinations
- **Typography**: Enhanced font weights and sizes for better readability
- **Animations**: Added fade-in animations, hover effects, and smooth transitions
- **Button Styles**: Created gradient buttons with shadow effects and hover states
- **Form Components**: Improved input fields with icons and better visual hierarchy
- **Status Indicators**: Enhanced loading states with pulse rings and animated progress bars
- **Card Components**: Redesigned job cards and filtered job cards with modern styling
- **Resume Upload**: Improved visual feedback with gradient backgrounds and icon styling
- **Alert States**: Enhanced error, warning, and success states with better visual design

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom glassmorphism effects, gradient designs, and animation utilities
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Design Features**: Modern UI with gradient buttons, glassmorphic cards, animated elements, and enhanced visual feedback

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with POST endpoint for job scraping requests and GET endpoint for status polling
- **Data Validation**: Zod schemas for request validation and type safety
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Development**: Hot reloading with Vite integration for seamless development experience

### Data Storage Solutions
- **Database**: PostgreSQL with Neon Database serverless PostgreSQL for production data storage
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Production Storage**: DatabaseStorage class implementing IStorage interface for PostgreSQL operations

### Database Schema Design
- **Job Scraping Requests Table**: Stores request metadata including LinkedIn URL, processing status, results JSON, error messages, and timestamps
- **Status Tracking**: Enum-based status system (pending, processing, completed, failed) for request lifecycle management
- **Results Storage**: JSONB field for flexible storage of scraped job data including job details, company information, and metadata

### API Architecture
- **Request Flow**: Async job processing pattern where requests return immediately with tracking ID
- **Status Polling**: Client polls GET endpoint for real-time status updates using React Query's interval polling
- **Data Validation**: LinkedIn URL validation ensuring proper job posting format and domain verification
- **Response Format**: Consistent JSON response structure with error handling and status codes

### External Dependencies
- **Database**: Neon Database serverless PostgreSQL for production data storage
- **UI Framework**: Radix UI for accessible, unstyled component primitives
- **Build Tools**: ESBuild for production server bundling and Vite for client-side development
- **Validation**: Zod for runtime type checking and schema validation across client and server
- **Styling**: Tailwind CSS for utility-first styling with custom design system variables
- **Development**: Replit-specific tooling for development environment integration
- **Authentication**: Google OAuth 2.0 for secure user authentication with full Gmail send/compose permissions
- **APIs**: Apify for LinkedIn job scraping and email verification, OpenAI for personalized email generation