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
      targets: {}
    };

    // Extract discussion prompt/topic
    const topicElement = doc.querySelector('.discussion-topic .message') ||
      doc.querySelector('[data-testid="discussion-topic"] .user_content');
    if (topicElement) {
      content.prompt = topicElement.textContent.trim();
    }

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
}
