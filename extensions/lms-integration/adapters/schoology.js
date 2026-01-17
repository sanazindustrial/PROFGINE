// Schoology LMS Adapter
class SchoologyAdapter {
  constructor() {
    this.id = 'schoology';
    this.name = 'Schoology';
  }

  matches(url, doc) {
    return url.includes('schoology.com') ||
      doc.querySelector('meta[name="application-name"][content="Schoology"]') !== null ||
      doc.querySelector('.sExtApp-wrapper') !== null ||
      doc.body?.classList.contains('sBody');
  }

  detectPageType(doc) {
    // Assignment submission page
    if (doc.querySelector('.assignment-submission') ||
      doc.querySelector('.sAssignmentSubmission') ||
      doc.querySelector('.submission-details') ||
      doc.querySelector('#assignment-submission-form')) {
      return 'assignment_submission';
    }

    // Discussion forum
    if (doc.querySelector('.discussion-post') ||
      doc.querySelector('.sDiscussionPost') ||
      doc.querySelector('.forum-post')) {
      return 'discussion_thread';
    }

    // Gradebook
    if (doc.querySelector('.gradebook') ||
      doc.querySelector('.sGradebook') ||
      doc.querySelector('#gradebook-wrapper')) {
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
      doc.querySelector('.sAssignmentInstructions') ||
      doc.querySelector('.assignment-description');
    if (promptElement) {
      content.prompt = promptElement.textContent.trim();
    }

    // Extract student submission
    const submissionElement = doc.querySelector('.submission-text') ||
      doc.querySelector('.student-submission') ||
      doc.querySelector('.submission-content');
    if (submissionElement) {
      content.studentText = submissionElement.textContent.trim();
    }

    // Extract student information
    const studentElement = doc.querySelector('.student-name') ||
      doc.querySelector('.sStudentName') ||
      doc.querySelector('.submission-author');
    if (studentElement) {
      content.student = {
        name: studentElement.textContent.trim()
      };
    }

    // Extract file submissions
    const fileLinks = doc.querySelectorAll('.attachment-link') ||
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
      doc.querySelector('.sRubric');
    if (rubricElement) {
      content.rubric = this.extractRubricText(rubricElement);
    }

    // Find target elements
    content.targets.feedbackBox = doc.querySelector('.feedback-text') ||
      doc.querySelector('#teacher-comments') ||
      doc.querySelector('.grading-comment');

    content.targets.gradeInput = doc.querySelector('.grade-input') ||
      doc.querySelector('#grade') ||
      doc.querySelector('input[name="grade"]');

    content.targets.submitButton = doc.querySelector('.submit-grade') ||
      doc.querySelector('#submit-grading') ||
      doc.querySelector('input[value="Save Grade"]');

    return content;
  }

  async extractDiscussionThread(doc) {
    const content = {
      kind: 'discussion',
      targets: {}
    };

    // Extract discussion topic
    const topicElement = doc.querySelector('.discussion-description') ||
      doc.querySelector('.forum-description');
    if (topicElement) {
      content.prompt = topicElement.textContent.trim();
    }

    // Extract student post
    const selectedPost = doc.querySelector('.discussion-post.selected .post-body') ||
      doc.querySelector('.sDiscussionPost:first-child .post-content');

    if (selectedPost) {
      content.studentText = selectedPost.textContent.trim();

      // Get author information
      const authorElement = selectedPost.closest('.discussion-post, .sDiscussionPost')
        ?.querySelector('.post-author, .author-name');
      if (authorElement) {
        content.student = {
          name: authorElement.textContent.trim()
        };
      }
    }

    // Find reply elements
    content.targets.replyBox = doc.querySelector('.reply-editor') ||
      doc.querySelector('#discussion-reply') ||
      doc.querySelector('.forum-reply-text');

    content.targets.submitButton = doc.querySelector('.submit-reply') ||
      doc.querySelector('#post-reply');

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
      const className = textarea.className?.toLowerCase() || '';

      if (id.includes(contextLower) ||
        name.includes(contextLower) ||
        className.includes(contextLower)) {
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
