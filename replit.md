# Overview

This is a comprehensive e-commerce system for selling professional tools and equipment, featuring AI-powered supplier catalog parsing using Claude AI. The application serves as an online catalog for Russian tool suppliers with multilingual support (Russian) and includes advanced features like product import automation, user management, and order processing.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for modern component-based UI
- **Vite** as the build tool and development server
- **Tailwind CSS** with shadcn/ui components for consistent design
- **TanStack React Query** for efficient state management and API calls
- **PWA capabilities** with service worker for offline functionality
- **Responsive design** optimized for mobile and desktop

## Backend Architecture
- **Express.js** with TypeScript for the REST API server
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** (Neon) as the primary database
- **Session-based authentication** with bcrypt password hashing
- **File upload handling** with multer for product images
- **Email services** integration for notifications

## AI Integration
- **Claude AI (Anthropic)** for intelligent catalog parsing and data extraction
- **Web scraping utilities** for automated supplier data collection
- **Smart categorization** and product data normalization

# Key Components

## 1. Product Management System
- Advanced product catalog with categories, variants, and specifications
- Bulk import functionality from CSV files and web scraping
- Image management with local storage and CDN support
- SEO-optimized product pages with slugs and metadata

## 2. AI-Powered Catalog Parser
- **Universal Parser** (`PARSER_SPECIFICATION.md`) for extracting product data from supplier websites
- **Claude AI Integration** for intelligent HTML analysis and data extraction
- **Multi-supplier support** for various Russian tool suppliers (P.I.T Tools, TSS, STURM, etc.)
- **Automated categorization** and data validation

## 3. User Management & Authentication
- Role-based access control (admin, user)
- Secure password hashing with bcrypt
- Session management with PostgreSQL store
- User profile management with additional fields

## 4. Shopping Cart & Orders
- Session-based shopping cart functionality
- Order management with status tracking
- Integration-ready for payment systems
- Email notifications for order updates

## 5. Administrative Dashboard
- Product and category management interface
- User administration and role management
- Bulk import tools for catalog management
- System settings and configuration

# Data Flow

## 1. Product Import Process
```
Supplier Website → Claude AI Analysis → Data Extraction → Validation → Database Storage
```

## 2. User Interaction Flow
```
User Registration → Authentication → Product Browsing → Cart Management → Order Placement → Email Confirmation
```

## 3. Admin Management Flow
```
Admin Login → Dashboard Access → Product/User Management → Bulk Operations → System Configuration
```

# External Dependencies

## AI Services
- **Anthropic Claude AI** for intelligent content extraction and parsing
- API key required for automated catalog processing

## Database
- **Neon PostgreSQL** for production database hosting
- Connection via `@neondatabase/serverless` with WebSocket support

## Email Services
- **SendGrid** integration for transactional emails
- Password reset and order confirmation functionality

## UI Components
- **Radix UI** primitives for accessible component building
- **Lucide React** for consistent iconography
- **shadcn/ui** component library for rapid development

## File Processing
- **multer** for file upload handling
- **iconv-lite** for encoding detection in CSV files
- **csv-parse** for structured data import

# Deployment Strategy

## Production Environment
- **Replit Deployments** with custom domain support (www.eps.su)
- **Environment variables** for API keys and database connections
- **CORS configuration** for multiple domain support

## Development Setup
- **Vite development server** with HMR (Hot Module Replacement)
- **TypeScript compilation** with strict type checking
- **Drizzle Kit** for database migrations and schema management

## Domain Configuration
- Primary domain: www.eps.su
- SSL certificate auto-provisioning
- CDN integration for static assets

# Changelog
- July 01, 2025. Initial setup

# User Preferences

Preferred communication style: Simple, everyday language.