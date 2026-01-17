# Contributing to Professor GENIE Platform

Thank you for your interest in contributing to Professor GENIE! We welcome contributions from the community and are excited to collaborate with you.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [License Implications](#license-implications)

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and harassment-free environment for everyone. We are committed to providing a welcoming experience for contributors of all backgrounds.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18.0+** (20.x recommended)
- **pnpm** package manager
- **PostgreSQL** database (local or Neon)
- **Git** for version control
- Basic knowledge of Next.js, TypeScript, and React

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/PROFGINE.git
   cd PROFGINE
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/sanazindustrial/PROFGINE.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Configure your local environment variables
   ```

6. **Run database migrations**:
   ```bash
   pnpm run prisma:generate
   pnpm run migration:postgres:local
   ```

7. **Start the development server**:
   ```bash
   pnpm dev
   ```

## 🔄 Development Workflow

### Creating a New Feature or Fix

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes** following our coding standards

4. **Test your changes**:
   ```bash
   pnpm build
   pnpm test  # if tests are available
   ```

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add student dashboard with course overview
fix: resolve authentication redirect loop
docs: update installation instructions in README
refactor: simplify AI provider fallback logic
```

## 💻 Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow the existing code style (Prettier configured)
- Use **async/await** instead of promises when possible
- Prefer **functional components** and React hooks
- Use proper types, avoid `any` when possible

### File Organization

- Place React components in `/components`
- API routes go in `/app/api`
- Utility functions in `/lib`
- Type definitions in `/types`
- Follow the Next.js 15 App Router structure

### Code Quality

- Write **self-documenting code** with clear variable/function names
- Add comments for complex logic
- Keep functions small and focused (single responsibility)
- Avoid nested callbacks (use async/await)
- Handle errors gracefully with try-catch blocks

### Styling

- Use **Tailwind CSS** for styling
- Follow existing component patterns
- Ensure responsive design (mobile-first)
- Support dark mode where applicable
- Use Radix UI primitives for accessible components

## 🔍 Pull Request Process

1. **Ensure your code builds**:
   ```bash
   pnpm build
   ```

2. **Update documentation** if needed

3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues (#123)
   - Describe what changes were made and why
   - Include screenshots for UI changes
   - List any breaking changes

5. **Code Review**:
   - Respond to feedback promptly
   - Make requested changes in new commits
   - Update your PR branch if conflicts arise

6. **Approval & Merge**:
   - PRs require at least one approval
   - Maintainers will merge once approved
   - Your PR branch will be deleted after merge

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Screenshots (if applicable)
[Add screenshots here]

## Testing
- [ ] I have tested this locally
- [ ] I have updated relevant documentation
- [ ] My code follows the project's coding standards

## Additional Notes
Any other information
```

## 🐛 Reporting Issues

### Before Submitting an Issue

1. **Check existing issues** to avoid duplicates
2. **Update to the latest version** to see if the issue persists
3. **Gather information** about your environment

### Creating a Good Issue

Include:
- **Clear title** describing the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs. actual behavior
- **Environment details** (OS, Node version, browser)
- **Screenshots or error logs** if applicable
- **Possible solutions** if you have ideas

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `question`: Further information requested

## 📜 License Implications

### Business Source License 1.1

This project uses the **Business Source License 1.1**:

- Your contributions will be licensed under the same BSL 1.1 terms
- The code will convert to **Apache 2.0** on January 16, 2030
- Non-production use is free; production use requires a commercial license

### Contributor License Agreement (CLA)

By contributing, you agree that:

1. You have the right to submit the contribution
2. Your contribution can be distributed under the BSL 1.1 license
3. You grant the project maintainers the right to use your contribution
4. Your contribution does not violate any third-party rights

### Copyright Notice

Add this to new files you create:

```typescript
/**
 * Copyright (c) 2026 Professor GENIE Platform
 * Licensed under the Business Source License 1.1
 */
```

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

### High Priority

- 🐛 **Bug fixes** in existing features
- 📝 **Documentation improvements** and examples
- ♿ **Accessibility enhancements** (WCAG 2.1 AA compliance)
- 🧪 **Test coverage** (unit tests, integration tests)
- 🌐 **Internationalization** (i18n support)

### Feature Development

- 📱 **Mobile app** (React Native)
- 🔌 **LMS integrations** (Moodle, D2L, Schoology)
- 📊 **Analytics dashboard** enhancements
- 🤖 **AI provider** additions
- 🎨 **UI/UX** improvements

### Infrastructure

- ⚡ **Performance optimizations**
- 🔒 **Security enhancements**
- 📦 **Build process** improvements
- 🐳 **Docker** configuration
- ☁️ **Cloud deployment** guides

## 💬 Communication

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Email**: support@profgenie.com for technical support

### Community Guidelines

- Be patient and respectful
- Help others when you can
- Share knowledge and resources
- Celebrate successes together

## 🙏 Recognition

All contributors will be:
- Listed in our CONTRIBUTORS.md file
- Credited in release notes
- Given public recognition for significant contributions

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

**Thank you for contributing to Professor GENIE! Together, we're building a better educational platform for professors and students worldwide.** 🎓✨
