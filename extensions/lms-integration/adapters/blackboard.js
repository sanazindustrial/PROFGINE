// Blackboard LMS Adapter
class BlackboardAdapter {
  constructor() {
    this.id = 'blackboard';
    this.name = 'Blackboard';
  }

  matches(url, doc) {
    return url.includes('blackboard.com') ||
      url.includes('bblearn') ||
      doc.querySelector('meta[name="generator"][content*="Blackboard"]') !== null ||
      doc.querySelector('.bb-base-template') !== null ||
      doc.body?.classList.contains('bb-backdrop');
  }

  detectPageType(doc) {
    // Assignment grading page
    if (doc.querySelector('.gradeStep') ||
      doc.querySelector('.assignment-submission') ||
      doc.querySelector('#grading-panel') ||
      doc.querySelector('.bb-assignment-body')) {
      return 'assignment_submission';
    }

    // Discussion board
    if (doc.querySelector('.forum') ||
      doc.querySelector('.discussionboard') ||
      doc.querySelector('.bb-discussion-post')) {
      return 'discussion_thread';
    }

    // Grade center
    if (doc.querySelector('.gradebook') ||
      doc.querySelector('#gradeCenter')) {
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

    // Extract assignment instructions
    const promptElement = doc.querySelector('.assignment-instructions') ||
      doc.querySelector('.bb-assignment-instructions') ||
      doc.querySelector('.vtbegenerated');
    if (promptElement) {
      content.prompt = promptElement.textContent.trim();
    }

    // Extract student submission
    const submissionElement = doc.querySelector('.submissionText') ||
      doc.querySelector('.student-submission') ||
      doc.querySelector('.bb-content-area');
    if (submissionElement) {
      content.studentText = submissionElement.textContent.trim();
    }

    // Extract student information
    const studentElement = doc.querySelector('.student-name') ||
      doc.querySelector('.bb-user-name') ||
      doc.querySelector('h3 .username');
    if (studentElement) {
      content.student = {
        name: studentElement.textContent.trim()
      };
    }

    // Extract file submissions
    const fileLinks = doc.querySelectorAll('.attachments a') ||
      doc.querySelectorAll('.submission-files a');
    if (fileLinks.length > 0) {
      content.files = Array.from(fileLinks).map(link => ({
        name: link.textContent.trim(),
        url: link.href,
        type: this.getFileType(link.href)
      }));
    }

    // Extract rubric
    const rubricElement = doc.querySelector('.rubric') ||
      doc.querySelector('.bb-rubric');
    if (rubricElement) {
      content.rubric = this.extractRubricText(rubricElement);
    }

    // Find target elements
    content.targets.feedbackBox = doc.querySelector('#feedbacktext') ||
      doc.querySelector('.feedback-text') ||
      doc.querySelector('#comments');

    content.targets.gradeInput = doc.querySelector('#grade') ||
      doc.querySelector('.grade-input') ||
      doc.querySelector('input[name="grade"]');

    content.targets.submitButton = doc.querySelector('#submitGrade') ||
      doc.querySelector('.submit-grade') ||
      doc.querySelector('input[value="Submit"]');

    return content;
  }

  async extractDiscussionThread(doc) {
    const content = {
      kind: 'discussion',
      targets: {}
    };

    // Extract discussion prompt
    const topicElement = doc.querySelector('.forum-description') ||
      doc.querySelector('.bb-discussion-topic');
    if (topicElement) {
      content.prompt = topicElement.textContent.trim();
    }

    // Extract student post
    const selectedPost = doc.querySelector('.forum-post.selected .post-content') ||
      doc.querySelector('.bb-discussion-post:first-child .post-body');

    if (selectedPost) {
      content.studentText = selectedPost.textContent.trim();

      // Get author information
      const authorElement = selectedPost.closest('.forum-post, .bb-discussion-post')
        ?.querySelector('.author, .post-author');
      if (authorElement) {
        content.student = {
          name: authorElement.textContent.trim()
        };
      }
    }

    // Find reply elements
    content.targets.replyBox = doc.querySelector('#reply-editor') ||
      doc.querySelector('.forum-reply-editor') ||
      doc.querySelector('#discussion-reply');

    content.targets.submitButton = doc.querySelector('#submit-reply') ||
      doc.querySelector('.submit-post');

    return content;
  }

  extractRubricText(rubricElement) {
    const criteria = [];
    const criteriaElements = rubricElement.querySelectorAll('.rubric-criterion');

    criteriaElements.forEach(criterion => {
      const name = criterion.querySelector('.criterion-name')?.textContent.trim();
      const description = criterion.querySelector('.criterion-description')?.textContent.trim();

      if (name) {
        criteria.push(`${name}: ${description || ''}`);
      }
    });

    return criteria.join('\n');
  }

  async applyFeedback(target, text) {
    if (!target) return;

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
    }

    // Handle Blackboard's rich text editor
    const iframe = target.querySelector('iframe');
    if (iframe) {
      try {
        const frameDoc = iframe.contentDocument;
        if (frameDoc && frameDoc.body) {
          frameDoc.body.innerHTML = text.replace(/\n/g, '<br>');
        }
      } catch (e) {
        console.warn('Cannot access Blackboard editor iframe:', e);
      }
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
    const labels = doc.querySelectorAll('label');

    labels.forEach(labelEl => {
      if (labelEl.textContent.toLowerCase().includes(label.toLowerCase())) {
        const forAttr = labelEl.getAttribute('for');
        if (forAttr) {
          const input = doc.getElementById(forAttr);
          if (input) elements.push(input);
        }
      }
    });

    return elements;
  }

  findTextareaByContext(doc, context) {
    const textareas = doc.querySelectorAll('textarea');
    const contextLower = context.toLowerCase();

    for (const textarea of textareas) {
      const id = textarea.id?.toLowerCase() || '';
      const name = textarea.name?.toLowerCase() || '';
      const placeholder = textarea.placeholder?.toLowerCase() || '';

      if (id.includes(contextLower) ||
        name.includes(contextLower) ||
        placeholder.includes(contextLower)) {
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
