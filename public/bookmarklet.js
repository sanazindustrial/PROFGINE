// ProfGenie LMS Discussion Extractor Bookmarklet
// This script runs in the browser to extract discussion posts from LMS pages

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

  // Extract posts based on LMS type
  function extractPosts(lmsType) {
    let posts = [];

    switch (lmsType) {
      case 'moodle':
        posts = extractMoodlePosts();
        break;
      case 'canvas':
        posts = extractCanvasPosts();
        break;
      case 'blackboard':
        posts = extractBlackboardPosts();
        break;
      case 'd2l':
        posts = extractD2LPosts();
        break;
      default:
        posts = extractGenericPosts();
    }

    return posts;
  }

  // Moodle extraction
  function extractMoodlePosts() {
    const posts = [];

    // Try forum posts
    const forumPosts = document.querySelectorAll('.forumpost, .forum-post, [data-region="post"]');
    forumPosts.forEach((post, i) => {
      const authorEl = post.querySelector('.author a, .d-flex.flex-column a, .post-author');
      const contentEl = post.querySelector('.post-content, .posting, .text_to_html, .post-content-container');
      const timeEl = post.querySelector('.post-time, time, .modified');

      if (contentEl) {
        posts.push({
          name: authorEl ? authorEl.textContent.trim() : `Student ${i + 1}`,
          content: contentEl.textContent.trim(),
          time: timeEl ? timeEl.textContent.trim() : ''
        });
      }
    });

    // Try discussion entries
    if (posts.length === 0) {
      const entries = document.querySelectorAll('.discussion-entry, .forum-discussion');
      entries.forEach((entry, i) => {
        const name = entry.querySelector('.userfullname, .username')?.textContent.trim() || `Student ${i + 1}`;
        const content = entry.querySelector('.entry-content, .message')?.textContent.trim() || '';
        if (content) {
          posts.push({
            name,
            content,
            time: ''
          });
        }
      });
    }

    return posts;
  }

  // Canvas extraction
  function extractCanvasPosts() {
    const posts = [];

    // Discussion entries
    const entries = document.querySelectorAll('.discussion-entry, .entry-content');
    entries.forEach((entry, i) => {
      const header = entry.closest('.discussion-entry')?.querySelector('.discussion-header-content');
      const name = header?.querySelector('.author-name, .user_name')?.textContent.trim() || `Student ${i + 1}`;
      const content = entry.querySelector('.message, .user_content')?.textContent.trim() || entry.textContent.trim();
      const time = header?.querySelector('.post-date, time')?.textContent.trim() || '';

      if (content && content.length > 10) {
        posts.push({
          name,
          content,
          time
        });
      }
    });

    // Reply threads
    if (posts.length === 0) {
      const replies = document.querySelectorAll('.discussion_subentries .discussion-entry, .replies .entry');
      replies.forEach((reply, i) => {
        const name = reply.querySelector('.author-name')?.textContent.trim() || `Student ${i + 1}`;
        const content = reply.querySelector('.message')?.textContent.trim() || '';
        if (content) {
          posts.push({
            name,
            content,
            time: ''
          });
        }
      });
    }

    return posts;
  }

  // Blackboard extraction
  function extractBlackboardPosts() {
    const posts = [];

    // Discussion posts
    const threads = document.querySelectorAll('.dbThread, .thread-post, [data-testid="discussion-post"]');
    threads.forEach((thread, i) => {
      const name = thread.querySelector('.vtbegenerated a, .user-name, .author')?.textContent.trim() || `Student ${i + 1}`;
      const content = thread.querySelector('.vtbegenerated, .post-body, .post-content')?.textContent.trim() || '';
      const time = thread.querySelector('.postDate, time')?.textContent.trim() || '';

      if (content && content.length > 10) {
        posts.push({
          name,
          content,
          time
        });
      }
    });

    // Ultra style
    if (posts.length === 0) {
      const ultraPosts = document.querySelectorAll('[data-testid="post-item"], .post-wrapper');
      ultraPosts.forEach((post, i) => {
        const name = post.querySelector('[data-testid="author-name"]')?.textContent.trim() || `Student ${i + 1}`;
        const content = post.querySelector('[data-testid="post-body"]')?.textContent.trim() || '';
        if (content) {
          posts.push({
            name,
            content,
            time: ''
          });
        }
      });
    }

    return posts;
  }

  // D2L/Brightspace extraction
  function extractD2LPosts() {
    const posts = [];

    const discussions = document.querySelectorAll('.d2l-discussions-post, .d2l-htmlblock');
    discussions.forEach((disc, i) => {
      const name = disc.querySelector('.d2l-username, .vui-link')?.textContent.trim() || `Student ${i + 1}`;
      const content = disc.querySelector('.d2l-htmlblock, .d2l-discussions-message')?.textContent.trim() || '';
      if (content && content.length > 10) {
        posts.push({
          name,
          content,
          time: ''
        });
      }
    });

    return posts;
  }

  // Generic extraction (fallback)
  function extractGenericPosts() {
    const posts = [];

    // Try common patterns
    const containers = document.querySelectorAll(
      '.post, .reply, .comment, .discussion-post, .forum-post, ' +
      '[class*="post"], [class*="reply"], [class*="comment"]'
    );

    containers.forEach((container, i) => {
      const text = container.textContent.trim();
      if (text.length > 50 && text.length < 5000) {
        // Try to find author
        const authorEl = container.querySelector(
          '.author, .user, .name, [class*="author"], [class*="user"], [class*="name"], a'
        );
        const name = authorEl ? authorEl.textContent.trim().substring(0, 50) : `Student ${i + 1}`;

        posts.push({
          name,
          content: text,
          time: ''
        });
      }
    });

    // If nothing found, get all text
    if (posts.length === 0) {
      const bodyText = document.body.innerText;
      posts.push({
        name: 'All Content',
        content: bodyText.substring(0, 50000),
        time: ''
      });
    }

    return posts;
  }

  // Format posts for transfer
  function formatPosts(posts) {
    if (posts.length === 0) {
      return document.body.innerText.substring(0, 50000);
    }

    return posts.map(p => {
      const header = p.time ? `${p.name} - ${p.time}` : p.name;
      return `${header}\n${p.content}`;
    }).join('\n\n---\n\n');
  }

  // Main execution
  try {
    const lmsType = detectLMS();
    const posts = extractPosts(lmsType);
    const formatted = formatPosts(posts);

    // Check if we got meaningful content
    const hasGoodContent = posts.length > 0 && posts.some(p => p.content.length > 100);

    if (hasGoodContent) {
      // Direct extraction worked - use it
      sessionStorage.setItem('profgenie_posts', formatted);
      sessionStorage.setItem('profgenie_count', posts.length.toString());
      sessionStorage.setItem('profgenie_lms', lmsType);

      // Build URL
      const baseUrl = 'https://profgenie.ai/discussion';
      const params = new URLSearchParams({
        content: formatted.substring(0, 50000),
        lms: lmsType,
        count: posts.length.toString()
      });

      // Open ProfGenie
      window.open(baseUrl + '?' + params.toString(), '_blank');

      // Show confirmation
      alert(`ProfGenie: Extracted ${posts.length} discussion post(s) from ${lmsType.toUpperCase()}`);
    } else {
      // DOM extraction didn't work well - try authenticated API scan
      const useAuthScan = confirm(
        `ProfGenie: Could not extract discussion posts directly.\n\n` +
        `Would you like to try authenticated scanning?\n` +
        `This will send your session cookies to scan this page server-side.`
      );

      if (useAuthScan) {
        // Capture cookies and URL for authenticated scan
        const authData = {
          url: window.location.href,
          cookies: document.cookie,
          lms: lmsType
        };

        // Send to API for authenticated scanning
        fetch('https://profgenie.ai/api/discussion/scan-web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authData)
        })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            alert(`ProfGenie: ${data.message || data.error}\n\n${data.suggestion || ''}`);
          } else if (data.posts && data.posts.length > 0) {
            // Format posts and open ProfGenie
            const content = data.posts.map(p => `${p.author || 'Student'}\n${p.content}`).join('\n\n---\n\n');
            const params = new URLSearchParams({
              content: content.substring(0, 50000),
              lms: lmsType,
              count: data.posts.length.toString()
            });
            window.open('https://profgenie.ai/discussion?' + params.toString(), '_blank');
            alert(`ProfGenie: Extracted ${data.posts.length} posts via authenticated scan!`);
          } else {
            alert('ProfGenie: No posts found. Try copying and pasting the content manually.');
          }
        })
        .catch(err => {
          alert('ProfGenie: Scan failed. Try copying and pasting the content manually.');
          console.error('ProfGenie error:', err);
        });
      } else {
        // Fall back to copying page text
        const fallback = document.body.innerText.substring(0, 50000);
        window.open('https://profgenie.ai/discussion?content=' + encodeURIComponent(fallback), '_blank');
      }
    }

  } catch (error) {
    alert('ProfGenie: Error extracting posts. Copying page text instead.');
    const fallback = document.body.innerText.substring(0, 50000);
    window.open('https://profgenie.ai/discussion?content=' + encodeURIComponent(fallback), '_blank');
  }
})();
