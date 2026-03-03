// ProfGenie Authenticated LMS Scanner Bookmarklet
// This script extracts the FULL page content from the already-rendered page
// Since you're logged in, the browser has the authenticated view - we extract that directly

(function () {
  'use strict';

  // Detect LMS type
  function detectLMS() {
    const url = window.location.href.toLowerCase();
    const html = document.body.innerHTML.toLowerCase();

    if (url.includes('moodle') || url.includes('/mod/forum/') || html.includes('moodle')) {
      return 'moodle';
    }
    if (url.includes('canvas') || url.includes('instructure') || html.includes('canvas-container')) {
      return 'canvas';
    }
    if (url.includes('blackboard') || url.includes('bb-') || html.includes('blackboard')) {
      return 'blackboard';
    }
    if (url.includes('brightspace') || url.includes('d2l')) {
      return 'd2l';
    }
    if (url.includes('schoology')) {
      return 'schoology';
    }
    return 'generic';
  }

  // Show loading indicator
  function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'profgenie-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;
    overlay.innerHTML = `
      <div style="background: white; padding: 30px 50px; border-radius: 10px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 15px;">📚</div>
        <div style="font-size: 18px; color: #333;">ProfGenie</div>
        <div style="font-size: 14px; color: #666; margin-top: 10px;">Extracting page content...</div>
        <div style="margin-top: 15px; width: 200px; height: 4px; background: #eee; border-radius: 2px; overflow: hidden;">
          <div style="width: 30%; height: 100%; background: #4f46e5; animation: profgenie-load 1s infinite;"></div>
        </div>
      </div>
      <style>
        @keyframes profgenie-load {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      </style>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function hideLoading(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  // Extract the full rendered page content
  function extractPageContent() {
    // Get all visible text from the page
    // This captures the authenticated view since you're logged in

    // Clone body to avoid modifying the actual page
    const clone = document.body.cloneNode(true);

    // Remove scripts, styles, and hidden elements
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, svg, [hidden], [aria-hidden="true"]');
    elementsToRemove.forEach(el => el.remove());

    // Get text content
    let text = clone.innerText || clone.textContent || '';

    // Also include the full HTML for better parsing
    const html = document.documentElement.outerHTML;

    return {
      text,
      html
    };
  }

  // Main execution
  try {
    const lmsType = detectLMS();
    const pageUrl = window.location.href;

    const loading = showLoading();

    // Extract the page content directly from the DOM
    const {
      text,
      html
    } = extractPageContent();

    if (!text || text.trim().length < 100) {
      hideLoading(loading);
      alert('ProfGenie: Could not extract page content.\n\nMake sure the discussion page is fully loaded.');
      return;
    }

    // Send the extracted content to API (not cookies)
    fetch('https://profgenie.ai/api/discussion/scan-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rawContent: html.substring(0, 500000), // Send raw HTML for parsing
          sourceUrl: pageUrl,
          lmsType: lmsType,
          authenticated: true
        })
      })
      .then(res => res.json())
      .then(data => {
        hideLoading(loading);

        if (data.error) {
          alert(`ProfGenie: ${data.message || data.error}`);
          return;
        }

        if (data.posts && data.posts.length > 0) {
          // Format posts
          const content = data.posts.map(p => {
            const name = p.studentName || p.author || 'Student';
            return `${name}\n${p.content}`;
          }).join('\n\n---\n\n');

          // Store in localStorage for ProfGenie to pick up
          try {
            localStorage.setItem('profgenie_imported_discussion', JSON.stringify({
              content: content.substring(0, 100000),
              lmsType: lmsType,
              posts: data.posts,
              count: data.posts.length,
              sourceUrl: pageUrl,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.log('Could not save to localStorage:', e);
          }

          // If opened from ProfGenie, send message back
          if (window.opener) {
            try {
              window.opener.postMessage({
                type: 'PROFGENIE_DISCUSSION_DATA',
                posts: data.posts,
                lmsType: lmsType,
                sourceUrl: pageUrl
              }, 'https://profgenie.ai');
            } catch (e) {
              console.log('Could not post message:', e);
            }
          }

          // Show success and redirect to ProfGenie
          const count = data.posts.length;
          const redirect = confirm(
            `✅ ProfGenie: Successfully extracted ${count} posts!\n\n` +
            `Click OK to go to ProfGenie and generate responses.\n` +
            `Click Cancel to stay on this page.`
          );

          if (redirect) {
            window.location.href = 'https://profgenie.ai/discussion?imported=true';
          }
        } else {
          alert(
            'ProfGenie: No discussion posts found on this page.\n\n' +
            'Tips:\n' +
            '• Make sure you are on a discussion thread page (not the list)\n' +
            '• Try scrolling down to load all posts first\n' +
            '• Try the "Grab Posts" bookmarklet instead\n' +
            '• Or copy/paste the content manually'
          );
        }
      })
      .catch(err => {
        hideLoading(loading);
        console.error('ProfGenie error:', err);
        alert(
          'ProfGenie: Connection failed.\n\n' +
          'Please check your internet connection and try again.'
        );
      });

  } catch (error) {
    console.error('ProfGenie error:', error);
    alert('ProfGenie: An error occurred. Please try again.');
  }
})();
