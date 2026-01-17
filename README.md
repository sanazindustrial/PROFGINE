# Professor GENIE Platform 🎓✨

**Professor GENIE** is a Next.js 15+ AI-powered education platform that revolutionizes how professors generate discussion responses and assignment feedback. Built with modern technologies and a multi-AI provider system, it offers intelligent, context-aware assistance for educators.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.20.0+-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Key Features

### 🤖 Multi-AI Provider System

- **Automatic Fallback**: Seamlessly switches between OpenAI, Anthropic, Gemini, Groq, Perplexity, Cohere, and Hugging Face
- **Cost-Optimized**: Falls back to free providers when paid keys unavailable
- **Edge Runtime**: Lightning-fast AI responses with Next.js edge functions

### 👥 Role-Based Access Control

- **Three User Roles**: ADMIN, PROFESSOR, STUDENT
- **Subscription Tiers**: Free trial, Basic, and Premium plans with feature gates
- **Trial Management**: Automatic trial period tracking and upgrade prompts

### 📚 Course Management

- Complete course, module, and assignment organization
- Discussion thread management
- Student enrollment and progress tracking
- File upload support (Word docs, PDFs, text files)

### 🎨 Modern UI/UX

- Radix UI components with dark mode support
- Responsive design for all devices
- Accessible and customizable interface
- Tailwind CSS with class sorting and merging

### 🔐 Secure Authentication

- Google OAuth integration via NextAuth.js
- Database sessions (PostgreSQL)
- Protected API routes and pages
- Role-based authorization proxy

### 🧩 Chrome Extension Support

- Browser extension integration for Canvas/Blackboard
- Direct file upload from LMS platforms
- Seamless communication with main app

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0+ (recommended: 20.x)
- **pnpm**: Package manager (required)
- **PostgreSQL**: Database (Neon recommended for production)
- **Google OAuth**: Credentials for authentication

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/sanazindustrial/PROFGINE.git
   cd PROFGINE
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Setup environment variables**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Configure database**:

   ```bash
   # Generate Prisma client
   pnpm run prisma:generate
   
   # Run migrations (using dotenvx for environment)
   pnpm run migration:postgres:local
   ```

5. **Create admin user**:

   ```bash
   node scripts/setup-admin.js
   ```

6. **Start development server**:

   ```bash
   pnpm dev
   # Open http://localhost:3000
   ```

## 📋 Environment Setup

See [`.env.example`](.env.example) for all required environment variables.

### Essential Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth (required)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# At least one AI provider recommended
OPENAI_API_KEY="sk-..."
```

See [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md) for OAuth configuration.

## 📁 Project Structure

The project follows the Next.js 13 App Directory structure. Here's an overview of the main directories and files:

- `app/`: Contains the application routes and pages.
  - `api/`: Holds the API routes.
    - `chat/`: Contains the chat API route.
- `components/`: Includes reusable components used throughout the application.
  - `ui/`: Contains UI-specific components.
- `config/`: Stores configuration files.
- `lib/`: Holds utility functions and libraries.
- `public/`: Contains static assets such as images and favicon.
- `styles/`: Includes global and component-specific CSS styles.
- `types/`: Defines TypeScript types used in the application.

## Pages and Components

### App Directory

The `app/` directory contains the main application pages and layouts. Here are the key files:

- `layout.tsx`: Defines the overall layout of the application, including the main navigation and site header.
- `page.tsx`: Represents the home page of the application, where users can input their discussion prompts and generate AI responses.

### Components

The `components/` directory contains reusable components used throughout the application. Some notable components include:

- `discussion-response.tsx`: Displays the generated AI discussion response to the user.
- `main-nav.tsx`: Represents the main navigation of the application, allowing users to navigate between different pages.
- `site-header.tsx`: Renders the header section of the application, typically including the logo and site title.
- `theme-toggle.tsx`: Allows users to switch between light and dark themes.
- `ui/`: Contains UI-specific components such as buttons, inputs, labels, and textareas. These components are built using Radix UI primitives and can be easily customized and reused.

## API Routes

### Chat Route

The `app/api/chat/route.ts` file defines the API route for handling chat-related requests. It is responsible for processing incoming requests, generating AI-powered discussion responses, and sending the responses back to the client.

### Claude Sonnet Integration

The app now features a **multi-AI provider system** with both free and paid options:

**🤖 AI Providers (in priority order):**

1. **Groq** (free, fast) - Get key at: <https://groq.com/>
2. **Hugging Face** (free) - Get key at: <https://huggingface.co/settings/tokens>
3. **Anthropic Claude** (paid, high quality)
4. **OpenAI GPT** (paid, reliable)
5. **Mock AI** (demo mode, always available)

**Environment variables for AI:**

```bash
# FREE OPTIONS (choose any/all):
GROQ_API_KEY=your_free_groq_key_here
HUGGINGFACE_API_KEY=your_free_hf_key_here

# PAID OPTIONS (optional):
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-3.5-turbo                    # Optional model override
```

**🔐 Authentication Options:**

The app supports flexible authentication:

```bash
# OPTION 1: Google OAuth (full features)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OPTION 2: Guest access (development/demo)
ALLOW_GUEST_ACCESS=true                        # Enabled by default in dev
```

**Why Google OAuth was required before:**

- The original app used invitation-based access control
- Users needed invitations in the database to sign in
- This created a chicken-and-egg problem for first-time setup

**Now it's optional:**

- Guest access allows immediate testing
- Google OAuth provides full features when configured
- The app gracefully falls back to available options

Notes:

- File upload and Assistant-specific endpoints still use OpenAI (they rely on OpenAI Assistants + file_search features not available in Anthropic yet).
- All generic discussion / grading chat requests sent to `/api/chat` are now served by Claude Sonnet.
- To revert to OpenAI, replace the implementation in `app/api/chat/route.ts` with the previous OpenAI streaming logic and remove the Anthropic adaptor.

## Styling

The project uses Tailwind CSS for styling. The `styles/globals.css` file contains global styles and Tailwind CSS directives. It defines custom color classes, dark mode styles, and base styles for the application.

## Configuration

The project includes configuration files for various tools and libraries used:

- `postcss.config.js`: Contains the PostCSS configuration, including the Tailwind CSS and Autoprefixer plugins.
- `prettier.config.js`: Defines the Prettier configuration for code formatting.
- `tailwind.config.js`: Contains the Tailwind CSS configuration, including theme customization, content paths, and plugin settings.

## 📜 License

This project is licensed under the **Business Source License 1.1**.

- ✅ **Free for non-production use** (development, testing, learning)
- 💼 **Commercial/production use requires a license** - Contact: licensing@profgenie.com
- 📅 **Converts to Apache 2.0** on January 16, 2030 (becomes fully open source)
- 👥 **Limited to 3 concurrent users** without commercial license

See the [LICENSE](LICENSE) file for complete terms.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support & Contact

- **Repository**: [https://github.com/sanazindustrial/PROFGINE](https://github.com/sanazindustrial/PROFGINE)
- **Commercial Licensing**: licensing@profgenie.com
- **Technical Support**: support@profgenie.com
- **Documentation**: See `/docs` and individual `.md` files in the root directory

## 🎯 Roadmap

- [x] Multi-AI provider system with automatic fallback
- [x] Role-based access control (ADMIN/PROFESSOR/STUDENT)
- [x] Subscription management with trial periods
- [x] Chrome extension for LMS integration
- [x] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Additional LMS integrations (Moodle, D2L)
- [ ] Advanced analytics dashboard
- [ ] Real-time collaboration features

## ⚠️ Important Notes

- **Production Deployment**: See [PRODUCTION_SETUP_CHECKLIST.md](PRODUCTION_SETUP_CHECKLIST.md)
- **Google OAuth Setup**: See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)
- **Stripe Integration**: See [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)
- **Security**: Never commit `.env` files or API keys to version control
- **Database**: Neon PostgreSQL requires both pooled and direct connection URLs

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database with [Prisma](https://www.prisma.io/)
- Authentication via [NextAuth.js](https://next-auth.js.org/)

---

**Made with ❤️ for educators worldwide**
