// D2L/Brightspace LMS Adapter
class D2LAdapter {
  constructor() {
    this.id = 'd2l';
    this.name = 'D2L Brightspace';
  }

  matches(url, doc) {
    return url.includes('brightspace.com') ||
      url.includes('desire2learn.com') ||
      url.includes('d2l.com') ||
      doc.querySelector('meta[name="generator"][content*="Desire2Learn"]') !== null ||
      doc.querySelector('.d2l-page') !== null ||
      doc.body?.classList.contains('d2l-body');
  }

  detectPageType(doc) {
    // Assignment submission/grading page
    if (doc.querySelector('.d2l-assignment-entity') ||
      doc.querySelector('.d2l-assignment-submission') ||
      doc.querySelector('.d2l-grading-panel') ||
      doc.querySelector('.d2l-file-uploader-container')) {
      return 'assignment_submission';
    }

    // Discussion forum
    if (doc.querySelector('.d2l-discussion-post') ||
      doc.querySelector('.d2l-forum-post') ||
      doc.querySelector('.d2l-discussions-entity')) {
      return 'discussion_thread';
    }

    // Gradebook
    if (doc.querySelector('.d2l-grades') ||
      doc.querySelector('.d2l-gradebook')) {
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

    // Extract assignment description
    const promptElement = doc.querySelector('.d2l-assignment-description') ||
      doc.querySelector('.d2l-assignment-instructions') ||
      doc.querySelector('.d2l-htmleditor-display');
    if (promptElement) {
      content.prompt = promptElement.textContent.trim();
    }

    // Extract student submission
    const submissionElement = doc.querySelector('.d2l-submission-content') ||
      doc.querySelector('.d2l-file-uploader-list') ||
      doc.querySelector('.d2l-assignment-submission-text');
    if (submissionElement) {
      content.studentText = submissionElement.textContent.trim();
    }

    // Extract student information
    const studentElement = doc.querySelector('.d2l-user-name') ||
      doc.querySelector('.d2l-student-name') ||
      doc.querySelector('d2l-navigation-main-header .d2l-navigation-s-main-concept-text');
    if (studentElement) {
      content.student = {
        name: studentElement.textContent.trim()
      };
    }

    // Extract file submissions
    const fileLinks = doc.querySelectorAll('.d2l-file-uploader-list a') ||
      doc.querySelectorAll('.d2l-attachment-link');
    if (fileLinks.length > 0) {
      content.files = Array.from(fileLinks).map(link => ({
        name: link.textContent.trim(),
        url: link.href,
        type: this.getFileType(link.href)
      }));
    }

    // Extract rubric
    const rubricElement = doc.querySelector('.d2l-rubric') ||
      doc.querySelector('.d2l-assignment-rubric');
    if (rubricElement) {
      content.rubric = this.extractRubricText(rubricElement);
    }

    // Find target elements for feedback and grading
    content.targets.feedbackBox = doc.querySelector('.d2l-htmleditor') ||
      doc.querySelector('.d2l-feedback-text') ||
      doc.querySelector('.d2l-textinput textarea');

    content.targets.gradeInput = doc.querySelector('.d2l-grade-input') ||
      doc.querySelector('.d2l-input-number') ||
      doc.querySelector('input[aria-label*="grade"]');

    content.targets.submitButton = doc.querySelector('.d2l-button-primary') ||
      doc.querySelector('d2l-button-subtle[text="Publish"]') ||
      doc.querySelector('.d2l-save-grade');

    return content;
  }

  async extractDiscussionThread(doc) {
    const content = {
      kind: 'discussion',
      targets: {}
    };

    // Extract discussion topic
    const topicElement = doc.querySelector('.d2l-discussion-post-body') ||
      doc.querySelector('.d2l-topic-description');
    if (topicElement) {
      content.prompt = topicElement.textContent.trim();
    }

    // Extract student post
    const selectedPost = doc.querySelector('.d2l-discussion-post.selected .d2l-discussion-post-body') ||
      doc.querySelector('.d2l-discussion-post:first-child .d2l-discussion-post-body');

    if (selectedPost) {
      content.studentText = selectedPost.textContent.trim();

      // Get author information
      const authorElement = selectedPost.closest('.d2l-discussion-post')
        ?.querySelector('.d2l-discussion-post-author');
      if (authorElement) {
        content.student = {
          name: authorElement.textContent.trim()
        };
      }
    }

    // Find reply elements
    content.targets.replyBox = doc.querySelector('.d2l-htmleditor') ||
      doc.querySelector('.d2l-discussion-reply-editor');

    content.targets.submitButton = doc.querySelector('d2l-button-subtle[text="Post"]') ||
      doc.querySelector('.d2l-button-primary');

    return content;
  }

  extractRubricText(rubricElement) {
    const criteria = [];
    const criteriaElements = rubricElement.querySelectorAll('.d2l-rubric-criterion');

    criteriaElements.forEach(criterion => {
      const name = criterion.querySelector('.d2l-rubric-criterion-name')?.textContent.trim();
      const description = criterion.querySelector('.d2l-rubric-criterion-description')?.textContent.trim();

      if (name) {
        criteria.push(`${name}: ${description || ''}`);
      }
    });

    return criteria.join('\n');
  }

  async applyFeedback(target, text) {
    if (!target) return;

    // Handle D2L's HTML editor
    if (target.classList.contains('d2l-htmleditor') || target.closest('.d2l-htmleditor')) {
      const iframe = target.querySelector('iframe') || target.closest('.d2l-htmleditor').querySelector('iframe');
      if (iframe) {
        try {
          const frameDoc = iframe.contentDocument;
          if (frameDoc && frameDoc.body) {
            frameDoc.body.innerHTML = text.replace(/\n/g, '<br>');
            // Trigger D2L editor events
            frameDoc.body.dispatchEvent(new Event('input', {
              bubbles: true
            }));
          }
        } catch (e) {
          console.warn('Cannot access D2L editor iframe:', e);
        }
      }
    } else if (target.tagName === 'TEXTAREA') {
      target.value = text;
      target.dispatchEvent(new Event('input', {
        bubbles: true
      }));
      target.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    }

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

    // Trigger D2L validation
    target.focus();
    await this.delay(100);
    target.blur();
  }

  async clickSubmit(button) {
    if (!button) return;

    button.click();
    await this.delay(1000);
  }

  findElementsByLabel(doc, label) {
    const elements = [];

    // D2L uses various labeling methods
    const labeled = doc.querySelectorAll(`[aria-label*="${label}"], [title*="${label}"]`);
    labeled.forEach(el => elements.push(el));

    return elements;
  }

  findTextareaByContext(doc, context) {
    const textareas = doc.querySelectorAll('textarea');
    const contextLower = context.toLowerCase();

    for (const textarea of textareas) {
      const ariaLabel = textarea.getAttribute('aria-label')?.toLowerCase() || '';
      const title = textarea.getAttribute('title')?.toLowerCase() || '';
      const id = textarea.id?.toLowerCase() || '';

      if (ariaLabel.includes(contextLower) ||
        title.includes(contextLower) ||
        id.includes(contextLower)) {
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
    const extension = url.split('.').pop()?.toLowerCase();
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
