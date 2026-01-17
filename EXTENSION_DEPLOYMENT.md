# Browser Extension Deployment Guide

This guide covers deploying the ProfGini browser extension to all major browser stores.

## Prerequisites

1. **Environment Setup**:

   ```bash
   # Copy and configure environment
   cp .env.build.example .env.build
   # Edit .env.build with your actual values
   ```

2. **Build Extension**:

   ```bash
   pnpm run build:ext
   ```

3. **Generated Files**:
   - `dist/chrome/` - Chrome Web Store ready
   - `dist/firefox/` - Firefox AMO ready
   - `dist/edge/` - Edge Add-ons ready
   - `dist/opera/` - Opera Add-ons ready
   - `dist/safari/` - Safari Web Extensions ready
   - `*.zip` files for easy upload

## Store Submission

### Chrome Web Store

1. **Prerequisites**:
   - Google Developer account ($5 one-time fee)
   - Chrome Web Store Developer Dashboard access

2. **Submission Process**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Click "New Item"
   - Upload `dist/chrome.zip`
   - Fill out store listing details
   - Submit for review

3. **Review Time**: 1-7 days

### Firefox Add-ons (AMO)

1. **Prerequisites**:
   - Firefox Add-ons Developer Hub account
   - Add-on ID configured in manifest

2. **Submission Process**:
   - Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
   - Click "Submit a New Add-on"
   - Upload `dist/firefox.zip`
   - Choose distribution (AMO or self-hosting)
   - Complete listing information

3. **Review Time**: 1-14 days for AMO listing

### Microsoft Edge Add-ons

1. **Prerequisites**:
   - Microsoft Partner Center account
   - Edge Add-ons program enrollment

2. **Submission Process**:
   - Go to [Partner Center](https://partner.microsoft.com/dashboard/)
   - Navigate to Edge Add-ons
   - Click "Create new extension"
   - Upload `dist/edge.zip`
   - Complete store listing

3. **Review Time**: 1-7 days

### Opera Add-ons

1. **Prerequisites**:
   - Opera Developer account
   - Add-ons submission agreement

2. **Submission Process**:
   - Go to [Opera Add-ons Developer Portal](https://addons.opera.com/developer/)
   - Click "Upload new extension"
   - Upload `dist/opera.zip`
   - Complete extension details
   - Submit for review

3. **Review Time**: 3-14 days

### Safari Web Extensions

1. **Prerequisites**:
   - Mac with Xcode installed
   - Apple Developer account ($99/year)
   - Safari Web Extension app wrapper

2. **Submission Process**:
   - Create Safari Web Extension project in Xcode
   - Point to `dist/safari/` as extension content
   - Configure app metadata and signing
   - Submit to Mac App Store
   - Enable Safari Web Extensions capability

3. **Review Time**: 1-7 days for Mac App Store

## Configuration by Store

### API Endpoints

Ensure your backend supports extension requests with proper CORS headers:

```javascript
// Example CORS configuration
const allowedOrigins = [
  'chrome-extension://your-extension-id',
  'moz-extension://your-extension-id',
  'ms-browser-extension://your-extension-id',
  'safari-web-extension://your-extension-id'
];
```

### Host Permissions

Each manifest includes permissions for major LMS platforms:

- `*.instructure.com` (Canvas)
- `*.blackboard.com` (Blackboard)
- `*.brightspace.com`, `*.d2l.com` (D2L)
- `classroom.google.com` (Google Classroom)
- `*moodle*` (Moodle instances)
- `*.schoology.com` (Schoology)

### Content Security Policy

Extensions include secure CSP settings:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; frame-ancestors 'none';"
  }
}
```

## Store-Specific Requirements

### Chrome

- Manifest V3 required
- Service worker background script
- Detailed privacy policy required
- Screenshots and promotional images

### Firefox

- Supports both Manifest V2 and V3
- Background scripts (not service workers)
- Add-on signing required for distribution
- Detailed permission justifications

### Edge

- Manifest V3 preferred
- Similar to Chrome requirements
- Microsoft privacy policy compliance
- Store listing in multiple languages supported

### Opera

- Manifest V3 support
- Similar to Chrome/Edge
- Opera-specific testing recommended
- Developer verification required

### Safari

- Requires Mac App Store distribution
- App wrapper with Safari Web Extension
- Apple's strict review guidelines
- Code signing and notarization required

## Testing Before Submission

1. **Local Testing**:

   ```bash
   # Load unpacked extension in browser
   # Chrome: chrome://extensions/ (Developer mode)
   # Firefox: about:debugging (This Firefox > Load Temporary Add-on)
   # Edge: edge://extensions/ (Developer mode)
   ```

2. **LMS Integration Testing**:
   - Test on actual LMS platforms
   - Verify content script injection
   - Test authentication flow
   - Verify API connectivity

3. **Cross-Browser Testing**:
   - Test each browser's build
   - Verify manifest compatibility
   - Test store-specific features

## Post-Submission

1. **Monitor Reviews**:
   - Respond to store review feedback
   - Address rejection reasons promptly
   - Update documentation as needed

2. **Update Process**:
   - Increment version in manifests
   - Rebuild and resubmit
   - Chrome/Edge: automatic updates
   - Firefox: AMO handles updates
   - Safari: Mac App Store updates

3. **Analytics & Monitoring**:
   - Monitor extension usage
   - Track error rates
   - Collect user feedback
   - Plan feature updates

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   - Verify host permissions in manifest
   - Check CORS configuration on backend
   - Ensure HTTPS endpoints

2. **Manifest Validation**:
   - Use browser-specific validation tools
   - Check for required fields per store
   - Verify icon specifications

3. **Content Script Injection**:
   - Test on various LMS versions
   - Handle dynamic content loading
   - Verify script execution timing

### Store Rejection Reasons

1. **Privacy Policy**: Must clearly explain data usage
2. **Permissions**: Justify all requested permissions
3. **Functionality**: Extension must work as described
4. **Content**: No prohibited content or practices
5. **Metadata**: Complete and accurate store listings

## Maintenance

### Regular Updates

1. **Security Updates**: Address vulnerabilities promptly
2. **Browser Compatibility**: Test new browser versions
3. **LMS Changes**: Update for LMS platform changes
4. **Feature Enhancements**: Based on user feedback

### Version Management

- Use semantic versioning (e.g., 1.0.0)
- Maintain changelog
- Test backwards compatibility
- Coordinate updates across all stores

For questions or issues, refer to each store's developer documentation or contact support channels.
