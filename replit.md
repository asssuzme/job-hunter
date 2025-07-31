# LinkedIn Job Scraper

## Overview

A full-stack web application that extracts comprehensive job data from LinkedIn job postings. Users submit LinkedIn job URLs through a modern React interface, and the system scrapes detailed information including job details, company information, and posting metadata. The application uses a PostgreSQL database with Drizzle ORM for data persistence and provides real-time status updates during the scraping process. Supports resume upload functionality for both text and PDF files with automatic text extraction.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

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