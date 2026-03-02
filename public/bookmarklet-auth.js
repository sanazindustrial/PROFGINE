// ProfGenie Authenticated LMS Scanner Bookmarklet
// This script captures cookies and sends to API for authenticated scanning
// Use this when direct DOM extraction doesn't work

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
        <div style="font-size: 14px; color: #666; margin-top: 10px;">Scanning with your session...</div>
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

  // Main execution
  try {
    const lmsType = detectLMS();
    const pageUrl = window.location.href;
    const cookies = document.cookie;

    if (!cookies) {
      alert('ProfGenie: No session cookies found.\n\nMake sure you are logged into the LMS.');
      return;
    }

    const loading = showLoading();

    // Send authenticated request to API
    fetch('https://profgenie.ai/api/discussion/scan-web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageUrl,
        cookies: cookies
      })
    })
    .then(res => res.json())
    .then(data => {
      hideLoading(loading);

      if (data.error) {
        if (data.requiresAuth) {
          alert(
            `ProfGenie: ${data.message}\n\n` +
            `Suggestion: ${data.suggestion}\n\n` +
            `Your session may have expired. Please refresh the LMS page and try again.`
          );
        } else {
          alert(`ProfGenie Error: ${data.error}`);
        }
        return;
      }

      if (data.posts && data.posts.length > 0) {
        // Format posts
        const content = data.posts.map(p => {
          const header = p.author || 'Student';
          return `${header}\n${p.content}`;
        }).join('\n\n---\n\n');

        // Open ProfGenie with extracted content
        const params = new URLSearchParams({
          content: content.substring(0, 50000),
          lms: lmsType,
          count: data.posts.length.toString(),
          auth: 'true'
        });

        window.open('https://profgenie.ai/discussion?' + params.toString(), '_blank');
        alert(`ProfGenie: Successfully extracted ${data.posts.length} posts via authenticated scan!`);
      } else {
        alert(
          'ProfGenie: No discussion posts found on this page.\n\n' +
          'Tips:\n' +
          '• Make sure you are on a discussion thread page\n' +
          '• Try scrolling to load all posts first\n' +
          '• Try copying and pasting the content manually'
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
