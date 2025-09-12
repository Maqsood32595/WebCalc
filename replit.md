# Webcalc - No-Code Calculator Builder

## Overview

Webcalc is a no-code calculator builder platform that allows users to create, customize, and monetize professional calculators without programming knowledge. Users can build interactive calculators using a drag-and-drop interface, apply custom styling, publish them publicly or privately, and accept payments for premium features. The platform includes pre-built templates for common calculator types like mortgage, ROI, and BMI calculators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing with authentication guards
- **State Management**: TanStack Query for server state management and API caching
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design system
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API server
- **Language**: TypeScript for full-stack type safety
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage for persistent user sessions

### Authentication System
- **Provider**: Replit Auth (OpenID Connect) for seamless authentication in Replit environment
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless for scalable cloud hosting
- **Schema Management**: Drizzle Kit for database migrations and schema updates
- **Key Entities**:
  - Users: Profile information and subscription status
  - Calculators: User-created calculators with fields, formulas, and styling
  - Templates: Pre-built calculator templates for quick setup
  - Sessions: User session management for authentication

### Calculator Builder System
- **Visual Editor**: Drag-and-drop interface for adding form fields and components
- **Field Types**: Support for text inputs, numbers, dropdowns, checkboxes, and result displays
- **Formula Engine**: Custom JavaScript expression evaluator for calculator logic
- **Styling System**: Customizable themes and styling options for calculator appearance

### Payment Integration
- **Primary Provider**: Stripe for subscription management and one-time payments
- **Secondary Provider**: PayPal for alternative payment processing
- **Monetization**: Support for paid calculators and premium subscriptions

## External Dependencies

### Payment Services
- **Stripe**: Subscription billing and payment processing with React Stripe.js integration
- **PayPal**: Alternative payment method using PayPal Server SDK

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Hosting**: Platform deployment and authentication services

### Development Tools
- **Drizzle ORM**: Type-safe database operations and schema management
- **TanStack Query**: Server state management and API caching
- **Zod**: Runtime type validation for forms and API requests

### UI & Styling
- **Radix UI**: Headless UI primitives for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide Icons**: Consistent icon library for UI elements

### Build & Development
- **Vite**: Fast development server and production bundler
- **TypeScript**: Static typing across frontend and backend
- **ESBuild**: Fast JavaScript bundling for server-side code