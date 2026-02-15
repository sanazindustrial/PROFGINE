// Canvas LMS Adapter
class CanvasAdapter {
  constructor() {
    this.id = 'canvas';
    this.name = 'Canvas LMS';
  }

  matches(url, doc) {
    return url.includes('instructure.com') ||
      url.includes('canvas.') ||
      doc.querySelector('meta[name="canvas-frontend"]') !== null ||
      doc.querySelector('#application[data-environment="production"]') !== null;
  }

  detectPageType(doc) {
    // Assignment submission page
    if (doc.querySelector('.assignment-submission') ||
      doc.querySelector('#speedgrader_iframe') ||
      doc.querySelector('.speedgrader-container') ||
      doc.querySelector('h1[data-testid="assignment-heading"]')) {
      return 'assignment_submission';
    }

    // Discussion thread
    if (doc.querySelector('.discussion-topic') ||
      doc.querySelector('.discussion_entry') ||
      doc.querySelector('[data-testid="discussion-topic"]')) {
      return 'discussion_thread';
    }

    // Gradebook
    if (doc.querySelector('.gradebook') ||
      doc.querySelector('#gradebook_grid')) {
      return 'gradebook';
    }

    return 'unknown';
  }

  async extractContent(doc) {
    const pageType = this.detectPageType(doc);

    if (pageType === 'assignment_submission') {
      return this.extractAssignmentSubmission(doc);
    } else if (pageType === 'discussion_thread') {
      return this.extractDiscussionThread(doc);
    }

    return null;
  }

  async extractAssignmentSubmission(doc) {
    const content = {
      kind: 'submission',
      targets: {}
    };

    // Extract assignment prompt
    const promptElement = doc.querySelector('.assignment_description') ||
      doc.querySelector('[data-testid="assignment-description"]') ||
      doc.querySelector('.description .user_content');
    if (promptElement) {
      content.prompt = promptElement.textContent.trim();
    }

    // Extract student submission text
    const submissionElement = doc.querySelector('.submission_details .submission-text') ||
      doc.querySelector('#speedgrader_iframe');

    if (submissionElement) {
      if (submissionElement.tagName === 'IFRAME') {
        // Handle iframe content for submissions
        try {
          const iframeDoc = submissionElement.contentDocument;
          if (iframeDoc) {
            content.studentText = iframeDoc.body.textContent.trim();
          }
        } catch (e) {
          console.warn('Cannot access iframe content:', e);
        }
      } else {
        content.studentText = submissionElement.textContent.trim();
      }
    }

    // Extract student info
    const studentNameElement = doc.querySelector('.student_name') ||
      doc.querySelector('[data-testid="student-name"]') ||
      doc.querySelector('#students_selectmenu-button .ui-selectmenu-text');
    if (studentNameElement) {
      content.student = {
        name: studentNameElement.textContent.trim()
      };
    }

    // Extract file submissions
    const fileElements = doc.querySelectorAll('.submission_attachment a') ||
      doc.querySelectorAll('[data-testid="submission-file"] a');
    if (fileElements.length > 0) {
      content.files = Array.from(fileElements).map(link => ({
        name: link.textContent.trim(),
        url: link.href,
        type: this.getFileType(link.href)
      }));
    }

    // Extract rubric
    const rubricElement = doc.querySelector('.rubric') ||
      doc.querySelector('[data-testid="rubric"]');
    if (rubricElement) {
      content.rubric = rubricElement.textContent.trim();
    }

    // Find target elements for applying feedback
    content.targets.feedbackBox = doc.querySelector('#speedgrader_comment_textarea') ||
      doc.querySelector('.comment_textarea') ||
      doc.querySelector('[data-testid="comment-textarea"]');

    content.targets.gradeInput = doc.querySelector('#grading-box-extended input[type="text"]') ||
      doc.querySelector('.grade input') ||
      doc.querySelector('#grade_container input');

    content.targets.submitButton = doc.querySelector('#comment_submit_button') ||
      doc.querySelector('.save_comment_button') ||
      doc.querySelector('[data-testid="submit-comment"]');

    return content;
  }

  async extractDiscussionThread(doc) {
    const content = {
      kind: 'discussion',
      targets: {},
      posts: [] // Array to hold ALL individual student posts
    };

    // Extract discussion prompt/topic
    const topicElement = doc.querySelector('.discussion-topic .message') ||
      doc.querySelector('[data-testid="discussion-topic"] .user_content');
    if (topicElement) {
      content.prompt = topicElement.textContent.trim();
    }

    // Extract discussion title
    const titleElement = doc.querySelector('.discussion-title') ||
      doc.querySelector('h1.discussion-topic-title') ||
      doc.querySelector('[data-testid="discussion-topic-title"]');
    if (titleElement) {
      content.threadTitle = titleElement.textContent.trim();
    }

    // ============= BULK EXTRACT ALL DISCUSSION POSTS =============
    // Find all discussion entries on the page
    const allEntries = doc.querySelectorAll(
      '.discussion_entry, .discussion-entry, [data-testid="discussion-entry"], ' +
      '.entry-content, .discussion-reply, [role="article"]'
    );

    allEntries.forEach((entry, index) => {
      const post = this.extractSinglePost(entry, index);
      if (post && post.content) {
        content.posts.push(post);
      }
    });

    // Also try newer Canvas UI formats
    const newUIEntries = doc.querySelectorAll(
      '[data-testid="reply-tree-entry"], .threadedReplies__entry, ' +
      '.discussion-entry-container, .DiscussionEntry-module__container'
    );

    newUIEntries.forEach((entry, index) => {
      const post = this.extractSinglePost(entry, content.posts.length + index);
      if (post && post.content && !content.posts.some(p => p.content === post.content)) {
        content.posts.push(post);
      }
    });

    // ============= LEGACY: Extract selected post for single grading =============
    // Extract student post (usually the selected/focused one)
    const selectedPost = doc.querySelector('.discussion_entry.selected .message') ||
      doc.querySelector('.discussion-entry:hover .message') ||
      doc.querySelector('.discussion_entry:first-child .message');

    if (selectedPost) {
      content.studentText = selectedPost.textContent.trim();

      // Extract student name from the post
      const authorElement = selectedPost.closest('.discussion_entry')
        ?.querySelector('.author_name') ||
        selectedPost.closest('.discussion_entry')
        ?.querySelector('[data-testid="author-name"]');
      if (authorElement) {
        content.student = {
          name: authorElement.textContent.trim()
        };
      }
    }

    // Find reply box
    content.targets.replyBox = doc.querySelector('#discussion_topic .discussion-reply-form textarea') ||
      doc.querySelector('.reply-textarea') ||
      doc.querySelector('[data-testid="message-body"]');

    // Find submit button for reply
    content.targets.submitButton = doc.querySelector('.discussion-reply-form .btn-primary') ||
      doc.querySelector('[data-testid="discussion-post-reply"]');

    return content;
  }

  async applyFeedback(target, text) {
    if (!target) return;

    // Handle different types of input elements
    if (target.tagName === 'TEXTAREA') {
      target.value = text;
      target.dispatchEvent(new Event('input', {
        bubbles: true
      }));
      target.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    } else if (target.contentEditable === 'true') {
      target.innerHTML = text.replace(/\n/g, '<br>');
      target.dispatchEvent(new Event('input', {
        bubbles: true
      }));
    } else {
      // Try to find the actual input element
      const textarea = target.querySelector('textarea') ||
        target.querySelector('[contenteditable="true"]');
      if (textarea) {
        await this.applyFeedback(textarea, text);
      }
    }

    // Trigger React/Canvas-specific events
    target.focus();
    await this.delay(100);
    target.blur();
  }

  async applyGrade(target, score) {
    if (!target) return;

    target.value = score.toString();
    target.dispatchEvent(new Event('input', {
      bubbles: true
    }));
    target.dispatchEvent(new Event('change', {
      bubbles: true
    }));

    // Trigger Canvas-specific grade validation
    target.focus();
    await this.delay(100);
    target.blur();
  }

  async clickSubmit(button) {
    if (!button) return;

    button.click();

    // Wait for Canvas to process the submission
    await this.delay(1000);
  }

  findElementsByLabel(doc, label) {
    const elements = [];
    const xpath = `//label[contains(text(), '${label}')]`;
    const result = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    for (let i = 0; i < result.snapshotLength; i++) {
      const labelElement = result.snapshotItem(i);
      const forAttr = labelElement.getAttribute('for');
      if (forAttr) {
        const input = doc.getElementById(forAttr);
        if (input) elements.push(input);
      }
    }

    return elements;
  }

  findTextareaByContext(doc, context) {
    const textareas = doc.querySelectorAll('textarea');
    for (const textarea of textareas) {
      const label = doc.querySelector(`label[for="${textarea.id}"]`);
      const placeholder = textarea.placeholder;
      const ariaLabel = textarea.getAttribute('aria-label');

      if ((label && label.textContent.toLowerCase().includes(context.toLowerCase())) ||
        (placeholder && placeholder.toLowerCase().includes(context.toLowerCase())) ||
        (ariaLabel && ariaLabel.toLowerCase().includes(context.toLowerCase()))) {
        return textarea;
      }
    }
    return null;
  }

  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  getFileType(url) {
    const extension = url.split('.').pop().toLowerCase();
    const types = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'rtf': 'application/rtf'
    };
    return types[extension] || 'unknown';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Extract a single discussion post/reply from page element
  extractSinglePost(entry, index) {
    const post = {
      index: index,
      studentId: null,
      studentName: null,
      studentEmail: null,
      content: null,
      timestamp: null,
      isReply: false,
      parentId: null,
      wordCount: 0
    };

    // Try multiple selectors for author name
    const authorSelectors = [
      '.author_name', '[data-testid="author-name"]', '.discussion-author',
      '.author', '.user_name', '.display-name', '[data-testid="author"]',
      '.entry-author', '.DiscussionEntry-module__authorName'
    ];

    for (const selector of authorSelectors) {
      const authorEl = entry.querySelector(selector);
      if (authorEl) {
        post.studentName = authorEl.textContent.trim();
        break;
      }
    }

    // Extract student ID from data attributes or URL
    const studentIdAttr = entry.getAttribute('data-student-id') ||
      entry.getAttribute('data-user-id') ||
      entry.querySelector('[data-student-id]')?.getAttribute('data-student-id') ||
      entry.querySelector('[data-user-id]')?.getAttribute('data-user-id');
    if (studentIdAttr) {
      post.studentId = studentIdAttr;
    }

    // Extract post content
    const contentSelectors = [
      '.message', '.user_content', '.message-body', '.entry-message',
      '.discussion-entry__message', '[data-testid="discussion-entry-message"]',
      '.DiscussionEntry-module__message', '.reply-content', 'p'
    ];

    for (const selector of contentSelectors) {
      const contentEl = entry.querySelector(selector);
      if (contentEl) {
        post.content = contentEl.textContent.trim();
        post.wordCount = post.content.split(/\s+/).filter(w => w.length > 0).length;
        break;
      }
    }

    // Extract timestamp
    const timestampSelectors = [
      '.discussion-pubdate', '.timestamp', '[data-testid="discussion-timestamp"]',
      '.pubdate time', 'time', '.entry-date', '.discussion-time'
    ];

    for (const selector of timestampSelectors) {
      const timeEl = entry.querySelector(selector);
      if (timeEl) {
        post.timestamp = timeEl.getAttribute('datetime') ||
          timeEl.getAttribute('title') ||
          timeEl.textContent.trim();
        break;
      }
    }

    // Check if this is a reply (nested)
    const parentEntry = entry.parentElement?.closest('.discussion_entry, .discussion-entry');
    if (parentEntry && parentEntry !== entry) {
      post.isReply = true;
      post.parentId = parentEntry.getAttribute('data-entry-id') ||
        parentEntry.getAttribute('data-id') ||
        entry.getAttribute('data-parent-entry-id');
    }

    // Generate a unique identifier
    post.uniqueId = `${post.studentId || 'unknown'}_${index}_${Date.now()}`;

    return post;
  }

  // Bulk extract all discussion posts for review
  async extractAllDiscussionPosts(doc) {
    const result = {
      threadTitle: null,
      threadPrompt: null,
      courseId: null,
      assignmentId: null,
      posts: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        lms: this.id,
        totalPosts: 0,
        uniqueStudents: 0
      }
    };

    // Extract thread info
    const titleEl = doc.querySelector('.discussion-title, h1, [data-testid="discussion-title"]');
    if (titleEl) result.threadTitle = titleEl.textContent.trim();

    const promptEl = doc.querySelector('.discussion-topic .message, .user_content');
    if (promptEl) result.threadPrompt = promptEl.textContent.trim();

    // Try to get course/assignment IDs from URL
    const urlMatch = window.location.pathname.match(/courses\/(\d+)/);
    if (urlMatch) result.courseId = urlMatch[1];

    const discussionMatch = window.location.pathname.match(/discussion_topics\/(\d+)/);
    if (discussionMatch) result.assignmentId = discussionMatch[1];

    // Extract all posts
    const entrySelectors = [
      '.discussion_entry', '.discussion-entry', '[data-testid="discussion-entry"]',
      '.threadedReplies__entry', '.DiscussionEntry-module__container',
      '[data-testid="reply-tree-entry"]', '.entry-content'
    ];

    const allEntries = doc.querySelectorAll(entrySelectors.join(', '));
    const seenContent = new Set();

    allEntries.forEach((entry, index) => {
      const post = this.extractSinglePost(entry, index);
      if (post.content && !seenContent.has(post.content)) {
        seenContent.add(post.content);
        result.posts.push(post);
      }
    });

    // Update metadata
    result.metadata.totalPosts = result.posts.length;
    const uniqueStudents = new Set(result.posts.map(p => p.studentName || p.studentId).filter(Boolean));
    result.metadata.uniqueStudents = uniqueStudents.size;

    return result;
  }
}
