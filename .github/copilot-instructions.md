# Professor GENIE Platform - AI Coding Assistant Instructions

## Architecture Overview

**Professor GENIE** is a Next.js 15+ education platform that helps professors generate AI-powered discussion responses and assignment feedback. The codebase uses:

- **Next.js 15+ App Router** with TypeScript and edge runtime for AI routes
- **Prisma ORM** with PostgreSQL database (Neon for production)
- **NextAuth.js** for Google OAuth authentication with database sessions
- **Multi-AI Provider System** with graceful fallbacks to free/mock providers
- **Role-based subscription management** (ADMIN/PROFESSOR/STUDENT) with trial periods
- **Radix UI + Tailwind CSS** for components with dark mode support

## Key Architectural Patterns

### 1. Multi-AI Provider Pattern (`/adaptors/`)
The platform supports multiple AI providers with automatic fallbacks:
```typescript
// Usage pattern from multi-ai.adaptor.ts
const providers = ["openai", "anthropic", "gemini", "groq", "perplexity", "cohere", "huggingface", "mock"]
```
- Each adaptor implements the `AIProvider` interface from `types/ai.types.ts`
- **Always check provider availability** before implementing new AI features
- The system falls back through providers if one fails

### 2. Subscription-Based Feature Gates (`lib/enhanced-subscription-manager.ts`)
Features are controlled by subscription tiers with usage limits:
```typescript
// Always check permissions before accessing features
const hasAIFeatures = subscriptionLimits.canUseAIFeatures
const withinStudentLimit = usage.students < limits.maxStudents
```

### 3. Role-Based Authorization Pattern
The proxy (`proxy.ts`) handles complex routing based on:
- User role (ADMIN/PROFESSOR/STUDENT)
- Subscription status and trial expiration
- Feature access permissions

## Critical Developer Workflows

### Tech Stack Versions
- **Next.js**: 16.1.1+ (App Router with edge runtime)
- **React**: 18.2.0+
- **Prisma**: 5.20.0+
- **NextAuth**: 4.24.8+ with database sessions
- **Package Manager**: pnpm (required for scripts)

### Database Operations
```bash
# Local development with Prisma using dotenvx
pnpm run migration:postgres:local  # Run with .env.local (using dotenvx)
pnpm run prisma:generate          # Generate client after schema changes

# Development workflow
pnpm dev                          # Start dev server on port 3000
pnpm build && pnpm start         # Production build and start
```

### Environment Setup
- **Local**: Uses `.env.local` with dotenvx for environment isolation
- **Production**: Vercel deployment with Neon PostgreSQL (pooled + direct connections)
- **Database**: Requires both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) for Neon

### Authentication Setup
- Requires Google OAuth credentials in environment
- Check `GOOGLE_OAUTH_SETUP.md` for configuration
- Auth redirects are handled in `proxy.ts` based on subscription status
- **Database sessions** strategy (not JWT) - session data stored in PostgreSQL

### AI Provider Configuration
- API keys are checked at runtime in `/api/chat/route.ts`
- Missing keys fall back to mock provider
- Check provider status with `multiAI.getProviderStatus()`
- Providers prioritized: user paid keys → free providers → mock
- All AI routes use **edge runtime** for performance

## Project-Specific Conventions

### API Route Patterns
```typescript
// All AI chat routes use this pattern (/app/api/chat/route.ts)
export const runtime = "edge"  // Always use edge runtime for AI routes

// System prompts are dynamically selected based on request content
if (messages[0]["content"].includes("myTArequestType:")) {
  systemContent = "grading assistant prompt"
} else {
  systemContent = "discussion response prompt"  
}
```

### Component Architecture
- **Feature components** in `/components/` (e.g., `course-management.tsx`)
- **UI primitives** in `/components/ui/` using Radix patterns
- **Page layouts** follow the pattern: `FeatureLayout` → `specific feature component`

### Database Schema Relationships
Key entities and their relationships:
- `User` → `Course` (instructor relationship)
- `Course` → `Module`, `Assignment`, `DiscussionThread`
- `User` → `Enrollment` → `Course` (student-course relationship)
- All models use `cuid()` IDs, not auto-increment
- **Neon requires both pooled and direct connections** for migrations vs queries

## Integration Points

### Chrome Extension Integration
- Manifest file: `chrome-extension-manifest.json`
- Extension API routes in `/app/api/extension/`
- File upload handling via `formidable` in `/app/api/user-files/`

### External Dependencies
- **Prisma Client**: Always import from `@/lib/prisma`, not direct `@prisma/client`
- **Auth**: Use `requireSession()` from `@/lib/auth` for protected API routes
- **File Processing**: Uses `mammoth` for Word doc conversion, `formidable` for uploads
- **Environment Variables**: Uses `dotenvx` for local environment isolation

## Admin Scripts & Setup

### First-time Setup
```bash
# Create admin user (run after initial deploy)
node scripts/setup-admin.js

# Make existing user admin
node scripts/make-admin.js
```

### Database Testing
```bash
node scripts/test-db.js  # Verify database connectivity
```

## Debugging Patterns

### Subscription & Auth Issues
- Check `proxy.ts` console logs for auth flow debugging
- Subscription redirects log to console with 🎉, 🚫, 🏠 emojis
- Trial expiration handling in `/app/subscription/upgrade/`

### AI Provider Issues
- Provider availability logged on server startup
- Mock provider activates when no real providers available
- Check `multiAI.getSetupInstructions()` for missing API key guidance

### File Upload Debugging
- File uploads use `formidable` with custom config in `/api/user-files/`
- Supported formats defined in `schemas/file-input.schema.ts`

## Critical Files to Understand

- `proxy.ts`: Auth, role-based routing, subscription checks
- `lib/enhanced-subscription-manager.ts`: Feature gates and usage limits
- `adaptors/multi-ai.adaptor.ts`: AI provider selection and fallback logic
- `prisma/schema.prisma`: Database relationships and enums
- `app/api/chat/route.ts`: Main AI chat endpoint with dynamic prompts