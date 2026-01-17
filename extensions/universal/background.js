// Universal Background Script for All Browsers
(function () {
  'use strict';

  // Browser compatibility layer
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
      },
      sendMessage: (message) => {
        if (typeof browser !== 'undefined') {
          return browser.runtime.sendMessage(message);
        }
        return chrome.runtime.sendMessage(message);
      }
    },
    storage: {
      local: {
        get: (keys) => {
          if (typeof browser !== 'undefined') {
            return browser.storage.local.get(keys);
          }
          return chrome.storage.local.get(keys);
        },
        set: (data) => {
          if (typeof browser !== 'undefined') {
            return browser.storage.local.set(data);
          }
          return chrome.storage.local.set(data);
        }
      }
    },
    tabs: {
      query: (info) => {
        if (typeof browser !== 'undefined') {
          return browser.tabs.query(info);
        }
        return chrome.tabs.query(info);
      }
    }
  };

  // Detect browser type
  const getBrowser = () => {
    if (typeof browser !== 'undefined') return 'firefox';
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      if (navigator.userAgent.includes('Edg')) return 'edge';
      if (navigator.userAgent.includes('OPR')) return 'opera';
      return 'chrome';
    }
    return 'safari';
  };

  // Initialize extension
  const initialize = async () => {
    const browser = getBrowser();
    console.log(`ProfGini Extension Background Script Loaded - Browser: ${browser}`);

    // Set initial storage values
    try {
      const existing = await BrowserAPI.storage.local.get([
        'notifications',
        'autoExtract',
        'apiEndpoint'
      ]);

      const defaults = {
        notifications: existing.notifications !== undefined ? existing.notifications : true,
        autoExtract: existing.autoExtract || false,
        apiEndpoint: existing.apiEndpoint || 'https://api.profgenie.ai/api/extension',
        discussionsCount: 0,
        assignmentsCount: 0,
        browser: browser,
        installedAt: existing.installedAt || new Date().toISOString()
      };

      await BrowserAPI.storage.local.set(defaults);
      console.log('ProfGini: Extension initialized with defaults');

    } catch (error) {
      console.error('ProfGini: Failed to initialize storage:', error);
    }
  };

  // Handle messages from content scripts and popup
  BrowserAPI.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    try {
      switch (request.action) {
        case 'test':
          sendResponse({
            status: 'Extension is working!',
            browser: getBrowser(),
            timestamp: new Date().toISOString()
          });
          break;

        case 'getStatus':
          const status = await BrowserAPI.storage.local.get([
            'notifications',
            'autoExtract',
            'discussionsCount',
            'assignmentsCount',
            'browser'
          ]);
          sendResponse(status);
          break;

        case 'updateStats':
          await BrowserAPI.storage.local.set({
            discussionsCount: request.discussions || 0,
            assignmentsCount: request.assignments || 0,
            lastUpdate: new Date().toISOString()
          });
          sendResponse({
            success: true
          });
          break;

        case 'contentExtracted':
          // Handle successful content extraction
          const {
            platform, discussions, assignments, url
          } = request.data;

          // Update statistics
          const currentStats = await BrowserAPI.storage.local.get([
            'discussionsCount',
            'assignmentsCount'
          ]);

          const newStats = {
            discussionsCount: (currentStats.discussionsCount || 0) + discussions.length,
            assignmentsCount: (currentStats.assignmentsCount || 0) + assignments.length,
            lastExtraction: new Date().toISOString(),
            lastPlatform: platform,
            lastUrl: url
          };

          await BrowserAPI.storage.local.set(newStats);

          // Show notification if enabled
          const {
            notifications
          } = await BrowserAPI.storage.local.get(['notifications']);
          if (notifications) {
            console.log(`ProfGini: Extracted ${discussions.length} discussions and ${assignments.length} assignments from ${platform}`);
          }

          sendResponse({
            success: true,
            stats: newStats
          });
          break;

        case 'apiTest':
          try {
            const {
              apiEndpoint
            } = await BrowserAPI.storage.local.get(['apiEndpoint']);
            const endpoint = apiEndpoint || 'https://api.profgenie.ai/api/extension';

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                test: true,
                browser: getBrowser(),
                timestamp: Date.now()
              })
            });

            sendResponse({
              success: response.ok,
              status: response.status,
              endpoint: endpoint
            });
          } catch (error) {
            sendResponse({
              success: false,
              error: error.message
            });
          }
          break;

        default:
          sendResponse({
            error: 'Unknown action'
          });
      }
    } catch (error) {
      console.error('ProfGini Background Script Error:', error);
      sendResponse({
        error: error.message
      });
    }

    return true; // Keep message channel open for async response
  });

  // Periodic cleanup and maintenance
  const performMaintenance = async () => {
    try {
      const data = await BrowserAPI.storage.local.get(null);

      // Clean up old data if needed
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (data.lastExtraction && new Date(data.lastExtraction) < oneWeekAgo) {
        // Reset stats after a week of inactivity
        await BrowserAPI.storage.local.set({
          discussionsCount: 0,
          assignmentsCount: 0
        });
        console.log('ProfGini: Reset stats due to inactivity');
      }

    } catch (error) {
      console.error('ProfGini: Maintenance error:', error);
    }
  };

  // Run maintenance every hour
  const HOUR_IN_MS = 60 * 60 * 1000;
  setInterval(performMaintenance, HOUR_IN_MS);

  // Initialize when script loads
  initialize().catch(console.error);

  // Global functions for debugging
  if (typeof globalThis !== 'undefined') {
    globalThis.profginiBackgroundTest = async () => {
      const browser = getBrowser();
      const storage = await BrowserAPI.storage.local.get(null);

      return {
        browser,
        storage,
        timestamp: new Date().toISOString(),
        status: 'Background script working'
      };
    };
  }

  console.log('ProfGini Universal Background Script Initialized');
})();
