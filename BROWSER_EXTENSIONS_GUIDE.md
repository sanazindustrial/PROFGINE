# Multi-Browser Extension Structure

## Browser-Specific Manifests

### Chrome/Edge (Manifest V3)

```json
{
  "manifest_version": 3,
  "name": "ProfGini LMS Assistant",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage", "identity"],
  "host_permissions": ["<all_urls>"],
  "action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content-script.js"]
  }]
}
```

### Firefox (Manifest V2)

```json
{
  "manifest_version": 2,
  "name": "ProfGini LMS Assistant",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage", "<all_urls>"],
  "browser_action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content-script.js"]
  }]
}
```

### Safari (Web Extensions)

```json
{
  "manifest_version": 2,
  "name": "ProfGini LMS Assistant",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage", "*://*/*"],
  "browser_action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": ["*://*/*"],
    "js": ["content-script.js"]
  }]
}
```

## Universal Content Script

```javascript
// Works across all browsers
(function() {
  'use strict';
  
  // Detect LMS platform
  const detectLMS = () => {
    if (window.location.hostname.includes('canvas')) return 'canvas';
    if (window.location.hostname.includes('blackboard')) return 'blackboard';
    if (window.location.hostname.includes('d2l')) return 'd2l';
    if (window.location.hostname.includes('classroom.google')) return 'google-classroom';
    return 'unknown';
  };
  
  // Extract discussion/assignment content
  const extractContent = (lmsType) => {
    const extractors = {
      canvas: () => extractCanvasContent(),
      blackboard: () => extractBlackboardContent(),
      'd2l': () => extractD2LContent(),
      'google-classroom': () => extractGoogleClassroomContent()
    };
    
    return extractors[lmsType] || (() => null);
  };
  
  // Send to ProfGini API
  const sendToProfGini = (content) => {
    fetch('https://your-app.vercel.app/api/extension', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, source: detectLMS() })
    });
  };
})();
```
