// Professor GENIE Options Page
document.addEventListener('DOMContentLoaded', function () {
  const domainInput = document.getElementById('domain-input');
  const addButton = document.getElementById('add-domain');
  const domainList = document.getElementById('domain-list');
  const emptyState = document.getElementById('empty-state');
  const statusMessage = document.getElementById('status-message');

  // Load existing domains on startup
  loadDomains();

  // Add domain functionality
  addButton.addEventListener('click', addDomain);
  domainInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addDomain();
    }
  });

  async function addDomain() {
    const domain = domainInput.value.trim().toLowerCase();

    if (!domain) {
      showStatus('Please enter a domain name', 'error');
      return;
    }

    if (!isValidDomain(domain)) {
      showStatus('Please enter a valid domain (e.g., myschool.instructure.com)', 'error');
      return;
    }

    try {
      // Get current domains
      const result = await chrome.storage.sync.get(['allowedDomains']);
      const domains = result.allowedDomains || [];

      if (domains.includes(domain)) {
        showStatus('Domain already exists', 'error');
        return;
      }

      // Add new domain
      domains.push(domain);
      await chrome.storage.sync.set({
        allowedDomains: domains
      });

      domainInput.value = '';
      showStatus('Domain added successfully', 'success');
      loadDomains();
    } catch (error) {
      console.error('Error adding domain:', error);
      showStatus('Error adding domain', 'error');
    }
  }

  async function removeDomain(domain) {
    try {
      const result = await chrome.storage.sync.get(['allowedDomains']);
      const domains = result.allowedDomains || [];
      const updated = domains.filter(d => d !== domain);

      await chrome.storage.sync.set({
        allowedDomains: updated
      });
      showStatus('Domain removed successfully', 'success');
      loadDomains();
    } catch (error) {
      console.error('Error removing domain:', error);
      showStatus('Error removing domain', 'error');
    }
  }

  async function loadDomains() {
    try {
      const result = await chrome.storage.sync.get(['allowedDomains']);
      const domains = result.allowedDomains || [];

      domainList.innerHTML = '';

      if (domains.length === 0) {
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';

      domains.forEach(domain => {
        const domainItem = document.createElement('div');
        domainItem.className = 'domain-item';

        domainItem.innerHTML = `
          <span class="domain-name">${escapeHtml(domain)}</span>
          <button class="remove-domain-btn" data-domain="${escapeHtml(domain)}">Remove</button>
        `;

        const removeBtn = domainItem.querySelector('.remove-domain-btn');
        removeBtn.addEventListener('click', () => {
          if (confirm(`Remove domain "${domain}"?`)) {
            removeDomain(domain);
          }
        });

        domainList.appendChild(domainItem);
      });
    } catch (error) {
      console.error('Error loading domains:', error);
      showStatus('Error loading domains', 'error');
    }
  }

  function isValidDomain(domain) {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
