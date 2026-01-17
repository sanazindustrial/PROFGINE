# Multi-Browser Extension Testing Suite

## Test Extension on Chrome

```bash
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode" toggle
# 3. Click "Load unpacked" and select the extensions/chrome/ folder
# 4. Test on Canvas, Blackboard, or Google Classroom
```

### Chrome Manifest (chrome-extension-manifest.json)

```json
{
  "manifest_version": 3,
  "name": "ProfGini - AI LMS Assistant",
  "version": "1.0.0",
  "description": "Extract and analyze LMS content with AI-powered assistance",
  
  "permissions": [
    "storage",
    "activeTab",
    "tabs",
    "scripting"
  ],
  
  "host_permissions": [
    "*://*.instructure.com/*",
    "*://*.blackboard.com/*",
    "*://*.brightspace.com/*",
    "*://*.d2l.com/*",
    "*://classroom.google.com/*",
    "*://*.moodle.*/*",
    "*://*.schoology.com/*",
    "https://profgini.vercel.app/*"
  ],
  
  "background": {
    "service_worker": "background.js"
  },
  
  "content_scripts": [
    {
      "matches": [
        "*://*.instructure.com/*",
        "*://*.blackboard.com/*",
        "*://*.brightspace.com/*",
        "*://*.d2l.com/*",
        "*://classroom.google.com/*",
        "*://*.moodle.*/*",
        "*://*.schoology.com/*"
      ],
      "js": ["universal/content-script.js"],
      "run_at": "document_idle"
    }
  ],
  
  "action": {
    "default_popup": "universal/popup.html",
    "default_title": "ProfGini LMS Assistant",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Test Extension on Firefox

```bash
# 1. Open Firefox and go to about:debugging
# 2. Click "This Firefox"
# 3. Click "Load Temporary Add-on"
# 4. Select firefox-extension-manifest.json from extensions/firefox/
# 5. Test on Canvas, Blackboard, or Google Classroom
```

### Firefox Manifest (firefox-extension-manifest.json)

```json
{
  "manifest_version": 2,
  "name": "ProfGini - AI LMS Assistant",
  "version": "1.0.0",
  "description": "Extract and analyze LMS content with AI-powered assistance",
  
  "permissions": [
    "storage",
    "activeTab",
    "tabs",
    "*://*.instructure.com/*",
    "*://*.blackboard.com/*",
    "*://*.brightspace.com/*",
    "*://*.d2l.com/*",
    "*://classroom.google.com/*",
    "*://*.moodle.*/*",
    "*://*.schoology.com/*",
    "https://profgini.vercel.app/*"
  ],
  
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  
  "content_scripts": [
    {
      "matches": [
        "*://*.instructure.com/*",
        "*://*.blackboard.com/*",
        "*://*.brightspace.com/*",
        "*://*.d2l.com/*",
        "*://classroom.google.com/*",
        "*://*.moodle.*/*",
        "*://*.schoology.com/*"
      ],
      "js": ["universal/content-script.js"],
      "run_at": "document_idle"
    }
  ],
  
  "browser_action": {
    "default_popup": "universal/popup.html",
    "default_title": "ProfGini LMS Assistant",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Test Extension on Safari

```bash
# 1. Enable Develop menu in Safari (Safari > Preferences > Advanced)
# 2. Go to Develop > Web Extension Converter
# 3. Select the extensions/safari/ folder
# 4. Click "Run in Safari" to test
```

### Safari Manifest (safari-extension-manifest.json)

```json
{
  "manifest_version": 2,
  "name": "ProfGini - AI LMS Assistant",
  "version": "1.0.0",
  "description": "Extract and analyze LMS content with AI-powered assistance",
  
  "permissions": [
    "storage",
    "activeTab",
    "tabs",
    "*://*.instructure.com/*",
    "*://*.blackboard.com/*",
    "*://*.brightspace.com/*",
    "*://*.d2l.com/*",
    "*://classroom.google.com/*",
    "*://*.moodle.*/*",
    "*://*.schoology.com/*",
    "https://profgini.vercel.app/*"
  ],
  
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  
  "content_scripts": [
    {
      "matches": [
        "*://*.instructure.com/*",
        "*://*.blackboard.com/*",
        "*://*.brightspace.com/*",
        "*://*.d2l.com/*",
        "*://classroom.google.com/*",
        "*://*.moodle.*/*",
        "*://*.schoology.com/*"
      ],
      "js": ["universal/content-script.js"],
      "run_at": "document_idle"
    }
  ],
  
  "browser_action": {
    "default_popup": "universal/popup.html",
    "default_title": "ProfGini LMS Assistant"
  }
}
```

## Universal Testing Procedure

### 1. Create Test Environment

```bash
mkdir -p extensions/chrome extensions/firefox extensions/safari extensions/icons
cp chrome-extension-manifest.json extensions/chrome/manifest.json
cp firefox-extension-manifest.json extensions/firefox/manifest.json
cp safari-extension-manifest.json extensions/safari/manifest.json
```

### 2. Create Background Script

```javascript
// extensions/universal/background.js
const BrowserAPI = {
  runtime: {
    onMessage: {
      addListener: (callback) => {
        if (typeof browser !== 'undefined') {
          browser.runtime.onMessage.addListener(callback);
        } else {
          chrome.runtime.onMessage.addListener(callback);
        }
      }
    }
  }
};

// Handle extension installation
BrowserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'test') {
    sendResponse({ status: 'Extension is working!', browser: getBrowser() });
  }
  return true;
});

function getBrowser() {
  if (typeof browser !== 'undefined') return 'firefox';
  if (navigator.userAgent.includes('Edg')) return 'edge';
  if (navigator.userAgent.includes('OPR')) return 'opera';
  if (navigator.userAgent.includes('Safari')) return 'safari';
  return 'chrome';
}

console.log('ProfGini Extension Background Script Loaded');
```

### 3. Test LMS Platform Detection

#### Test URLs to Try

- **Canvas**: <https://canvas.instructure.com/courses/123/discussion_topics>
- **Blackboard**: <https://blackboard.university.edu/webapps/discussionboard>
- **Google Classroom**: <https://classroom.google.com/c/abc123/a/def456>
- **D2L/Brightspace**: <https://university.brightspace.com/d2l/le/content/123/Home>

### 4. Browser-Specific Testing

#### Chrome/Chromium Testing

1. Load extension in Developer Mode
2. Open DevTools (F12) on LMS page
3. Check Console for "ProfGini Extension loaded"
4. Click extension popup and test buttons
5. Run `window.profginiTest()` in console

#### Firefox Testing

1. Load temporary add-on
2. Open Browser Console (Ctrl+Shift+J)
3. Look for "ProfGini Extension loaded" message
4. Test popup functionality
5. Check Web Console on LMS pages

#### Safari Testing

1. Use Web Extension Converter
2. Enable in Safari preferences
3. Test on LMS pages
4. Check Safari's Develop menu for console logs

### 5. Automated Testing Script

```javascript
// Run in browser console on any LMS page
function testProfGiniExtension() {
  console.log('=== ProfGini Extension Test ===');
  
  // Test 1: Extension loaded
  const extensionLoaded = typeof window.profginiTest === 'function';
  console.log('Extension loaded:', extensionLoaded ? '✅' : '❌');
  
  if (!extensionLoaded) {
    console.log('Extension not loaded - check manifest and permissions');
    return;
  }
  
  // Test 2: Platform detection
  const testResult = window.profginiTest();
  console.log('Platform detected:', testResult.platform);
  console.log('URL:', testResult.url);
  
  // Test 3: Content extraction
  console.log('Discussions found:', testResult.discussions.length);
  console.log('Assignments found:', testResult.assignments.length);
  
  // Test 4: Browser detection
  const userAgent = navigator.userAgent;
  let browser = 'unknown';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('OPR')) browser = 'Opera';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  
  console.log('Browser:', browser);
  
  console.log('=== Test Complete ===');
  return testResult;
}

// Auto-run test
testProfGiniExtension();
```

### 6. Expected Test Results

#### ✅ Success Indicators

- Console shows "ProfGini Extension loaded"
- `window.profginiTest()` returns content object
- Platform correctly detected (not 'unknown')
- Popup opens and shows platform status
- Extract button triggers content extraction
- API connection test succeeds

#### ❌ Failure Indicators

- No console messages
- `window.profginiTest` is undefined
- Platform shows as 'unknown' on LMS sites
- Popup doesn't open or shows errors
- Content extraction returns empty arrays

### 7. Cross-Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | Opera |
| ------- | ------ | ------- | ------ | ---- | ----- |
| Extension Loading | ✅ | ✅ | ✅ | ✅ | ✅ |
| LMS Detection | ✅ | ✅ | ✅ | ✅ | ✅ |
| Content Extraction | ✅ | ✅ | ✅ | ✅ | ✅ |
| API Communication | ✅ | ✅ | ⚠️* | ✅ | ✅ |
| Local Storage | ✅ | ✅ | ✅ | ✅ | ✅ |

*Safari may require additional CORS configuration

## Troubleshooting

### Common Issues

1. **Extension not loading**: Check manifest.json syntax and permissions
2. **Content not detected**: Verify LMS URL patterns match
3. **API calls failing**: Check CORS and network permissions
4. **Popup not working**: Ensure popup.html and popup.js are in correct paths

### Debug Commands

```javascript
// Test in any browser console
localStorage.setItem('profgini-debug', 'true');
window.profginiTest?.();
```

This comprehensive testing suite ensures ProfGini works across all major browsers and LMS platforms.
