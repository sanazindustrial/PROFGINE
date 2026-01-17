// Moodle LMS Adapter
class MoodleAdapter {
  constructor() {
    this.id = 'moodle';
    this.name = 'Moodle';
  }

  matches(url, doc) {
    return url.includes('moodle') ||
      doc.querySelector('meta[name="generator"][content*="Moodle"]') !== null ||
      doc.querySelector('body.path-mod-assign') !== null ||
      doc.querySelector('.moodle-footer') !== null ||
      doc.body?.classList.contains('theme-boost') ||
      doc.body?.classList.contains('theme-clean');
  }

  detectPageType(doc) {
    // Assignment grading page
    if (doc.body?.classList.contains('path-mod-assign-view') ||
      doc.querySelector('.assignsubmission') ||
      doc.querySelector('.grading-panel') ||
      doc.querySelector('#assign-grading-form')) {
      return 'assignment_submission';
    }

    // Forum discussion
    if (doc.body?.classList.contains('path-mod-forum') ||
      doc.querySelector('.forumpost') ||
      doc.querySelector('.forum-discussion') ||
      doc.querySelector('.path-mod-forum')) {
      return 'discussion_thread';
    }

    // Gradebook
    if (doc.body?.classList.contains('path-grade') ||
      doc.querySelector('.gradereport') ||
      doc.querySelector('#gradebook')) {
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

    // Extract assignment description/prompt
    const promptElement = doc.querySelector('.assignment-description .no-overflow') ||
      doc.querySelector('.assignmentintro') ||
      doc.querySelector('.description .mod_introbox');
    if (promptElement) {
      content.prompt = promptElement.textContent.trim();
    }

    // Extract student submission
    const submissionElement = doc.querySelector('.assignsubmission_file .fileupload') ||
      doc.querySelector('.assignsubmission_onlinetext .text_to_html') ||
      doc.querySelector('.submission .submissionstatustable');
    if (submissionElement) {
      content.studentText = submissionElement.textContent.trim();
    }

    // Extract student information
    const studentElement = doc.querySelector('.user-grade-info .fullname') ||
      doc.querySelector('.submissiongrading .fullname') ||
      doc.querySelector('h3.username');
    if (studentElement) {
      content.student = {
        name: studentElement.textContent.trim()
      };
    }

    // Extract file submissions
    const fileLinks = doc.querySelectorAll('.assignsubmission_file .submissionfilearea a');
    if (fileLinks.length > 0) {
      content.files = Array.from(fileLinks).map(link => ({
        name: link.textContent.trim(),
        url: link.href,
        type: this.getFileType(link.href)
      }));
    }

    // Extract rubric if available
    const rubricElement = doc.querySelector('.gradingform_rubric') ||
      doc.querySelector('.rubric-container');
    if (rubricElement) {
      content.rubric = this.extractRubricText(rubricElement);
    }

    // Find target elements
    content.targets.feedbackBox = doc.querySelector('#id_assignfeedbackcomments_editor') ||
      doc.querySelector('.feedback-comments textarea') ||
      doc.querySelector('#id_feedback');

    content.targets.gradeInput = doc.querySelector('#id_grade') ||
      doc.querySelector('.grading input[type="text"]') ||
      doc.querySelector('.grade-input');

    content.targets.submitButton = doc.querySelector('#id_submitbutton') ||
      doc.querySelector('.save-grade') ||
      doc.querySelector('input[value="Save changes"]');

    return content;
  }

  async extractDiscussionThread(doc) {
    const content = {
      kind: 'discussion',
      targets: {}
    };

    // Extract forum topic/prompt
    const topicElement = doc.querySelector('.forumpost .content') ||
      doc.querySelector('.discussion-topic .postbody');
    if (topicElement) {
      content.prompt = topicElement.textContent.trim();
    }

    // Extract student post (focus on selected or first post)
    const selectedPost = doc.querySelector('.forumpost.selected .content') ||
      doc.querySelector('.forumpost:first-child .content') ||
      doc.querySelector('.postbody');

    if (selectedPost) {
      content.studentText = selectedPost.textContent.trim();

      // Get author information
      const authorElement = selectedPost.closest('.forumpost')
        ?.querySelector('.author .fullname') ||
        selectedPost.closest('.forumpost')
        ?.querySelector('.username');
      if (authorElement) {
        content.student = {
          name: authorElement.textContent.trim()
        };
      }
    }

    // Find reply elements
    content.targets.replyBox = doc.querySelector('#id_message') ||
      doc.querySelector('.forum-reply-form textarea') ||
      doc.querySelector('#reply-form textarea');

    content.targets.submitButton = doc.querySelector('#id_submitbutton') ||
      doc.querySelector('.forum-reply-submit') ||
      doc.querySelector('input[value="Post to forum"]');

    return content;
  }

  extractRubricText(rubricElement) {
    const criteria = [];
    const criteriaElements = rubricElement.querySelectorAll('.criterion');

    criteriaElements.forEach(criterion => {
      const name = criterion.querySelector('.criterionname')?.textContent.trim();
      const description = criterion.querySelector('.criteriondescription')?.textContent.trim();

      if (name) {
        criteria.push(`${name}: ${description || ''}`);
      }
    });

    return criteria.join('\n');
  }

  async applyFeedback(target, text) {
    if (!target) return;

    // Handle Moodle's rich text editor
    if (target.classList.contains('editor') || target.querySelector('.editor')) {
      const editorFrame = target.querySelector('iframe');
      if (editorFrame) {
        try {
          const frameDoc = editorFrame.contentDocument;
          if (frameDoc) {
            frameDoc.body.innerHTML = text.replace(/\n/g, '<br>');
          }
        } catch (e) {
          console.warn('Cannot access editor iframe:', e);
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

    // Trigger Moodle form validation
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

    // Trigger Moodle grade validation
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
    for (const textarea of textareas) {
      const id = textarea.id;
      const name = textarea.name;
      const placeholder = textarea.placeholder;

      if ((id && id.toLowerCase().includes(context.toLowerCase())) ||
        (name && name.toLowerCase().includes(context.toLowerCase())) ||
        (placeholder && placeholder.toLowerCase().includes(context.toLowerCase()))) {
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
