---
description: Repository Information Overview
alwaysApply: true
---

# ProfGini Platform Information

## Summary
The ProfGini Platform (AI Discussion Response Generator) is a Next.js 13 application designed to assist professors in generating responses to student discussions. It features a multi-AI provider system (Groq, Hugging Face, Anthropic, OpenAI) and uses Radix UI and Tailwind CSS for the interface.

## Structure
- **app/**: Contains the application routes (App Router) and API endpoints.
- **components/**: Reusable UI components, including `ui/` for Radix primitives.
- **lib/**: Utility functions and libraries.
- **prisma/**: Database schema and migrations.
- **adaptors/**: AI provider implementation adaptors.
- **config/**: Application configuration files.
- **public/**: Static assets.
- **styles/**: Global CSS and Tailwind directives.
- **types/**: TypeScript type definitions.

## Language & Runtime
**Language**: TypeScript  
**Version**: Node.js 12+  
**Build System**: Next.js (v13.4.8)  
**Package Manager**: pnpm

## Dependencies
**Main Dependencies**:
- **next**: ^13.4.8
- **react**: ^18.2.0
- **typescript**: ^5.6.3
- **@prisma/client**: ^5.20.0
- **next-auth**: ^4.24.8
- **ai**: ^3.4.33
- **openai**: ^4.70.2
- **@anthropic-ai/sdk**: ^0.70.0
- **tailwindcss**: ^3.4.18
- **@radix-ui/react-***: Various UI primitives

**Development Dependencies**:
- **prisma**: ^5.22.0
- **eslint**: ^8.44.0
- **prettier**: ^2.8.8

## Build & Installation
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm migration:postgres:local

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Docker
No Docker configuration found.

## Testing
No formal testing framework (Jest/Vitest) configuration was found.
