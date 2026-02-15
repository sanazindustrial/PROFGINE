#!/usr/bin/env node

/**
 * Comprehensive End-to-End Test Suite for Professor GENIE Platform
 * Tests all major features including Authentication, Course Management,
 * AI Features, Subscriptions, Admin Panel, and more.
 * 
 * Usage: node scripts/e2e-test.js [--base-url=http://localhost:3000]
 */

const BASE_URL = process.argv.find(arg => arg.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:3000';

// Test results storage
const results = {
  passed: [],
  failed: [],
  skipped: [],
  startTime: Date.now()
};

// Console colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.bold + colors.cyan);
  console.log('='.repeat(60));
}

function logResult(testName, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  console.log(`  ${color}${icon}${colors.reset} ${testName}${details ? ` - ${details}` : ''}`);

  if (passed) {
    results.passed.push(testName);
  } else {
    results.failed.push(testName);
  }
}

function logSkipped(testName, reason) {
  console.log(`  ${colors.yellow}○${colors.reset} ${testName} - SKIPPED: ${reason}`);
  results.skipped.push({
    name: testName,
    reason
  });
}

async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function testEndpoint(name, url, expectedStatus = 200, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetchWithTimeout(url, options);

    // Handle both single status code and array of acceptable status codes
    const acceptableStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const passed = acceptableStatuses.includes(response.status);

    logResult(name, passed, `Status: ${response.status}`);

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Response is not JSON
    }

    return {
      passed,
      status: response.status,
      data
    };
  } catch (error) {
    logResult(name, false, `Error: ${error.message}`);
    return {
      passed: false,
      error: error.message
    };
  }
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testServerHealth() {
  logSection('SERVER HEALTH & INFRASTRUCTURE');

  // Test base URL
  await testEndpoint('Server is running', BASE_URL, 200);

  // Test API health endpoints
  await testEndpoint('Admin health check', `${BASE_URL}/api/admin/health`, [200, 401, 403]);

  // Test database health
  const dbResult = await testEndpoint('Database health', `${BASE_URL}/database-health`, 200);

  // Test environment endpoint
  await testEndpoint('Environment endpoint', `${BASE_URL}/environment`, [200, 307, 302]);
}

async function testAuthenticationRoutes() {
  logSection('AUTHENTICATION & USER MANAGEMENT');

  // NextAuth endpoints
  await testEndpoint('NextAuth providers', `${BASE_URL}/api/auth/providers`, 200);
  await testEndpoint('NextAuth session', `${BASE_URL}/api/auth/session`, 200);
  await testEndpoint('NextAuth CSRF token', `${BASE_URL}/api/auth/csrf`, 200);

  // Custom auth endpoints
  await testEndpoint('Signup endpoint (GET)', `${BASE_URL}/api/auth/signup`, [200, 405]);
  await testEndpoint('Professor signup (GET)', `${BASE_URL}/api/auth/professor-signup`, [200, 405]);
  await testEndpoint('Dev login (POST without body)', `${BASE_URL}/api/auth/dev-login`, [400, 401, 405, 404], 'POST'); // 404 = intentionally disabled

  // Login page
  await testEndpoint('Login page', `${BASE_URL}/login`, 200);

  // Profile endpoint (requires auth)
  await testEndpoint('Profile page', `${BASE_URL}/profile`, [200, 307, 302, 401]);
}

async function testCourseManagementRoutes() {
  logSection('COURSE MANAGEMENT');

  // Course API routes
  await testEndpoint('Courses list API', `${BASE_URL}/api/courses`, [200, 401]);

  // Course pages
  await testEndpoint('Dashboard page', `${BASE_URL}/dashboard`, [200, 302, 307]);
  await testEndpoint('Courses dashboard', `${BASE_URL}/dashboard/courses`, [200, 302, 307]);
  await testEndpoint('New course page', `${BASE_URL}/dashboard/courses/new`, [200, 302, 307]);
  await testEndpoint('Enrollment page', `${BASE_URL}/dashboard/enrollment`, [200, 302, 307]);
}

async function testCourseDesignStudio() {
  logSection('COURSE DESIGN STUDIO (10-Phase Workflow)');

  // Course Design Studio API
  await testEndpoint('Course Design Studio API', `${BASE_URL}/api/course-design-studio`, [200, 401]);

  // Course Studio pages
  await testEndpoint('Course Design Studio page', `${BASE_URL}/dashboard/course-design-studio`, [200, 302, 307]);
  await testEndpoint('Generate objectives page', `${BASE_URL}/dashboard/generate-objectives`, [200, 302, 307]);
  await testEndpoint('Create syllabus page', `${BASE_URL}/dashboard/create-syllabus`, [200, 302, 307]);
  await testEndpoint('Suggest curriculum page', `${BASE_URL}/dashboard/suggest-curriculum`, [200, 302, 307]);
  await testEndpoint('Design assessments page', `${BASE_URL}/dashboard/design-assessments`, [200, 302, 307]);

  // Course studio generation API
  await testEndpoint('Course Studio Generate API', `${BASE_URL}/api/course-studio/generate`, [200, 401, 405], 'POST', {
    type: 'objectives',
    courseId: 'test-course-id'
  });
}

async function testAIFeatures() {
  logSection('AI-POWERED FEATURES');

  // AI status and configuration
  await testEndpoint('AI status API', `${BASE_URL}/api/ai/status`, [200, 401]);
  await testEndpoint('AI configure API', `${BASE_URL}/api/ai/configure`, [200, 401, 405]);
  await testEndpoint('AI test API', `${BASE_URL}/api/ai/test`, [200, 401, 405], 'POST');

  // Chat API
  await testEndpoint('Chat API (POST)', `${BASE_URL}/api/chat`, [200, 400, 401, 405], 'POST', {
    messages: [{
      role: 'user',
      content: 'Hello'
    }]
  });

  // User chat API
  await testEndpoint('User chat API', `${BASE_URL}/api/chat/user`, [200, 401]);

  // Assistant API
  await testEndpoint('Assistant API', `${BASE_URL}/api/assistant`, [200, 401, 405], 'POST', {
    message: 'Hello'
  });

  // AI settings page
  await testEndpoint('AI settings page', `${BASE_URL}/dashboard/settings/ai`, [200, 302, 307]);
}

async function testGradingAndAssessment() {
  logSection('GRADING & ASSESSMENT');

  // Grade pages
  await testEndpoint('Grade page', `${BASE_URL}/grade`, 200);
  await testEndpoint('Enhanced grading', `${BASE_URL}/grade/enhanced`, [200, 302, 307]);

  // Discussion page
  await testEndpoint('Discussion page', `${BASE_URL}/discussion`, 200);
}

async function testSubscriptionAndBilling() {
  logSection('SUBSCRIPTION & BILLING');

  // Billing APIs
  await testEndpoint('Checkout API', `${BASE_URL}/api/billing/checkout`, [200, 401, 405], 'POST', {
    priceId: 'test-price'
  });
  await testEndpoint('Billing portal API', `${BASE_URL}/api/billing/portal`, [200, 401, 405], 'POST');
  await testEndpoint('Flexible checkout API', `${BASE_URL}/api/billing/checkout-flexible`, [200, 401, 405], 'POST');

  // Subscription pages
  await testEndpoint('Subscription management', `${BASE_URL}/subscription-management`, 200);
  await testEndpoint('Subscription upgrade', `${BASE_URL}/subscription/upgrade`, 200);
  await testEndpoint('Subscription success', `${BASE_URL}/subscription/success`, 200);
  await testEndpoint('Subscription manage', `${BASE_URL}/subscription/manage`, 200);
  await testEndpoint('Trial dashboard', `${BASE_URL}/trial-dashboard`, 200);
}

async function testAdminPanel() {
  logSection('ADMIN PANEL');

  // Admin pages
  await testEndpoint('Admin page', `${BASE_URL}/admin`, [200, 302, 307, 401, 403]);
  await testEndpoint('Admin dashboard', `${BASE_URL}/admin-dashboard`, 200);
  await testEndpoint('Admin login', `${BASE_URL}/admin-login`, 200);
  await testEndpoint('Admin settings', `${BASE_URL}/admin-settings`, [200, 302, 307]);
  await testEndpoint('Admin config', `${BASE_URL}/admin/config`, 200);
  await testEndpoint('Admin users', `${BASE_URL}/admin/users`, [200, 302, 307]);

  // Admin APIs
  await testEndpoint('Admin config API', `${BASE_URL}/api/admin/config`, [200, 401, 403]);
  await testEndpoint('Admin system settings', `${BASE_URL}/api/admin/system-settings`, [200, 401, 403]);
  await testEndpoint('Admin audit log', `${BASE_URL}/api/admin/audit-log`, [200, 401, 403]);
  await testEndpoint('Admin invitations', `${BASE_URL}/api/admin/invitations`, [200, 401, 403]);

  // AI management
  await testEndpoint('AI management page', `${BASE_URL}/ai-management`, 200);

  // API config
  await testEndpoint('API config page', `${BASE_URL}/api-config`, [200, 302, 307]);

  // User management
  await testEndpoint('User management page', `${BASE_URL}/user-management`, [200, 302, 307]);

  // Security
  await testEndpoint('Security page', `${BASE_URL}/security`, [200, 302, 307]);
}

async function testNotificationSystem() {
  logSection('NOTIFICATION SYSTEM');

  await testEndpoint('Notifications API', `${BASE_URL}/api/notifications`, [200, 401]);

  // Content review APIs
  await testEndpoint('Pending review content API', `${BASE_URL}/api/content/pending-review`, [200, 401]);
}

async function testStaticPages() {
  logSection('STATIC PAGES & LEGAL');

  await testEndpoint('Privacy policy', `${BASE_URL}/privacy`, 200);
  await testEndpoint('Terms of service', `${BASE_URL}/terms`, 200);
  await testEndpoint('Help page', `${BASE_URL}/help`, 200);
  await testEndpoint('Docs page', `${BASE_URL}/docs`, 200);
}

async function testDebugEndpoints() {
  logSection('DEBUG & TESTING ENDPOINTS');

  await testEndpoint('Debug auth', `${BASE_URL}/debug/auth`, 200);
  await testEndpoint('Debug users', `${BASE_URL}/debug/users`, 200);
  await testEndpoint('Test auth', `${BASE_URL}/test/auth`, 200);
}

async function testExtensionAPI() {
  logSection('BROWSER EXTENSION API');

  await testEndpoint('Extension grading API', `${BASE_URL}/api/extension/grade`, [200, 401, 405], 'POST', {
    content: 'Test submission'
  });
}

async function testFileManagement() {
  logSection('FILE MANAGEMENT');

  await testEndpoint('User files API', `${BASE_URL}/api/user-files`, [200, 401, 405]);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllTests() {
  log(`\n${colors.bold}Professor GENIE Platform - End-to-End Test Suite${colors.reset}`);
  log(`Testing against: ${BASE_URL}`);
  log(`Started at: ${new Date().toISOString()}\n`);

  try {
    // Check if server is running first
    const healthCheck = await fetchWithTimeout(`${BASE_URL}/api/auth/session`, {}, 5000);
    if (!healthCheck.ok && healthCheck.status !== 401) {
      log('Warning: Server may not be fully responsive', colors.yellow);
    }
  } catch (error) {
    log(`${colors.red}ERROR: Cannot connect to server at ${BASE_URL}${colors.reset}`);
    log('Please ensure the development server is running with: pnpm dev\n');
    process.exit(1);
  }

  // Run all test suites
  await testServerHealth();
  await testAuthenticationRoutes();
  await testCourseManagementRoutes();
  await testCourseDesignStudio();
  await testAIFeatures();
  await testGradingAndAssessment();
  await testSubscriptionAndBilling();
  await testAdminPanel();
  await testNotificationSystem();
  await testStaticPages();
  await testDebugEndpoints();
  await testExtensionAPI();
  await testFileManagement();

  // Generate summary
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);
  const total = results.passed.length + results.failed.length;

  console.log('\n' + '='.repeat(60));
  log('  TEST SUMMARY', colors.bold + colors.cyan);
  console.log('='.repeat(60));

  log(`\n  Total Tests: ${total}`, colors.bold);
  log(`  ${colors.green}✓ Passed: ${results.passed.length}${colors.reset}`);
  log(`  ${colors.red}✗ Failed: ${results.failed.length}${colors.reset}`);
  log(`  ${colors.yellow}○ Skipped: ${results.skipped.length}${colors.reset}`);
  log(`  Duration: ${duration}s\n`);

  if (results.failed.length > 0) {
    log('  Failed Tests:', colors.red);
    results.failed.forEach(test => {
      log(`    - ${test}`, colors.red);
    });
    console.log();
  }

  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  log(`  Pass Rate: ${passRate}%\n`, passRate >= 80 ? colors.green : colors.red);

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Handle expected status codes that may vary
function testEndpointWithVariableStatus(name, url, acceptableStatuses, method = 'GET', body = null) {
  return testEndpoint(name, url, acceptableStatuses, method, body);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
