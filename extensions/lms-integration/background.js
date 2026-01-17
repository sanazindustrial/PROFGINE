// Professor GENIE Background Service Worker
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Professor GENIE extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Set default allowed domains on first install
    chrome.storage.sync.set({
      allowedDomains: [
        // Common LMS domains as examples
        'instructure.com',
        'blackboard.com',
        'brightspace.com',
        'd2l.com',
        'moodle.org'
      ]
    });

    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.type === 'GET_AUTH_TOKEN') {
    // Get stored authentication token
    chrome.storage.sync.get(['authToken'], (result) => {
      sendResponse({
        token: result.authToken
      });
    });
    return true; // Will respond asynchronously
  }

  if (request.type === 'SAVE_AUTH_TOKEN') {
    // Save authentication token
    chrome.storage.sync.set({
      authToken: request.token
    }, () => {
      sendResponse({
        success: true
      });
    });
    return true;
  }

  if (request.type === 'API_REQUEST') {
    // Proxy API requests to Professor GENIE backend
    handleAPIRequest(request.data, sendResponse);
    return true;
  }

  if (request.type === 'CHECK_DOMAIN_ALLOWED') {
    // Check if domain is in allowlist
    checkDomainAllowed(request.domain, sendResponse);
    return true;
  }

  if (request.type === 'LOG_USAGE') {
    // Log usage for analytics (optional)
    console.log('Usage logged:', request.data);
    sendResponse({
      success: true
    });
  }
});

async function handleAPIRequest(requestData, sendResponse) {
  try {
    const {
      token
    } = await chrome.storage.sync.get(['authToken']);

    if (!token) {
      sendResponse({
        error: 'Not authenticated. Please visit profgenie.ai to log in.'
      });
      return;
    }

    const response = await fetch(`https://api.profgenie.ai/${requestData.endpoint}`, {
      method: requestData.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify(requestData.body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    sendResponse({
      data
    });

  } catch (error) {
    console.error('API request failed:', error);
    sendResponse({
      error: error.message || 'Network error. Please check your connection.'
    });
  }
}

async function checkDomainAllowed(domain, sendResponse) {
  try {
    const {
      allowedDomains
    } = await chrome.storage.sync.get(['allowedDomains']);
    const domains = allowedDomains || [];

    // Check if the domain or any parent domain is allowed
    const isAllowed = domains.some(allowed => {
      return domain === allowed || domain.endsWith('.' + allowed);
    });

    sendResponse({
      allowed: isAllowed
    });
  } catch (error) {
    console.error('Error checking domain:', error);
    sendResponse({
      allowed: false
    });
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open Professor GENIE dashboard
  chrome.tabs.create({
    url: 'https://profgenie.ai/dashboard'
  });
});

// Context menu for quick access
chrome.contextMenus.create({
  id: 'profgenie-extract',
  title: 'Extract with Professor GENIE',
  contexts: ['selection']
}, () => {
  // Handle any errors silently
  if (chrome.runtime.lastError) {
    console.log('Context menu already exists');
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'profgenie-extract') {
    // Send message to content script to extract selected text
    chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT_SELECTION',
      selectedText: info.selectionText
    });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('Professor GENIE service worker started');
});

// Handle alarm events for periodic tasks
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refresh-token') {
    // Refresh auth token if needed
    refreshAuthToken();
  }
});

// Set up periodic token refresh (every 23 hours)
chrome.alarms.create('refresh-token', {
  delayInMinutes: 23 * 60,
  periodInMinutes: 23 * 60
});

async function refreshAuthToken() {
  try {
    const {
      authToken
    } = await chrome.storage.sync.get(['authToken']);

    if (!authToken) return;

    const response = await fetch('https://api.profgenie.ai/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        await chrome.storage.sync.set({
          authToken: data.token
        });
        console.log('Auth token refreshed successfully');
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
}
