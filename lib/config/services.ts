// Google Cloud Platform service configuration
export const googleCloudConfig = {
  apiKey: process.env.GOOGLE_CLOUD_API_KEY!,
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
  projectId: process.env.GOOGLE_PROJECT_ID!,
}

// Chrome extension messaging configuration
export const chromeExtensionConfig = {
  extensionId: process.env.CHROME_EXTENSION_ID || 'profginiplatformintegrationassit',
  clientName: process.env.CHROME_CLIENT_NAME || 'Chrome client 1',
  oauthClientId: process.env.CHROME_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
  allowedOrigins: [
    'chrome-extension://*',
    'https://classroom.google.com',
    'https://canvas.instructure.com',
    'https://blackboard.com',
    'https://*.blackboard.com',
    'https://d2l.com',
    'https://*.d2l.com'
  ]
}

// Grading service configuration
export const gradingServiceConfig = {
  maxAssignmentsPerRequest: 10,
  supportedPlatforms: [
    'google-classroom',
    'canvas',
    'blackboard',
    'brightspace',
    'moodle'
  ],
  aiGradingEnabled: true,
  batchProcessing: true
}

const servicesConfig = {
  googleCloud: googleCloudConfig,
  chromeExtension: chromeExtensionConfig,
  gradingService: gradingServiceConfig
}

export default servicesConfig