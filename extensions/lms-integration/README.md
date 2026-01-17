# Professor GENIE LMS Integration Extension

A comprehensive Chrome extension that integrates Professor GENIE's AI-powered grading and feedback system with all major Learning Management Systems (LMS).

## Features

### Universal LMS Support

- **Canvas** - Full SpeedGrader and discussion integration
- **Moodle** - Assignment and forum support
- **D2L Brightspace** - Assignment submission and discussion grading
- **Blackboard** - Assignment and discussion board integration
- **Schoology** - Assignment and discussion support
- **Google Classroom** - Assignment and comment integration
- **Generic Fallback** - Manual selection for unsupported platforms

### AI-Powered Features

- Automated feedback generation
- Intelligent grading with rubric support
- File processing (PDF, Word documents)
- Context-aware responses
- Bulk grading capabilities

### Security & Privacy

- No sensitive data stored in extension
- Token-based authentication
- Secure API communication
- Privacy-compliant data handling

## Installation

### From Chrome Web Store (Recommended)

1. Visit the Chrome Web Store
2. Search for "ProfGini LMS Integration"
3. Click "Add to Chrome"
4. Follow the installation prompts

### Development Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extensions/lms-integration` folder

## Setup

1. **Install the Extension**
   - Add from Chrome Web Store or load unpacked for development

2. **Login to ProfGini**
   - Click the extension icon in your toolbar
   - Click "Login to ProfGini"
   - Complete authentication in the popup window

3. **Configure Settings**
   - Choose your AI provider (Auto recommended)
   - Enable file processing if needed
   - Save settings

4. **Start Using**
   - Navigate to any supported LMS
   - The extension will automatically detect the platform
   - Click assignments or discussions to grade
   - Use the ProfGini overlay to generate feedback

## Usage

### Grading Assignments

1. Navigate to an assignment submission in your LMS
2. The extension automatically detects the context
3. Click the ProfGini button or use the overlay
4. Review and customize the generated feedback
5. Apply feedback and grade with one click

### Discussion Responses

1. Open a discussion thread in your LMS
2. Select a student post to respond to
3. Use ProfGini to generate a thoughtful response
4. Edit and post the response

### File Processing

1. For PDF or Word submissions, the extension automatically extracts text
2. AI analyzes the content along with the assignment prompt
3. Comprehensive feedback is generated based on the file content

## Supported File Types

- PDF documents
- Microsoft Word (.doc, .docx)
- Plain text files
- RTF documents

## Architecture

### Extension Structure

```
extensions/lms-integration/
├── manifest.json          # Extension manifest (MV3)
├── content.js            # Main content script
├── background.js         # Service worker
├── popup.html/js         # Extension popup
├── overlay.css           # UI styling
├── src/
│   └── types.ts          # TypeScript definitions
├── adapters/             # LMS-specific adapters
│   ├── canvas.js
│   ├── moodle.js
│   ├── d2l.js
│   ├── blackboard.js
│   ├── schoology.js
│   └── generic.js
└── icons/                # Extension icons
```

### Adapter Pattern

Each LMS has a dedicated adapter that handles:

- Platform detection
- Content extraction
- Feedback application
- Grade submission
- DOM manipulation

### Generic Fallback

For unsupported platforms, the generic adapter provides:

- Manual element selection
- Interactive highlighting
- Universal content extraction
- Flexible feedback application

## API Integration

### Backend Endpoints

- `POST /api/extension/generate-feedback` - Generate AI feedback
- `POST /api/extension/process-file` - Process uploaded files
- `GET /api/extension/auth/extension` - Authentication flow
- `GET /api/extension/version` - Version checking

### Authentication

- Token-based authentication
- Secure token storage
- Automatic token refresh
- Logout capability

## Development

### Prerequisites

- Chrome/Chromium browser
- Web server for testing API endpoints
- Access to LMS platforms for testing

### Testing

1. Load the extension in development mode
2. Navigate to different LMS platforms
3. Test content extraction and feedback application
4. Verify file processing capabilities
5. Test authentication flow

### Building for Production

1. Update version in `manifest.json`
2. Create production build
3. Generate extension icons
4. Package for Chrome Web Store
5. Submit for review

## Troubleshooting

### Extension Not Working

- Check if you're on a supported LMS
- Verify authentication status
- Check browser console for errors
- Try refreshing the page

### Authentication Issues

- Clear extension data and re-authenticate
- Check popup blocker settings
- Verify ProfGini account status

### Content Not Detected

- Use the generic adapter with manual selection
- Report the issue for future support
- Check if page has loaded completely

## Privacy & Security

### Data Handling

- No student data stored locally
- Secure HTTPS communication
- Token-based authentication
- Minimal permission requests

### Permissions

- `activeTab` - Access current tab for LMS detection
- `storage` - Store configuration and auth tokens
- `scripting` - Inject content scripts
- Host permissions for supported LMS platforms

## Support

- **Documentation**: <https://profgini.com/help/lms-extension>
- **Support**: <https://profgini.com/support>
- **Report Issues**: <https://profgini.com/support/report-issue>
- **Feature Requests**: <https://profgini.com/feedback>

## License

© 2024 ProfGini. All rights reserved.

This extension is proprietary software. Unauthorized copying, distribution, or modification is prohibited.

## Changelog

### Version 1.0.0

- Initial release
- Universal LMS support
- AI-powered feedback generation
- File processing capabilities
- Secure authentication
- Chrome Web Store compliance
