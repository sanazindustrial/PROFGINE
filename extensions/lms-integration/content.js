// ProfGini LMS Integration - Content Script
// Handles page detection, content extraction, and grading application

class ProfGiniLMSIntegration {
  constructor() {
    this.adapters = new Map();
    this.currentAdapter = null;
    this.overlay = null;
    this.config = null;
    this.extractedContent = null;

    this.initializeAdapters();
    this.loadConfig();
    this.init();
  }

  async init() {
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, {
            once: true
          });
        }
      });
    }

    // Detect LMS and page type
    this.detectLMS();

    if (this.currentAdapter) {
      const pageType = this.currentAdapter.detectPageType(document);

      if (pageType !== 'unknown') {
        console.log(`ProfGini: Detected ${this.currentAdapter.id} - ${pageType}`);
        await this.initializeOverlay(pageType);

        // Auto-extract if enabled
        if (this.config?.preferences?.autoDetect) {
          await this.extractContent();
        }
      }
    }
  }

  initializeAdapters() {
    // Import and register all LMS adapters
    this.adapters.set('canvas', new CanvasAdapter());
    this.adapters.set('moodle', new MoodleAdapter());
    this.adapters.set('d2l', new D2LAdapter());
    this.adapters.set('blackboard', new BlackboardAdapter());
    this.adapters.set('schoology', new SchoologyAdapter());
    this.adapters.set('google_classroom', new GoogleClassroomAdapter());
    this.adapters.set('generic', new GenericAdapter());
  }

  detectLMS() {
    for (const [id, adapter] of this.adapters) {
      if (adapter.matches(window.location.href, document)) {
        this.currentAdapter = adapter;
        console.log(`ProfGini: Detected LMS - ${id}`);
        return;
      }
    }

    // Fallback to generic adapter
    this.currentAdapter = this.adapters.get('generic');
    console.log('ProfGini: Using generic adapter');
  }

  async loadConfig() {
    try {
      const result = await chrome.storage.local.get(['profgini_config']);
      this.config = result.profgini_config || {
        apiBaseUrl: 'http://localhost:3000',
        preferences: {
          autoDetect: true,
          autoGenerate: false,
          defaultTone: 'supportive',
          confirmBeforeSubmit: true
        }
      };
    } catch (error) {
      console.error('ProfGini: Error loading config:', error);
    }
  }

  async initializeOverlay(pageType) {
    // Create floating overlay UI
    this.overlay = document.createElement('div');
    this.overlay.id = 'profgini-overlay';
    this.overlay.className = 'profgini-overlay';

    this.overlay.innerHTML = `
      <div class="profgini-panel">
        <div class="profgini-header">
          <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="ProfGini" class="profgini-logo">
          <h3>AI Grading Assistant</h3>
          <button class="profgini-close" id="profgini-close">×</button>
        </div>
        
        <div class="profgini-content">
          <div class="profgini-status" id="profgini-status">
            <span class="status-text">Ready to assist with ${pageType.replace('_', ' ')}</span>
          </div>
          
          <div class="profgini-actions">
            <button class="profgini-btn primary" id="profgini-extract">
              📊 Extract Content
            </button>
            <button class="profgini-btn secondary" id="profgini-generate" disabled>
              🤖 Generate Feedback
            </button>
            <button class="profgini-btn success" id="profgini-apply" disabled>
              ✅ Apply to LMS
            </button>
            <button class="profgini-btn warning" id="profgini-submit" disabled>
              📤 Submit Grade
            </button>
          </div>
          
          <div class="profgini-settings">
            <label>
              Tone:
              <select id="profgini-tone">
                <option value="supportive">Supportive</option>
                <option value="direct">Direct</option>
                <option value="detailed">Detailed</option>
              </select>
            </label>
          </div>
          
          <div class="profgini-preview" id="profgini-preview" style="display: none;">
            <h4>Generated Feedback:</h4>
            <div class="feedback-content" id="feedback-content"></div>
            <div class="grade-info" id="grade-info"></div>
          </div>
          
          <div class="profgini-extracted" id="profgini-extracted" style="display: none;">
            <h4>Extracted Content:</h4>
            <div class="extracted-info"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Close overlay
    document.getElementById('profgini-close').addEventListener('click', () => {
      this.overlay.style.display = 'none';
    });

    // Extract content
    document.getElementById('profgini-extract').addEventListener('click', () => {
      this.extractContent();
    });

    // Generate feedback
    document.getElementById('profgini-generate').addEventListener('click', () => {
      this.generateFeedback();
    });

    // Apply to LMS
    document.getElementById('profgini-apply').addEventListener('click', () => {
      this.applyToLMS();
    });

    // Submit grade
    document.getElementById('profgini-submit').addEventListener('click', () => {
      this.submitGrade();
    });

    // Make overlay draggable
    this.makeDraggable();
  }

  async extractContent() {
    try {
      this.updateStatus('Extracting content...', 'loading');

      this.extractedContent = await this.currentAdapter.extractContent(document);

      if (this.extractedContent) {
        this.displayExtractedContent();
        document.getElementById('profgini-generate').disabled = false;

        // Auto-generate if enabled
        if (this.config?.preferences?.autoGenerate) {
          setTimeout(() => this.generateFeedback(), 500);
        }

        this.updateStatus('Content extracted successfully', 'success');
      } else {
        this.updateStatus('Could not extract content from this page', 'error');
      }
    } catch (error) {
      console.error('ProfGini: Extraction error:', error);
      this.updateStatus('Extraction failed: ' + error.message, 'error');
    }
  }

  displayExtractedContent() {
    const extractedDiv = document.getElementById('profgini-extracted');
    const infoDiv = extractedDiv.querySelector('.extracted-info');

    let html = '';

    if (this.extractedContent.student?.name) {
      html += `<p><strong>Student:</strong> ${this.extractedContent.student.name}</p>`;
    }

    if (this.extractedContent.prompt) {
      html += `<p><strong>Assignment:</strong> ${this.extractedContent.prompt.substring(0, 100)}...</p>`;
    }

    if (this.extractedContent.studentText) {
      html += `<p><strong>Submission:</strong> ${this.extractedContent.studentText.substring(0, 150)}...</p>`;
    }

    if (this.extractedContent.files?.length > 0) {
      html += `<p><strong>Files:</strong> ${this.extractedContent.files.map(f => f.name).join(', ')}</p>`;
    }

    infoDiv.innerHTML = html;
    extractedDiv.style.display = 'block';
  }

  async generateFeedback() {
    if (!this.extractedContent) {
      this.updateStatus('No content to grade', 'error');
      return;
    }

    try {
      this.updateStatus('Generating AI feedback...', 'loading');

      const tone = document.getElementById('profgini-tone').value;
      const gradeRequest = {
        kind: this.extractedContent.kind,
        lms: this.currentAdapter.id,
        courseId: this.extractedContent.courseId,
        assignmentId: this.extractedContent.assignmentId,
        studentId: this.extractedContent.student?.id,
        prompt: this.extractedContent.prompt || '',
        rubric: this.extractedContent.rubric,
        submissionText: this.extractedContent.studentText,
        submissionFiles: this.extractedContent.files,
        gradingScale: 'points',
        tone: tone
      };

      const response = await this.callGradingAPI(gradeRequest);

      if (response.feedback) {
        this.displayGeneratedFeedback(response);
        document.getElementById('profgini-apply').disabled = false;
        this.updateStatus('Feedback generated successfully', 'success');
      } else {
        this.updateStatus('Failed to generate feedback', 'error');
      }

    } catch (error) {
      console.error('ProfGini: Generation error:', error);
      this.updateStatus('Generation failed: ' + error.message, 'error');
    }
  }

  displayGeneratedFeedback(response) {
    const previewDiv = document.getElementById('profgini-preview');
    const feedbackDiv = document.getElementById('feedback-content');
    const gradeDiv = document.getElementById('grade-info');

    feedbackDiv.innerHTML = `<p>${response.feedback}</p>`;

    let gradeHtml = '';
    if (response.score !== undefined) {
      gradeHtml += `<p><strong>Score:</strong> ${response.score}</p>`;
    }

    if (response.rubricBreakdown) {
      gradeHtml += '<div class="rubric-breakdown"><h5>Rubric Breakdown:</h5>';
      response.rubricBreakdown.forEach(item => {
        gradeHtml += `<div class="rubric-item">`;
        gradeHtml += `<strong>${item.criterion}:</strong> ${item.score} - ${item.notes}`;
        gradeHtml += `</div>`;
      });
      gradeHtml += '</div>';
    }

    gradeDiv.innerHTML = gradeHtml;
    previewDiv.style.display = 'block';

    // Store the response for applying
    this.generatedResponse = response;
  }

  async applyToLMS() {
    if (!this.generatedResponse || !this.extractedContent) {
      this.updateStatus('No feedback to apply', 'error');
      return;
    }

    try {
      this.updateStatus('Applying feedback to LMS...', 'loading');

      const {
        targets
      } = this.extractedContent;

      // Apply feedback text
      if (targets.feedbackBox && this.generatedResponse.feedback) {
        await this.currentAdapter.applyFeedback(targets.feedbackBox, this.generatedResponse.feedback);
      }

      if (targets.replyBox && this.generatedResponse.feedback) {
        await this.currentAdapter.applyFeedback(targets.replyBox, this.generatedResponse.feedback);
      }

      // Apply grade
      if (targets.gradeInput && this.generatedResponse.score !== undefined) {
        await this.currentAdapter.applyGrade(targets.gradeInput, this.generatedResponse.score);
      }

      document.getElementById('profgini-submit').disabled = false;
      this.updateStatus('Applied successfully - ready to submit', 'success');

    } catch (error) {
      console.error('ProfGini: Apply error:', error);
      this.updateStatus('Apply failed: ' + error.message, 'error');
    }
  }

  async submitGrade() {
    if (!this.extractedContent?.targets?.submitButton) {
      this.updateStatus('Submit button not found', 'error');
      return;
    }

    if (this.config?.preferences?.confirmBeforeSubmit) {
      const confirmed = confirm('Are you sure you want to submit this grade and feedback?');
      if (!confirmed) return;
    }

    try {
      this.updateStatus('Submitting grade...', 'loading');

      await this.currentAdapter.clickSubmit(this.extractedContent.targets.submitButton);

      this.updateStatus('Grade submitted successfully!', 'success');

      // Hide overlay after successful submission
      setTimeout(() => {
        this.overlay.style.display = 'none';
      }, 2000);

    } catch (error) {
      console.error('ProfGini: Submit error:', error);
      this.updateStatus('Submit failed: ' + error.message, 'error');
    }
  }

  async callGradingAPI(request) {
    const response = await fetch(`${this.config.apiBaseUrl}/api/lms/grade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.authToken || 'dev-token'}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  }

  updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('profgini-status');
    const statusText = statusElement.querySelector('.status-text');

    statusText.textContent = message;
    statusElement.className = `profgini-status ${type}`;
  }

  makeDraggable() {
    const panel = this.overlay.querySelector('.profgini-panel');
    const header = panel.querySelector('.profgini-header');

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('profgini-close')) return;

      isDragging = true;
      initialX = e.clientX - panel.offsetLeft;
      initialY = e.clientY - panel.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      panel.style.left = currentX + 'px';
      panel.style.top = currentY + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProfGiniLMSIntegration();
  });
} else {
  new ProfGiniLMSIntegration();
}
