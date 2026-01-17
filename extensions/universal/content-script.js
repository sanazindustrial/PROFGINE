// Universal Content Script - Works across all browsers
(function () {
  'use strict';

  // Browser compatibility layer
  const BrowserAPI = {
    runtime: {
      sendMessage: (message) => {
        if (typeof browser !== 'undefined') return browser.runtime.sendMessage(message);
        return chrome.runtime.sendMessage(message);
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
    'canvas.instructure.com': 'canvas',
    'blackboard.com': 'blackboard',
    'd2l.com': 'd2l',
    'classroom.google.com': 'google-classroom',
    'moodle.': 'moodle',
    'schoology.com': 'schoology',
    'brightspace.com': 'brightspace'
  };

  const detectLMS = () => {
    const hostname = window.location.hostname.toLowerCase();
    for (const [pattern, platform] of Object.entries(LMS_PLATFORMS)) {
      if (hostname.includes(pattern)) {
        return platform;
      }
    }
    return 'unknown';
  };

  // Content Extractors for different LMS platforms
  const ContentExtractors = {
    canvas: {
      discussions: () => {
        const posts = [];
        document.querySelectorAll('.discussion-entry, .entry-content').forEach(post => {
          const author = post.querySelector('.author, .discussion-author')?.textContent?.trim();
          const content = post.querySelector('.message, .user_content')?.textContent?.trim();
          const timestamp = post.querySelector('.discussion-pubdate, .timestamp')?.textContent?.trim();
          if (content) {
            posts.push({
              author,
              content,
              timestamp,
              platform: 'canvas'
            });
          }
        });
        return posts;
      },
      assignments: () => {
        const assignments = [];
        document.querySelectorAll('.assignment, .assignment-title').forEach(assignment => {
          const title = assignment.querySelector('.assignment-title, h1, h2')?.textContent?.trim();
          const description = assignment.querySelector('.description, .assignment-description')?.textContent?.trim();
          const dueDate = assignment.querySelector('.due-date, .assignment-due-date')?.textContent?.trim();
          if (title) {
            assignments.push({
              title,
              description,
              dueDate,
              platform: 'canvas'
            });
          }
        });
        return assignments;
      }
    },

    blackboard: {
      discussions: () => {
        const posts = [];
        document.querySelectorAll('.forum-post, .discussionPost').forEach(post => {
          const author = post.querySelector('.author, .forum-author')?.textContent?.trim();
          const content = post.querySelector('.post-content, .forum-content')?.textContent?.trim();
          const timestamp = post.querySelector('.post-date, .forum-date')?.textContent?.trim();
          if (content) {
            posts.push({
              author,
              content,
              timestamp,
              platform: 'blackboard'
            });
          }
        });
        return posts;
      },
      assignments: () => {
        const assignments = [];
        document.querySelectorAll('.assignment, .gradebook-item').forEach(assignment => {
          const title = assignment.querySelector('.item-title, .assignment-title')?.textContent?.trim();
          const description = assignment.querySelector('.assignment-description')?.textContent?.trim();
          const dueDate = assignment.querySelector('.due-date')?.textContent?.trim();
          if (title) {
            assignments.push({
              title,
              description,
              dueDate,
              platform: 'blackboard'
            });
          }
        });
        return assignments;
      }
    },

    'd2l': {
      discussions: () => {
        const posts = [];
        document.querySelectorAll('.d2l-discussion-post, .d2l-forum-post').forEach(post => {
          const author = post.querySelector('.d2l-author, .author-name')?.textContent?.trim();
          const content = post.querySelector('.d2l-htmleditor-content, .post-text')?.textContent?.trim();
          const timestamp = post.querySelector('.d2l-date, .post-date')?.textContent?.trim();
          if (content) {
            posts.push({
              author,
              content,
              timestamp,
              platform: 'd2l'
            });
          }
        });
        return posts;
      },
      assignments: () => {
        const assignments = [];
        document.querySelectorAll('.d2l-assignment, .assignment-item').forEach(assignment => {
          const title = assignment.querySelector('.assignment-name, .d2l-link')?.textContent?.trim();
          const description = assignment.querySelector('.assignment-description')?.textContent?.trim();
          const dueDate = assignment.querySelector('.due-date, .d2l-date')?.textContent?.trim();
          if (title) {
            assignments.push({
              title,
              description,
              dueDate,
              platform: 'd2l'
            });
          }
        });
        return assignments;
      }
    },

    'google-classroom': {
      discussions: () => {
        const posts = [];
        document.querySelectorAll('.discussion-item, .announcement').forEach(post => {
          const author = post.querySelector('.author-name, .teacher-name')?.textContent?.trim();
          const content = post.querySelector('.announcement-content, .discussion-content')?.textContent?.trim();
          const timestamp = post.querySelector('.timestamp, .date')?.textContent?.trim();
          if (content) {
            posts.push({
              author,
              content,
              timestamp,
              platform: 'google-classroom'
            });
          }
        });
        return posts;
      },
      assignments: () => {
        const assignments = [];
        document.querySelectorAll('.assignment, .coursework-item').forEach(assignment => {
          const title = assignment.querySelector('.coursework-title, .assignment-title')?.textContent?.trim();
          const description = assignment.querySelector('.coursework-description')?.textContent?.trim();
          const dueDate = assignment.querySelector('.due-date, .coursework-due-date')?.textContent?.trim();
          if (title) {
            assignments.push({
              title,
              description,
              dueDate,
              platform: 'google-classroom'
            });
          }
        });
        return assignments;
      }
    }
  };

  // Universal content extraction
  const extractContent = () => {
    const platform = detectLMS();
    const extractor = ContentExtractors[platform];

    if (!extractor) {
      console.log('ProfGini: Unsupported LMS platform:', platform);
      return null;
    }

    const discussions = extractor.discussions?.() || [];
    const assignments = extractor.assignments?.() || [];

    return {
      platform,
      url: window.location.href,
      title: document.title,
      discussions,
      assignments,
      extractedAt: new Date().toISOString()
    };
  };

  // Send content to ProfGini API
  const sendToProfGini = async (content) => {
    try {
      // Get API endpoint from storage or default
      const {
        apiEndpoint
      } = await BrowserAPI.storage.local.get(['apiEndpoint']);
      const endpoint = apiEndpoint || 'https://api.profgenie.ai/api/extension';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Professor-GENIE-Extension/1.0'
        },
        body: JSON.stringify({
          ...content,
          browser: detectBrowser(),
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        console.log('ProfGini: Content sent successfully');
        showNotification('Content extracted and sent to Professor GENIE!', 'success');
      } else {
        throw new Error('API response not ok');
      }
    } catch (error) {
      console.error('ProfGini: Failed to send content:', error);
      showNotification('Failed to connect to Professor GENIE', 'error');
    }
  };

  // Detect browser type
  const detectBrowser = () => {
    if (typeof browser !== 'undefined') return 'firefox';
    if (navigator.userAgent.includes('Edg')) return 'edge';
    if (navigator.userAgent.includes('OPR')) return 'opera';
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) return 'safari';
    if (navigator.userAgent.includes('Chrome')) return 'chrome';
    return 'unknown';
  };

  // Show notification to user
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  // Add ProfGini button to page
  const addProfGiniButton = () => {
    if (document.getElementById('profgini-extract-btn')) return;

    const button = document.createElement('button');
    button.id = 'profgini-extract-btn';
    button.textContent = '📚 Extract with ProfGini';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #6366F1;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      z-index: 10000;
      transition: all 0.2s ease;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
    });

    button.addEventListener('click', async () => {
      button.textContent = '⏳ Extracting...';
      button.disabled = true;

      const content = extractContent();
      if (content && (content.discussions.length > 0 || content.assignments.length > 0)) {
        await sendToProfGini(content);
      } else {
        showNotification('No discussions or assignments found on this page', 'error');
      }

      button.textContent = '📚 Extract with ProfGini';
      button.disabled = false;
    });

    document.body.appendChild(button);
  };

  // Initialize extension
  const init = () => {
    const platform = detectLMS();
    const browser = detectBrowser();

    console.log(`ProfGini Extension loaded - Platform: ${platform}, Browser: ${browser}`);

    if (platform !== 'unknown') {
      // Add extraction button after page loads
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addProfGiniButton);
      } else {
        addProfGiniButton();
      }

      // Auto-extract on supported pages (optional)
      BrowserAPI.storage.local.get(['autoExtract']).then(({
        autoExtract
      }) => {
        if (autoExtract) {
          setTimeout(() => {
            const content = extractContent();
            if (content && (content.discussions.length > 0 || content.assignments.length > 0)) {
              sendToProfGini(content);
            }
          }, 3000);
        }
      });
    }
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Listen for messages from popup
  BrowserAPI.runtime.sendMessage = BrowserAPI.runtime.sendMessage || (() => {});

  // Global test function for debugging
  window.profginiTest = () => {
    const content = extractContent();
    console.log('ProfGini Test Results:', content);
    return content;
  };
})();
