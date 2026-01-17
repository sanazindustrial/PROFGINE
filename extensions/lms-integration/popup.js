// Popup JavaScript for ProfGini LMS Integration

class ProfGiniPopup {
  constructor() {
    this.config = {};
    this.isAuthenticated = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadConfig();
    await this.checkAuthStatus();
    await this.updateStatus();
  }

  setupEventListeners() {
    // Authentication
    document.getElementById('loginBtn').addEventListener('click', () => this.login());
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

    // Settings
    document.getElementById('providerSelect').addEventListener('change', () => this.toggleCustomEndpoint());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());

    // Quick actions
    document.getElementById('openCurrentTab').addEventListener('click', () => this.analyzeCurrentTab());
    document.getElementById('openHelp').addEventListener('click', () => this.openHelp());
    document.getElementById('reportIssue').addEventListener('click', () => this.reportIssue());
    document.getElementById('privacyLink').addEventListener('click', () => this.openPrivacyPolicy());
  }

  async loadConfig() {
    try {
      const response = await this.sendMessage({
        type: 'getConfig'
      });
      if (response.success) {
        this.config = response.config;
        this.updateConfigUI();
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  updateConfigUI() {
    document.getElementById('providerSelect').value = this.config.provider || 'auto';
    document.getElementById('customEndpoint').value = this.config.customEndpoint || '';
    document.getElementById('autoDetectCheck').checked = this.config.autoDetect !== false;
    document.getElementById('fileProcessingCheck').checked = this.config.enableFileProcessing !== false;

    this.toggleCustomEndpoint();
  }

  toggleCustomEndpoint() {
    const provider = document.getElementById('providerSelect').value;
    const customGroup = document.getElementById('customEndpointGroup');

    if (provider === 'custom') {
      customGroup.classList.remove('hidden');
    } else {
      customGroup.classList.add('hidden');
    }
  }

  async checkAuthStatus() {
    try {
      const response = await this.sendMessage({
        type: 'getAuthToken'
      });
      this.isAuthenticated = response.success && response.token;
      this.updateAuthUI();
    } catch (error) {
      console.error('Auth check failed:', error);
      this.isAuthenticated = false;
      this.updateAuthUI();
    }
  }

  updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authStatus = document.getElementById('authStatus');

    if (this.isAuthenticated) {
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      authStatus.textContent = 'Successfully authenticated';
      authStatus.className = 'success-text';
      authStatus.classList.remove('hidden');
    } else {
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      authStatus.textContent = 'Not authenticated';
      authStatus.className = 'error-text';
      authStatus.classList.remove('hidden');
    }
  }

  async updateStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusDetails = document.getElementById('statusDetails');

    try {
      // Check current tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      const currentTab = tabs[0];

      if (!currentTab) {
        this.setStatus('offline', 'No active tab', 'Cannot detect current page');
        return;
      }

      const url = currentTab.url;
      const isLMS = this.isLMSUrl(url);

      if (isLMS) {
        const lmsType = this.detectLMSType(url);
        this.setStatus('online', `${lmsType} detected`, `Ready to assist on ${currentTab.title}`);
      } else {
        this.setStatus('offline', 'Not on LMS', 'Navigate to a supported LMS to use ProfGini');
      }

    } catch (error) {
      console.error('Status check failed:', error);
      this.setStatus('offline', 'Extension error', 'Please refresh the page and try again');
    }
  }

  setStatus(status, text, details) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusDetails = document.getElementById('statusDetails');

    statusDot.className = `status-dot ${status}`;
    statusText.textContent = text;
    statusDetails.textContent = details;
    statusDetails.className = status === 'online' ? 'success-text' :
      status === 'loading' ? 'loading-text' : 'error-text';
  }

  isLMSUrl(url) {
    const lmsUrls = [
      'instructure.com',
      'canvas.com',
      'moodlecloud.com',
      'moodle.org',
      'brightspace.com',
      'desire2learn.com',
      'blackboard.com',
      'schoology.com',
      'classroom.google.com'
    ];

    return lmsUrls.some(domain => url.includes(domain));
  }

  detectLMSType(url) {
    if (url.includes('instructure.com') || url.includes('canvas.com')) return 'Canvas';
    if (url.includes('moodlecloud.com') || url.includes('moodle.org')) return 'Moodle';
    if (url.includes('brightspace.com') || url.includes('desire2learn.com')) return 'D2L Brightspace';
    if (url.includes('blackboard.com')) return 'Blackboard';
    if (url.includes('schoology.com')) return 'Schoology';
    if (url.includes('classroom.google.com')) return 'Google Classroom';
    return 'LMS';
  }

  async login() {
    const loginBtn = document.getElementById('loginBtn');
    const authStatus = document.getElementById('authStatus');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    authStatus.textContent = 'Opening authentication window...';
    authStatus.className = 'loading-text';
    authStatus.classList.remove('hidden');

    try {
      const response = await this.sendMessage({
        type: 'getAuthToken'
      });

      if (response.success) {
        this.isAuthenticated = true;
        this.updateAuthUI();
        await this.updateStatus();
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      authStatus.textContent = 'Login failed: ' + error.message;
      authStatus.className = 'error-text';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login to ProfGini';
    }
  }

  async logout() {
    try {
      await chrome.storage.local.remove('profgini-token');
      this.isAuthenticated = false;
      this.updateAuthUI();
      await this.updateStatus();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async saveSettings() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const statusDiv = document.getElementById('settingsStatus');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const config = {
        provider: document.getElementById('providerSelect').value,
        customEndpoint: document.getElementById('customEndpoint').value,
        autoDetect: document.getElementById('autoDetectCheck').checked,
        enableFileProcessing: document.getElementById('fileProcessingCheck').checked
      };

      const response = await this.sendMessage({
        type: 'saveConfig',
        config
      });

      if (response.success) {
        this.config = config;
        statusDiv.textContent = 'Settings saved successfully!';
        statusDiv.className = 'success-text';
      } else {
        throw new Error(response.error || 'Save failed');
      }
    } catch (error) {
      console.error('Save settings failed:', error);
      statusDiv.textContent = 'Failed to save: ' + error.message;
      statusDiv.className = 'error-text';
    } finally {
      statusDiv.classList.remove('hidden');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';

      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 3000);
    }
  }

  async analyzeCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      const currentTab = tabs[0];

      if (!currentTab) {
        alert('No active tab found');
        return;
      }

      if (!this.isLMSUrl(currentTab.url)) {
        alert('Current tab is not a supported LMS. Please navigate to Canvas, Moodle, Blackboard, or another supported LMS.');
        return;
      }

      // Send message to content script to activate
      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'activate'
      });
      window.close();
    } catch (error) {
      console.error('Analyze tab failed:', error);
      alert('Failed to analyze current tab. Please refresh the page and try again.');
    }
  }

  openHelp() {
    chrome.tabs.create({
      url: 'https://profgini.com/help/lms-extension'
    });
  }

  reportIssue() {
    chrome.tabs.create({
      url: 'https://profgini.com/support/report-issue'
    });
  }

  openPrivacyPolicy() {
    chrome.tabs.create({
      url: 'https://profgini.com/privacy'
    });
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProfGiniPopup();
});
