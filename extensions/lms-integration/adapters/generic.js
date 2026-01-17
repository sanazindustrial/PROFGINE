// Generic LMS Adapter (Fallback for unrecognized platforms)
class GenericAdapter {
  constructor() {
    this.id = 'generic';
    this.name = 'Generic LMS';
  }

  matches(url, doc) {
    // Generic adapter always matches as fallback
    return true;
  }

  detectPageType(doc) {
    // Use heuristics to detect page type
    const bodyText = doc.body.textContent.toLowerCase();
    const title = doc.title.toLowerCase();

    // Look for assignment/submission keywords
    if (bodyText.includes('submission') ||
      bodyText.includes('assignment') ||
      bodyText.includes('grade') ||
      title.includes('assignment') ||
      doc.querySelector('textarea[placeholder*="feedback"]') ||
      doc.querySelector('input[type="number"][placeholder*="grade"]')) {
      return 'assignment_submission';
    }

    // Look for discussion keywords
    if (bodyText.includes('discussion') ||
      bodyText.includes('forum') ||
      bodyText.includes('reply') ||
      title.includes('discussion') ||
      doc.querySelector('textarea[placeholder*="reply"]')) {
      return 'discussion_thread';
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

    // If we can't determine the type, show manual selection UI
    return this.showManualSelection(doc);
  }

  async extractAssignmentSubmission(doc) {
    const content = {
      kind: 'submission',
      targets: {}
    };

    // Try to find prompt/instructions using common patterns
    const promptSelectors = [
      '.assignment-description',
      '.instructions',
      '.prompt',
      '.description',
      '[class*="instruction"]',
      '[class*="description"]',
      '[class*="prompt"]'
    ];

    for (const selector of promptSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.trim().length > 50) {
        content.prompt = element.textContent.trim();
        break;
      }
    }

    // Try to find student submission text
    const submissionSelectors = [
      '.submission-content',
      '.student-response',
      '.answer',
      '[class*="submission"]',
      '[class*="response"]',
      '.content:not(.instructor)'
    ];

    for (const selector of submissionSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.trim().length > 20) {
        content.studentText = element.textContent.trim();
        break;
      }
    }

    // Look for student name in common locations
    const nameSelectors = [
      '.student-name',
      '.author',
      '.username',
      '[class*="student"][class*="name"]',
      'h1, h2, h3'
    ];

    for (const selector of nameSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text.length < 100 && /^[A-Za-z\s]+$/.test(text)) {
          content.student = {
            name: text
          };
          break;
        }
      }
    }

    // Find feedback textarea using multiple strategies
    content.targets.feedbackBox = this.findTextareaByContext(doc, 'feedback') ||
      this.findTextareaByContext(doc, 'comment') ||
      doc.querySelector('textarea:not([readonly])');

    // Find grade input
    content.targets.gradeInput = this.findInputByContext(doc, 'grade') ||
      this.findInputByContext(doc, 'score') ||
      doc.querySelector('input[type="number"]') ||
      doc.querySelector('input[type="text"][placeholder*="grade"]');

    // Find submit button
    content.targets.submitButton = this.findButtonByText(doc, ['save', 'submit', 'update']) ||
      doc.querySelector('button[type="submit"]') ||
      doc.querySelector('input[type="submit"]');

    return content;
  }

  async extractDiscussionThread(doc) {
    const content = {
      kind: 'discussion',
      targets: {}
    };

    // Look for discussion topic/prompt
    const topicSelectors = [
      '.discussion-topic',
      '.topic',
      '.thread-title',
      'h1',
      'h2',
      '.original-post'
    ];

    for (const selector of topicSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.trim().length > 30) {
        content.prompt = element.textContent.trim();
        break;
      }
    }

    // Look for student post content
    const postSelectors = [
      '.post-content',
      '.message',
      '.reply-content',
      '[class*="post"][class*="content"]',
      '.discussion-entry'
    ];

    for (const selector of postSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.trim().length > 10) {
        content.studentText = element.textContent.trim();

        // Try to find author from the same post
        const authorElement = element.closest('.post, .entry, .message')
          ?.querySelector('.author, .username, .name');
        if (authorElement) {
          content.student = {
            name: authorElement.textContent.trim()
          };
        }
        break;
      }
    }

    // Find reply box
    content.targets.replyBox = this.findTextareaByContext(doc, 'reply') ||
      this.findTextareaByContext(doc, 'response') ||
      doc.querySelector('textarea');

    // Find submit button for reply
    content.targets.submitButton = this.findButtonByText(doc, ['reply', 'post', 'send', 'submit']) ||
      doc.querySelector('button[type="submit"]');

    return content;
  }

  showManualSelection(doc) {
    // Create an overlay for manual content selection
    const overlay = document.createElement('div');
    overlay.id = 'profgini-manual-selection';
    overlay.innerHTML = `
      <div class="manual-selection-panel">
        <h3>Manual Content Selection</h3>
        <p>Professor GENIE couldn't automatically detect the page content. Please help by selecting:</p>
        
        <div class="selection-step">
          <button id="select-prompt">1. Select Assignment Prompt/Instructions</button>
          <div id="prompt-preview" class="preview"></div>
        </div>
        
        <div class="selection-step">
          <button id="select-submission">2. Select Student Submission Text</button>
          <div id="submission-preview" class="preview"></div>
        </div>
        
        <div class="selection-step">
          <button id="select-feedback-box">3. Select Feedback Input Area</button>
          <div id="feedback-box-preview" class="preview"></div>
        </div>
        
        <button id="manual-done" class="primary">Continue with Selected Content</button>
        <button id="manual-cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(overlay);

    return new Promise((resolve) => {
      const content = {
        kind: 'submission',
        targets: {},
        manual: true
      };

      let isSelecting = null;

      // Handle selection buttons
      document.getElementById('select-prompt').addEventListener('click', () => {
        isSelecting = 'prompt';
        this.startElementSelection(doc, (element) => {
          content.prompt = element.textContent.trim();
          document.getElementById('prompt-preview').textContent = content.prompt.substring(0, 100) + '...';
          isSelecting = null;
        });
      });

      document.getElementById('select-submission').addEventListener('click', () => {
        isSelecting = 'submission';
        this.startElementSelection(doc, (element) => {
          content.studentText = element.textContent.trim();
          document.getElementById('submission-preview').textContent = content.studentText.substring(0, 100) + '...';
          isSelecting = null;
        });
      });

      document.getElementById('select-feedback-box').addEventListener('click', () => {
        isSelecting = 'feedbackBox';
        this.startElementSelection(doc, (element) => {
          content.targets.feedbackBox = element;
          document.getElementById('feedback-box-preview').textContent = `Selected: ${element.tagName} element`;
          isSelecting = null;
        });
      });

      document.getElementById('manual-done').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(content);
      });

      document.getElementById('manual-cancel').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  startElementSelection(doc, callback) {
    let selectedElement = null;
    const originalOutline = new Map();

    const handleMouseOver = (e) => {
      if (selectedElement) {
        selectedElement.style.outline = originalOutline.get(selectedElement) || '';
      }
      selectedElement = e.target;
      originalOutline.set(selectedElement, selectedElement.style.outline);
      selectedElement.style.outline = '2px solid #007cba';
    };

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Clean up event listeners
      doc.removeEventListener('mouseover', handleMouseOver);
      doc.removeEventListener('click', handleClick);

      // Reset outline
      if (selectedElement) {
        selectedElement.style.outline = originalOutline.get(selectedElement) || '';
      }

      callback(selectedElement);
    };

    doc.addEventListener('mouseover', handleMouseOver);
    doc.addEventListener('click', handleClick);
  }

  async applyFeedback(target, text) {
    if (!target) return;

    if (target.tagName === 'TEXTAREA') {
      target.value = text;
    } else if (target.contentEditable === 'true') {
      target.innerHTML = text.replace(/\n/g, '<br>');
    } else if (target.tagName === 'INPUT' && target.type === 'text') {
      target.value = text;
    }

    // Dispatch common events
    target.dispatchEvent(new Event('input', {
      bubbles: true
    }));
    target.dispatchEvent(new Event('change', {
      bubbles: true
    }));
    target.dispatchEvent(new Event('keyup', {
      bubbles: true
    }));

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

        // Also check for nested inputs
        const nestedInput = labelEl.querySelector('input, textarea, select');
        if (nestedInput) elements.push(nestedInput);
      }
    });

    return elements;
  }

  findTextareaByContext(doc, context) {
    const textareas = doc.querySelectorAll('textarea');

    for (const textarea of textareas) {
      const id = textarea.id?.toLowerCase() || '';
      const name = textarea.name?.toLowerCase() || '';
      const placeholder = textarea.placeholder?.toLowerCase() || '';
      const ariaLabel = textarea.getAttribute('aria-label')?.toLowerCase() || '';

      const contextLower = context.toLowerCase();

      if (id.includes(contextLower) ||
        name.includes(contextLower) ||
        placeholder.includes(contextLower) ||
        ariaLabel.includes(contextLower)) {
        return textarea;
      }

      // Check nearby labels
      const label = doc.querySelector(`label[for="${textarea.id}"]`);
      if (label && label.textContent.toLowerCase().includes(contextLower)) {
        return textarea;
      }
    }

    return null;
  }

  findInputByContext(doc, context) {
    const inputs = doc.querySelectorAll('input[type="number"], input[type="text"]');

    for (const input of inputs) {
      const id = input.id?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      const placeholder = input.placeholder?.toLowerCase() || '';
      const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';

      const contextLower = context.toLowerCase();

      if (id.includes(contextLower) ||
        name.includes(contextLower) ||
        placeholder.includes(contextLower) ||
        ariaLabel.includes(contextLower)) {
        return input;
      }

      // Check nearby labels
      const label = doc.querySelector(`label[for="${input.id}"]`);
      if (label && label.textContent.toLowerCase().includes(contextLower)) {
        return input;
      }
    }

    return null;
  }

  findButtonByText(doc, texts) {
    const buttons = doc.querySelectorAll('button, input[type="submit"], input[type="button"]');

    for (const button of buttons) {
      const buttonText = (button.textContent || button.value || '').toLowerCase();

      for (const text of texts) {
        if (buttonText.includes(text.toLowerCase())) {
          return button;
        }
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
