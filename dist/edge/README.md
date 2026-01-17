# ProfGini Extension Source Files

This directory contains the source files for the ProfGini browser extension that will be copied during the build process.

## Structure

- **background.js** - Service worker for Chrome/Edge/Safari, background script for Firefox
- **content-script.js** - Content script injected into LMS pages
- **content-script.css** - Styles for injected UI elements
- **popup.html** - Extension popup interface
- **popup.js** - Popup functionality
- **options.html** - Extension settings page
- **options.js** - Settings page functionality

## Build Process

The build script will:

1. Copy these source files to each store's build directory
2. Merge store-specific manifest configurations
3. Generate config.json with environment-specific settings
4. Create zip packages for store submission

## Development

For development, you can load the unpacked extension from any of the `dist/[store]` directories after running:

```bash
pnpm run build:ext
```

## LMS Integration

The content script automatically detects and integrates with:

- Canvas (Instructure)
- Blackboard
- Brightspace/D2L
- Google Classroom
- Moodle
- Schoology

## Security

- No secrets are embedded in the extension
- All API calls go through your backend
- Authentication tokens are stored securely
- HTTPS-only communication enforced
