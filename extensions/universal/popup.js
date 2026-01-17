// Universal Popup Script
(function () {
  'use strict';

  // Browser compatibility layer
  const BrowserAPI = {
    tabs: {
      query: (info) => {
        if (typeof browser !== 'undefined') return browser.tabs.query(info);
        return chrome.tabs.query(info);
      },
      executeScript: (tabId, details) => {
        if (typeof browser !== 'undefined') return browser.tabs.executeScript(tabId, details);
        return chrome.tabs.executeScript(tabId, details);
      }
    },
    storage: {
      local: {
        get: (keys) => {
          if (typeof browser !== 'undefined') return browser.storage.local.get(keys);
          return chrome.storage.local.get(keys);
        },
        set: (data) => {
          if (typeof browser !== 'undefined') return browser.storage.local.set(data);
          return chrome.storage.local.set(data);
        }
      }
    }
  };

  // LMS Platform Detection
  const LMS_PLATFORMS = {
    'canvas.instructure.com': {
      name: 'Canvas',
      icon: '🎨'
    },
    'blackboard.com': {
      name: 'Blackboard',
      icon: '⚫'
    },
    'd2l.com': {
      name: 'D2L/Brightspace',
      icon: '💡'
    },
    'classroom.google.com': {
      name: 'Google Classroom',
      icon: '📚'
    },
    'moodle.': {
      name: 'Moodle',
      icon: '🅜'
    },
    'schoology.com': {
      name: 'Schoology',
      icon: '🏫'
    }
  };

  const detectLMS = (url) => {
    const hostname = url.toLowerCase();
    for (const [pattern, info] of Object.entries(LMS_PLATFORMS)) {
      if (hostname.includes(pattern)) {
        return {
          platform: pattern.replace('.com', '').replace('.', '-'),
          ...info
        };
      }
    }
    return {
      platform: 'unknown',
      name: 'Unknown Platform',
      icon: '❓'
    };
  };

  const detectBrowser = () => {
    if (typeof browser !== 'undefined') return 'Firefox';
    if (navigator.userAgent.includes('Edg')) return 'Microsoft Edge';
    if (navigator.userAgent.includes('OPR')) return 'Opera';
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) return 'Safari';
    if (navigator.userAgent.includes('Chrome')) return 'Chrome';
    return 'Unknown Browser';
  };

  // Initialize popup
  const init = async () => {
    try {
      // Get current tab
      const tabs = await BrowserAPI.tabs.query({
        active: true,
        currentWindow: true
      });
      const currentTab = tabs[0];

      if (!currentTab) {
        updateStatus('disconnected', 'No active tab found');
        return;
      }

      const lmsInfo = detectLMS(currentTab.url);
      const browser = detectBrowser();

      // Update UI
      updateStatus(
        lmsInfo.platform !== 'unknown' ? 'connected' : 'disconnected',
        `${lmsInfo.icon} ${lmsInfo.name}`
      );

      document.getElementById('browser-info').textContent = `Browser: ${browser}`;

      // Load settings
      const settings = await BrowserAPI.storage.local.get([
        'autoExtract',
        'notifications',
        'discussionsCount',
        'assignmentsCount'
      ]);

      document.getElementById('auto-extract').checked = settings.autoExtract || false;
      document.getElementById('notifications').checked = settings.notifications !== false;
      document.getElementById('discussions-count').textContent = settings.discussionsCount || 0;
      document.getElementById('assignments-count').textContent = settings.assignmentsCount || 0;

      // Enable/disable buttons based on platform support
      const isSupported = lmsInfo.platform !== 'unknown';
      document.getElementById('extract-btn').disabled = !isSupported;
      document.getElementById('test-btn').disabled = !isSupported;

    } catch (error) {
      console.error('Failed to initialize popup:', error);
      updateStatus('disconnected', 'Initialization failed');
    }
  };

  const updateStatus = (status, text) => {
    const dot = document.getElementById('status-dot');
    const statusText = document.getElementById('platform-status');

    dot.className = `status-dot ${status}`;
    statusText.textContent = text;
  };

  // Event handlers
  document.addEventListener('DOMContentLoaded', () => {
    init();

    // Extract content button
    document.getElementById('extract-btn').addEventListener('click', async () => {
      const btn = document.getElementById('extract-btn');
      const originalText = btn.textContent;

      try {
        btn.textContent = '⏳ Extracting...';
        btn.disabled = true;

        const tabs = await BrowserAPI.tabs.query({
          active: true,
          currentWindow: true
        });
        const tabId = tabs[0].id;

        // Execute content extraction in the current tab
        await BrowserAPI.tabs.executeScript(tabId, {
          code: `
            if (typeof window.profginiTest === 'function') {
              const content = window.profginiTest();
              if (content && (content.discussions.length > 0 || content.assignments.length > 0)) {
                // Send content to API (this would be handled by the content script)
                console.log('Content extracted:', content);
              } else {
                console.log('No content found to extract');
              }
            } else {
              console.log('ProfGini content script not loaded');
            }
          `
        });

        // Update stats (in real implementation, this would come from the content script)
        setTimeout(() => {
          updateStats(Math.floor(Math.random() * 10), Math.floor(Math.random() * 5));
        }, 1000);

      } catch (error) {
        console.error('Extraction failed:', error);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    // Test extraction button
    document.getElementById('test-btn').addEventListener('click', async () => {
      const btn = document.getElementById('test-btn');
      const originalText = btn.textContent;

      try {
        btn.textContent = '🧪 Testing...';
        btn.disabled = true;

        const tabs = await BrowserAPI.tabs.query({
          active: true,
          currentWindow: true
        });
        const tabId = tabs[0].id;

        await BrowserAPI.tabs.executeScript(tabId, {
          code: `
            console.log('=== ProfGini Extension Test ===' );
            console.log('URL:', window.location.href);
            console.log('Platform detected:', typeof window.profginiTest === 'function' ? 'Yes' : 'No');
            if (typeof window.profginiTest === 'function') {
              const testResult = window.profginiTest();
              console.log('Test result:', testResult);
            }
            console.log('==============================');
          `
        });

      } catch (error) {
        console.error('Test failed:', error);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    // Sync settings button
    document.getElementById('sync-btn').addEventListener('click', async () => {
      const btn = document.getElementById('sync-btn');
      const originalText = btn.textContent;

      try {
        btn.textContent = '🔄 Syncing...';
        btn.disabled = true;

        // Test API connection
        const response = await fetch('https://api.profgenie.ai/api/extension', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            test: true,
            browser: detectBrowser()
          })
        });

        if (response.ok) {
          console.log('API connection successful');
        } else {
          console.log('API connection failed');
        }

      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    // Settings handlers
    document.getElementById('auto-extract').addEventListener('change', (e) => {
      BrowserAPI.storage.local.set({
        autoExtract: e.target.checked
      });
    });

    document.getElementById('notifications').addEventListener('change', (e) => {
      BrowserAPI.storage.local.set({
        notifications: e.target.checked
      });
    });
  });

  const updateStats = (discussions, assignments) => {
    document.getElementById('discussions-count').textContent = discussions;
    document.getElementById('assignments-count').textContent = assignments;

    BrowserAPI.storage.local.set({
      discussionsCount: discussions,
      assignmentsCount: assignments
    });
  };
})();
