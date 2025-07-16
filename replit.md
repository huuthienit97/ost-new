# Member Management System - Club Sáng Tạo

## Overview

This is a full-stack web application for managing a student club ("Club Sáng Tạo" - Creative Club). The system provides comprehensive member management, role-based access control, achievement tracking, mission assignment, and a virtual economy using BeePoints. Built with modern web technologies, it serves as a complete digital platform for student organization administration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing
- **Component Library**: Shadcn/ui component system

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Uploads**: Multer middleware for handling multipart form data
- **API Documentation**: Swagger/OpenAPI with swagger-ui-express

### Data Storage Solutions
- **Primary Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle for type-safe database operations
- **File Storage**: Local filesystem with organized upload directory structure
- **Session Management**: JWT tokens with configurable expiration

## Key Components

### Authentication & Authorization
- **Role-Based Access Control (RBAC)**: Hierarchical permission system
- **JWT Authentication**: Secure token-based authentication
- **Permission System**: Granular permissions for different operations
- **Password Management**: Secure password hashing and reset functionality

### Member Management
- **Member Profiles**: Comprehensive member information storage
- **Division Assignment**: Members organized by divisions (departments)
- **Position Hierarchy**: Leadership and role assignments
- **Academic Year Tracking**: Multi-year member lifecycle management

### Virtual Economy (BeePoints)
- **Point System**: Digital currency for club activities
- **Transaction Tracking**: Complete audit trail of point movements
- **Reward System**: Points earned through missions and achievements
- **Shop Integration**: Members can exchange points for rewards

### Mission System
- **Task Assignment**: Structured mission distribution to members
- **Progress Tracking**: Real-time status monitoring
- **Submission System**: File upload and review workflow
- **Automated Rewards**: BeePoints distribution upon completion

### Achievement System
- **Badge Management**: Digital achievement badges with categories
- **Recognition Tracking**: Member accomplishment history
- **Reward Integration**: Achievement-based point distribution

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. Server validates against database using bcrypt
3. JWT token generated with user permissions
4. Client stores token and includes in subsequent requests
5. Middleware validates token on protected routes

### Member Management Flow
1. Authenticated users with appropriate permissions access member data
2. CRUD operations filtered by user permissions
3. Division and position assignments tracked in relational tables
4. Real-time updates propagated via React Query cache invalidation

### Mission Assignment Flow
1. Administrators create missions with parameters and rewards
2. Members assigned to missions based on criteria
3. Members submit completion evidence through upload system
4. Reviewers approve/reject submissions
5. BeePoints automatically distributed upon approval

### BeePoints Transaction Flow
1. Actions trigger point calculations (missions, achievements, purchases)
2. Transactions recorded with full audit trail
3. User balances updated atomically
4. Real-time balance updates reflected in UI

## External Dependencies

### Database & Infrastructure
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe database operations and migrations
- **drizzle-kit**: Database schema management and migrations

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and validation
- **multer**: File upload handling and validation

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation with Zod integration
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime type validation and schema definition

### Development & Documentation
- **swagger-jsdoc**: API documentation generation
- **swagger-ui-express**: Interactive API documentation interface
- **typescript**: Static type checking across the application

## Deployment Strategy

### Production Environment
- **Primary Domain**: https://api.ost.edu.vn
- **Process Management**: PM2 for application lifecycle management
- **Static Assets**: Express.js serving uploaded files and built frontend
- **Environment Variables**: Database URL, JWT secrets, and configuration

### Development Environment
- **Local Development**: Vite dev server with Express API backend
- **Hot Module Replacement**: Real-time code updates during development
- **Development Database**: Shared PostgreSQL instance for consistency

### Build Process
1. **Frontend Build**: Vite compiles React application to static assets
2. **Backend Build**: ESBuild bundles server code for production
3. **Database Migrations**: Drizzle handles schema updates automatically
4. **Asset Optimization**: Automatic minification and compression

### Monitoring & Maintenance
- **Error Logging**: PM2 log aggregation for error tracking
- **Performance Monitoring**: Application metrics through PM2 dashboard
- **Database Backups**: Automated PostgreSQL backups via Neon
- **Security Updates**: Regular dependency updates and vulnerability scanning