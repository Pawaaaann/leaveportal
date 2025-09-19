# Overview

This is a full-stack college leave management system built with React frontend and Express backend. The application manages the complete workflow of student leave applications, from submission through multi-level approval processes to final QR code generation for approved passes. The system supports different user roles (Student, Mentor, HOD, Principal, Warden) with role-based dashboards and permissions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables
- **State Management**: TanStack Query for server state and React Context for authentication/theme
- **Routing**: Wouter for client-side routing with role-based protected routes
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **API Design**: RESTful API with centralized error handling and request logging middleware

## Authentication System
- **Primary**: Firebase Authentication for user management and authentication
- **Backup**: In-memory storage implementation for development/testing
- **Authorization**: Role-based access control with protected routes and API endpoints
- **Session Handling**: Firebase auth state persistence with Firestore user data storage

## Database Design
- **Schema Structure**: Shared TypeScript schema definitions using Drizzle ORM
- **Tables**: Users, Leave Requests, Notifications with proper relationships
- **Data Validation**: Zod schemas for runtime validation matching database schema
- **Migrations**: Drizzle Kit for database migrations and schema management

## Multi-Stage Approval Workflow
- **Sequential Approval**: Mentor → HOD → Principal → Warden (for hostel students)
- **Dynamic Routing**: Approval stage determines which authority reviews next
- **Status Tracking**: Real-time status updates with approval history
- **Conditional Logic**: Hostel students require additional warden approval

## Document Generation
- **QR Codes**: Generated using qrcode library with leave application data
- **PDF Generation**: PDFKit for creating downloadable leave passes
- **File Serving**: Static file serving for generated documents

## Development Environment
- **Hot Reload**: Vite HMR with Express middleware integration
- **Error Handling**: Runtime error overlay and centralized error boundaries
- **Path Aliases**: TypeScript path mapping for clean imports
- **Build Process**: Separate client and server builds with esbuild for production

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL serverless database for production
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect
- **Database Connection**: @neondatabase/serverless for edge-compatible connections

## Authentication & Storage
- **Firebase**: Authentication, Firestore database, and file storage
- **Session Store**: connect-pg-simple for PostgreSQL session storage

## UI & Styling
- **Radix UI**: Headless UI primitives for accessible components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with customizable styling

## Form & Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation library for type safety
- **@hookform/resolvers**: Integration between React Hook Form and Zod

## Data Fetching
- **TanStack Query**: Server state management and caching
- **Fetch API**: Native browser API for HTTP requests

## Document Processing
- **QRCode**: QR code generation library
- **PDFKit**: PDF document generation
- **Date-fns**: Date manipulation and formatting

## Development Tools
- **TypeScript**: Static type checking
- **Vite**: Fast build tool and dev server
- **ESBuild**: Fast bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS