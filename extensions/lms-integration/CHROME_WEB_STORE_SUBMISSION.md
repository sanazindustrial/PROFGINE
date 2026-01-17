# Professor GENIE Chrome Extension - Web Store Submission Guide

## Pre-Submission Checklist

### 1. Extension Files Status ✅

- [x] **manifest.json** - Chrome MV3 compliant with Professor GENIE branding
- [x] **Service Worker** (background.js) - API integration with profgenie.ai
- [x] **Content Scripts** - Universal LMS compatibility
- [x] **Options Page** - Domain security configuration
- [x] **Popup Interface** - Extension management UI
- [x] **LMS Adapters** - Canvas, Moodle, D2L, Blackboard, Generic support

### 2. Required Assets for Chrome Web Store

#### Icons (Create using ICON_SPECIFICATIONS.md)

- [ ] **icon16.png** (16x16px) - Extension toolbar icon
- [ ] **icon48.png** (48x48px) - Extensions page icon  
- [ ] **icon128.png** (128x128px) - Web Store listing icon

#### Screenshots (1280x800px each)

- [ ] **screenshot1.png** - Extension working on Canvas LMS
- [ ] **screenshot2.png** - Options page showing domain configuration
- [ ] **screenshot3.png** (optional) - Extension working on different LMS

#### Promotional Assets

- [ ] **promotional-tile.png** (440x280px) - Featured placement tile
- [ ] **store-banner.png** (1400x560px) - Optional promotional banner

### 3. Store Listing Information

#### Basic Information

```
Extension Name: Professor GENIE - AI-Powered Grading Assistant
Short Description: Intelligent grading and feedback for all major LMS platforms
Category: Education
Language: English (United States)
Visibility: Public
```

#### Detailed Description

```
Transform your teaching workflow with Professor GENIE, the AI-powered grading assistant that integrates seamlessly with all major Learning Management Systems.

🎓 UNIVERSAL LMS COMPATIBILITY
• Canvas SpeedGrader integration
• Moodle assignment grading
• D2L Brightspace support
• Blackboard assignment tools
• Generic fallback for any LMS platform

🤖 AI-POWERED FEATURES
• Intelligent feedback generation
• Consistent grading standards
• Rubric-based assessment
• Bulk grading capabilities
• Personalized student responses

🔒 SECURITY & PRIVACY
• Domain-based access control
• Secure API integration with profgenie.ai
• No student data stored locally
• FERPA-compliant design
• Institution-approved security model

⚡ WORKFLOW OPTIMIZATION
• Extract: Automatically detect assignments and discussions
• Generate: AI-powered feedback and grading suggestions
• Apply: Review and customize responses
• Submit: One-click grade submission

🌐 SUPPORTED PLATFORMS
Canvas, Moodle, D2L Brightspace, Blackboard Ultra, Schoology, Google Classroom, and any custom LMS through our intelligent generic adapter.

Visit profgenie.ai to learn more about Professor GENIE's comprehensive teaching tools.
```

#### Keywords (Comma-separated)

```
education, grading, LMS, Canvas, Moodle, teaching assistant, AI grading, feedback, professor tools, academic, assessment, D2L, Blackboard, student evaluation
```

### 4. Technical Information

#### Permissions Justification

```
Storage: Store user preferences and authentication tokens securely
Active Tab: Access current LMS page to provide grading interface
Scripting: Inject Professor GENIE overlay into supported LMS platforms
Host Permissions: Secure API communication with profgenie.ai services
```

#### Privacy Policy Requirements

- **Privacy Policy URL**: <https://profgenie.ai/privacy>
- **Terms of Service URL**: <https://profgenie.ai/terms>
- **Support URL**: <https://profgenie.ai/support>
- **Homepage URL**: <https://profgenie.ai>

### 5. Content Guidelines Compliance

#### Educational Value ✅

- Enhances teaching effectiveness
- Improves grading consistency
- Saves educator time
- Supports student learning outcomes

#### Security Standards ✅

- No unauthorized data collection
- Secure authentication protocols
- Domain-restricted access
- Professional institutional design

#### User Safety ✅

- Clear permission requests
- Transparent functionality
- Secure data handling
- Educational institution friendly

### 6. Testing Requirements

#### Browser Compatibility

- [ ] Chrome 88+ (Manifest V3 support)
- [ ] Edge Chromium 88+
- [ ] Test on multiple LMS platforms
- [ ] Verify all adapter functionality

#### Security Testing

- [ ] Domain allowlist enforcement
- [ ] API authentication flow
- [ ] Token refresh mechanisms
- [ ] Cross-site scripting protection

### 7. Submission Steps

1. **Developer Dashboard Setup**
   - Register Chrome Web Store developer account ($5 fee)
   - Verify publisher identity
   - Set up payment methods if applicable

2. **Upload Extension Package**
   - Zip all extension files (excluding .git, node_modules)
   - Upload to Chrome Web Store Developer Dashboard
   - Complete all required fields

3. **Asset Upload**
   - Upload all required icons
   - Add screenshots with descriptions
   - Include promotional assets

4. **Review & Publishing**
   - Complete store listing information
   - Submit for review (typically 1-3 business days)
   - Monitor review status and respond to any feedback

### 8. Post-Launch Checklist

- [ ] Monitor extension ratings and reviews
- [ ] Set up analytics tracking
- [ ] Prepare update deployment process
- [ ] Create user documentation
- [ ] Set up support channels

### 9. Marketing Assets

#### Launch Announcement Template

```
🎉 Professor GENIE Chrome Extension Now Available!

Transform your grading workflow with AI-powered assistance across all major LMS platforms.

✅ Universal LMS compatibility (Canvas, Moodle, D2L, Blackboard)
✅ Intelligent feedback generation  
✅ Secure, privacy-focused design
✅ One-click grade submission

Download now: [Chrome Web Store Link]
Learn more: https://profgenie.ai

#Education #Teaching #AI #LMS #Grading
```

#### Social Media Graphics Needed

- Twitter card (1200x630px)
- LinkedIn post graphic (1200x627px)
- Facebook share image (1200x630px)

## Contact Information

- **Developer**: Professor GENIE Team
- **Support Email**: <support@profgenie.ai>
- **Website**: <https://profgenie.ai>
- **Documentation**: <https://profgenie.ai/extension-docs>
