# Professor GENIE Documentation Index 📚

Welcome to the Professor GENIE Platform documentation! This index helps you find the information you need quickly.

## 🚀 Getting Started

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Main project overview, features, and quick start guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guidelines for contributing to the project |
| [LICENSE](LICENSE) | Business Source License 1.1 terms and conditions |
| [SECURITY.md](SECURITY.md) | Security verification and best practices |

## 🔧 Setup & Configuration

| Document | Description |
|----------|-------------|
| [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) | Step-by-step Google OAuth configuration |
| [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md) | Stripe payment integration setup |
| [PRODUCTION_SETUP_CHECKLIST.md](PRODUCTION_SETUP_CHECKLIST.md) | Pre-deployment verification checklist |
| [.env.example](.env.example) | Environment variables template |

## 🏗️ Architecture & Features

| Document | Description |
|----------|-------------|
| [SUBSCRIPTION_TECHNICAL_BREAKDOWN.md](SUBSCRIPTION_TECHNICAL_BREAKDOWN.md) | Subscription system architecture |
| [MULTI_TENANT_IMPLEMENTATION.md](MULTI_TENANT_IMPLEMENTATION.md) | Multi-tenant organization features |
| [ADMIN_CONFIG_SYSTEM.md](ADMIN_CONFIG_SYSTEM.md) | Admin configuration management |
| [ENHANCED_GRADING_IMPLEMENTATION.md](ENHANCED_GRADING_IMPLEMENTATION.md) | AI-powered grading system |
| [VIDEO_RESOURCES_FEATURE.md](VIDEO_RESOURCES_FEATURE.md) | Video resource management |

## 🧩 Browser Extensions

| Document | Description |
|----------|-------------|
| [EXTENSION_BUILD_COMPLETE.md](EXTENSION_BUILD_COMPLETE.md) | Extension build documentation |
| [EXTENSION_DEPLOYMENT.md](EXTENSION_DEPLOYMENT.md) | Extension deployment guide |
| [EXTENSION_TESTING_SUITE.md](EXTENSION_TESTING_SUITE.md) | Extension testing procedures |
| [PROFGINI_EXTENSION_USER_GUIDE.md](PROFGINI_EXTENSION_USER_GUIDE.md) | User guide for browser extension |
| [BROWSER_EXTENSIONS_GUIDE.md](BROWSER_EXTENSIONS_GUIDE.md) | Multi-browser extension support |
| [extensions/README.md](extensions/README.md) | Extension source code documentation |

## 🎨 User Experience

| Document | Description |
|----------|-------------|
| [UI_UX_IMPROVEMENTS.md](UI_UX_IMPROVEMENTS.md) | UI/UX enhancement documentation |
| [PRICING_STRATEGY.md](PRICING_STRATEGY.md) | Pricing tiers and strategy |

## 🔒 Security & Compliance

| Document | Description |
|----------|-------------|
| [SECURITY.md](SECURITY.md) | Security checklist and verification |
| [PRIVACY_COMPLIANCE_SUMMARY.md](PRIVACY_COMPLIANCE_SUMMARY.md) | Privacy compliance overview |
| [USA_EDUCATION_SYSTEM_COMPLIANCE.md](USA_EDUCATION_SYSTEM_COMPLIANCE.md) | US education compliance |
| [USA_EDUCATION_NON_CONFLICT_VERIFICATION.md](USA_EDUCATION_NON_CONFLICT_VERIFICATION.md) | Non-conflict verification |

## 🚢 Deployment & Testing

| Document | Description |
|----------|-------------|
| [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) | Current deployment status |
| [PRE-DEPLOY-VERIFICATION-RESULTS.md](PRE-DEPLOY-VERIFICATION-RESULTS.md) | Pre-deployment test results |
| [DATABASE_CONNECTIVITY_TEST_RESULTS.md](DATABASE_CONNECTIVITY_TEST_RESULTS.md) | Database connectivity tests |

## 🛠️ Development Resources

### Scripts

Located in the root directory:

- `setup-admin.js` - Create admin user
- `check-env.js` - Verify environment configuration
- `test-db.js` - Test database connectivity
- `verify-admin.js` - Verify admin user setup

### Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `prisma/schema.prisma` - Database schema

## 📖 Quick Reference

### Essential Commands

```bash
# Installation
pnpm install

# Development
pnpm dev

# Database
pnpm run prisma:generate
pnpm run migration:postgres:local

# Build
pnpm build

# Production
pnpm start
```

### Key Directories

```
/app              - Next.js App Router pages & API routes
/components       - React components
/lib              - Utility functions and libraries
/prisma           - Database schema and migrations
/public           - Static assets
/types            - TypeScript type definitions
/adaptors         - AI provider adaptors
/extensions       - Browser extension source code
```

## 🔍 Finding Information

### By Topic

- **Authentication**: GOOGLE_OAUTH_SETUP.md, auth configuration in `/app/api/auth`
- **Payments**: STRIPE_SETUP_GUIDE.md, subscription system
- **AI Integration**: adaptors/ directory, /app/api/chat
- **Database**: prisma/schema.prisma, migration files
- **Extensions**: extensions/ directory, EXTENSION_*.md files
- **Security**: SECURITY.md, PRIVACY_COMPLIANCE_SUMMARY.md
- **Deployment**: PRODUCTION_SETUP_CHECKLIST.md, DEPLOYMENT_STATUS.md

### By User Role

**New Contributors**:
1. Start with [README.md](README.md)
2. Read [CONTRIBUTING.md](CONTRIBUTING.md)
3. Review [LICENSE](LICENSE)
4. Check [SECURITY.md](SECURITY.md)

**Developers**:
1. [README.md](README.md) - Setup instructions
2. [.env.example](.env.example) - Environment variables
3. Architecture docs (SUBSCRIPTION_TECHNICAL_BREAKDOWN.md, etc.)
4. Component documentation in `/components`

**Administrators**:
1. [PRODUCTION_SETUP_CHECKLIST.md](PRODUCTION_SETUP_CHECKLIST.md)
2. [ADMIN_CONFIG_SYSTEM.md](ADMIN_CONFIG_SYSTEM.md)
3. Admin scripts in root directory

**End Users**:
1. [PROFGINI_EXTENSION_USER_GUIDE.md](PROFGINI_EXTENSION_USER_GUIDE.md)
2. [PRICING_STRATEGY.md](PRICING_STRATEGY.md)
3. In-app help and tutorials

## 📞 Support

- **Repository**: https://github.com/sanazindustrial/PROFGINE
- **Technical Support**: support@profgenie.com
- **Commercial Licensing**: licensing@profgenie.com
- **Issues**: [GitHub Issues](https://github.com/sanazindustrial/PROFGINE/issues)

## 🔄 Document Updates

This documentation index is maintained as part of the main repository. If you add new documentation:

1. Add it to the appropriate section above
2. Update the table of contents
3. Submit a pull request with the changes

---

**Last Updated**: January 16, 2026  
**Version**: 1.0  
**Maintained By**: Professor GENIE Platform Team
