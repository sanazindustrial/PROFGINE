// Google Classroom LMS Adapter
class GoogleClassroomAdapter {
  constructor() {
    this.id = 'google-classroom';
    this.name = 'Google Classroom';
  }

  matches(url, doc) {
    return url.includes('classroom.google.com') ||
      doc.querySelector('meta[content*="Google Classroom"]') !== null ||
      doc.querySelector('[data-app-id="classroom"]') !== null ||
      doc.body?.classList.contains('classroom-body');
  }

  detectPageType(doc) {
    // Student work review page
    if (doc.querySelector('[data-test-id="student-work"]') ||
      doc.querySelector('.kSIzHe') || // Student work container
      doc.querySelector('.student-submission') ||
      doc.querySelector('[role="main"] [data-assignment-id]')) {
      return 'assignment_submission';
    }

    // Class stream with student posts/comments
    if (doc.querySelector('[data-test-id="stream-item"]') ||
      doc.querySelector('.YVvGBb') || // Stream item
      doc.querySelector('.class-stream')) {
      return 'discussion_thread';
    }

    // Gradebook
    if (doc.querySelector('[data-test-id="gradebook"]') ||
      doc.querySelector('.gradebook-table')) {
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

    // Extract assignment instructions (usually in sidebar or header)
    const promptElement = doc.querySelector('[data-test-id="assignment-instructions"]') ||
      doc.querySelector('.assignment-instructions') ||
      doc.querySelector('.YVvGBb .asQXV') || // Assignment description
      doc.querySelector('[role="main"] .asQXV');
    if (promptElement) {
      content.prompt = promptElement.textContent.trim();
    }

    // Extract student submission content
    const submissionElement = doc.querySelector('[data-test-id="submission-content"]') ||
      doc.querySelector('.student-submission-text') ||
      doc.querySelector('.kSIzHe .YVvGBb') || // Submission content
      doc.querySelector('[data-submission-type="text"]');
    if (submissionElement) {
      content.studentText = submissionElement.textContent.trim();
    }

    // Extract student information
    const studentElement = doc.querySelector('[data-test-id="student-name"]') ||
      doc.querySelector('.student-name') ||
      doc.querySelector('.gb_yb') || // Google account name
      doc.querySelector('[data-email]');
    if (studentElement) {
      content.student = {
        name: studentElement.textContent.trim()
      };
    }

    // Extract file attachments
    const fileElements = doc.querySelectorAll('[data-test-id="attachment"]') ||
      doc.querySelectorAll('.attachment-item') ||
      doc.querySelectorAll('a[href*="/file/"]');
    if (fileElements.length > 0) {
      content.files = Array.from(fileElements).map(link => ({
        name: link.textContent.trim() || link.getAttribute('aria-label') || 'Unknown file',
        url: link.href,
        type: this.getFileType(link.href)
      }));
    }

    // Extract rubric if available
    const rubricElement = doc.querySelector('[data-test-id="rubric"]') ||
      doc.querySelector('.rubric-container');
    if (rubricElement) {
      content.rubric = this.extractRubricText(rubricElement);
    }

    // Find target elements for feedback and grading
    content.targets.feedbackBox = doc.querySelector('[data-test-id="private-comment"]') ||
      doc.querySelector('textarea[aria-label*="comment"]') ||
      doc.querySelector('.private-comment-input') ||
      doc.querySelector('div[contenteditable="true"]');

    content.targets.gradeInput = doc.querySelector('[data-test-id="grade-input"]') ||
      doc.querySelector('input[aria-label*="grade"]') ||
      doc.querySelector('.grade-input') ||
      doc.querySelector('input[type="number"]');

    content.targets.submitButton = doc.querySelector('[data-test-id="return-button"]') ||
      doc.querySelector('button[aria-label*="return"]') ||
      doc.querySelector('.return-assignment') ||
      doc.querySelector('button[aria-label*="save"]');

    return content;
  }

  async extractDiscussionThread(doc) {
    const content = {
      kind: 'discussion',
      targets: {}
    };

    // Extract class announcement or question
    const topicElement = doc.querySelector('[data-test-id="stream-announcement"]') ||
      doc.querySelector('.announcement-content') ||
      doc.querySelector('.YVvGBb .asQXV');
    if (topicElement) {
      content.prompt = topicElement.textContent.trim();
    }

    // Extract student comment/post (focus on selected or first)
    const selectedPost = doc.querySelector('[data-selected="true"] .comment-text') ||
      doc.querySelector('.student-comment:first-child .comment-content') ||
      doc.querySelector('.stream-item-comment .YVvGBb');

    if (selectedPost) {
      content.studentText = selectedPost.textContent.trim();

      // Get author information
      const authorElement = selectedPost.closest('.stream-item, .comment-item')
        ?.querySelector('.author-name, .gb_yb');
      if (authorElement) {
        content.student = {
          name: authorElement.textContent.trim()
        };
      }
    }

    // Find reply elements
    content.targets.replyBox = doc.querySelector('[data-test-id="comment-input"]') ||
      doc.querySelector('textarea[placeholder*="comment"]') ||
      doc.querySelector('.comment-input') ||
      doc.querySelector('div[contenteditable="true"][aria-label*="comment"]');

    content.targets.submitButton = doc.querySelector('[data-test-id="post-comment"]') ||
      doc.querySelector('button[aria-label*="post"]') ||
      doc.querySelector('.post-comment-button');

    return content;
  }

  extractRubricText(rubricElement) {
    const criteria = [];
    const criteriaElements = rubricElement.querySelectorAll('.rubric-criterion') ||
      rubricElement.querySelectorAll('[data-test-id="rubric-criterion"]');

    criteriaElements.forEach(criterion => {
      const name = criterion.querySelector('.criterion-name')?.textContent.trim();
      const description = criterion.querySelector('.criterion-description')?.textContent.trim();
      const points = criterion.querySelector('.criterion-points')?.textContent.trim();

      if (name) {
        let criterionText = name;
        if (points) criterionText += ` (${points} points)`;
        if (description) criterionText += `: ${description}`;
        criteria.push(criterionText);
      }
    });

    return criteria.join('\n');
  }

  async applyFeedback(target, text) {
    if (!target) return;

    // Google Classroom often uses contenteditable divs
    if (target.contentEditable === 'true') {
      target.innerHTML = text.replace(/\n/g, '<br>');
      target.dispatchEvent(new Event('input', {
        bubbles: true
      }));
      target.dispatchEvent(new Event('blur', {
        bubbles: true
      }));
    } else if (target.tagName === 'TEXTAREA') {
      target.value = text;
      target.dispatchEvent(new Event('input', {
        bubbles: true
      }));
      target.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    } else {
      // Try to find nested input element
      const input = target.querySelector('textarea') || target.querySelector('[contenteditable="true"]');
      if (input) {
        await this.applyFeedback(input, text);
        return;
      }
    }

    // Simulate user interaction
    target.focus();
    await this.delay(100);

    // Trigger Google's form validation
    const formEvent = new Event('change', {
      bubbles: true,
      cancelable: true
    });
    target.dispatchEvent(formEvent);

    await this.delay(100);
    target.blur();
  }

  async applyGrade(target, score) {
    if (!target) return;

    // Handle number input
    if (target.type === 'number' || target.tagName === 'INPUT') {
      target.value = score.toString();
      target.dispatchEvent(new Event('input', {
        bubbles: true
      }));
      target.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    } else {
      // Try to find nested input
      const input = target.querySelector('input[type="number"]') || target.querySelector('input');
      if (input) {
        await this.applyGrade(input, score);
        return;
      }
    }

    target.focus();
    await this.delay(100);
    target.blur();
  }

  async clickSubmit(button) {
    if (!button) return;

    // Google Classroom might need multiple clicks or confirmations
    button.click();
    await this.delay(500);

    // Look for confirmation dialog
    const confirmButton = document.querySelector('[data-test-id="confirm-return"]') ||
      document.querySelector('button[aria-label*="confirm"]') ||
      document.querySelector('.confirm-button');

    if (confirmButton) {
      confirmButton.click();
    }

    await this.delay(1000);
  }

  findElementsByLabel(doc, label) {
    const elements = [];
    const labelLower = label.toLowerCase();

    // Google Classroom uses aria-label extensively
    const ariaLabeled = doc.querySelectorAll(`[aria-label*="${label}"]`);
    ariaLabeled.forEach(el => elements.push(el));

    // Also check data-test-id attributes
    const testIds = doc.querySelectorAll(`[data-test-id*="${labelLower}"]`);
    testIds.forEach(el => elements.push(el));

    return elements;
  }

  findTextareaByContext(doc, context) {
    const contextLower = context.toLowerCase();

    // Check textareas first
    const textareas = doc.querySelectorAll('textarea');
    for (const textarea of textareas) {
      const ariaLabel = textarea.getAttribute('aria-label')?.toLowerCase() || '';
      const placeholder = textarea.placeholder?.toLowerCase() || '';

      if (ariaLabel.includes(contextLower) || placeholder.includes(contextLower)) {
        return textarea;
      }
    }

    // Check contenteditable divs
    const editableDivs = doc.querySelectorAll('div[contenteditable="true"]');
    for (const div of editableDivs) {
      const ariaLabel = div.getAttribute('aria-label')?.toLowerCase() || '';

      if (ariaLabel.includes(contextLower)) {
        return div;
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

  async waitForGoogleLoad() {
    // Google Classroom loads dynamically, wait for key elements
    await this.waitForElement('[role="main"]');
    await this.delay(1000); // Additional time for dynamic content
  }

  getFileType(url) {
    // Google Classroom uses specific URL patterns
    if (url.includes('/file/')) {
      // Try to extract from URL parameters
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const fileName = urlParams.get('filename') || '';
      const extension = fileName.split('.').pop()?.toLowerCase();

      const types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'rtf': 'application/rtf'
      };

      return types[extension] || 'unknown';
    }

    return 'unknown';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
