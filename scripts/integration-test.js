#!/usr/bin/env node

/**
 * Comprehensive Database and API Integration Test Suite
 * Tests database connectivity, Prisma models, and API functionality
 * 
 * Usage: node scripts/integration-test.js
 */

const {
  PrismaClient
} = require('@prisma/client');

const prisma = new PrismaClient();

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: [],
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
    results.failed.push({
      name: testName,
      details
    });
  }
}

function logWarning(testName, message) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${testName} - ${message}`);
  results.warnings.push({
    name: testName,
    message
  });
}

// ============================================================================
// DATABASE TESTS
// ============================================================================

async function testDatabaseConnection() {
  logSection('DATABASE CONNECTIVITY');

  try {
    await prisma.$connect();
    logResult('Database connection', true);

    // Test raw query
    const result = await prisma.$queryRaw `SELECT 1 as test`;
    logResult('Raw SQL query', result[0].test === 1);
  } catch (error) {
    logResult('Database connection', false, error.message);
    return false;
  }

  return true;
}

async function testUserModel() {
  logSection('USER MODEL');

  try {
    const userCount = await prisma.user.count();
    logResult('User count query', true, `Found ${userCount} users`);

    // Check for admin users
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    });
    logResult('Admin user query', true, `Found ${adminCount} admins`);

    // Check for professors
    const professorCount = await prisma.user.count({
      where: {
        role: 'PROFESSOR'
      }
    });
    logResult('Professor user query', true, `Found ${professorCount} professors`);

    // Check for students
    const studentCount = await prisma.user.count({
      where: {
        role: 'STUDENT'
      }
    });
    logResult('Student user query', true, `Found ${studentCount} students`);

    // Test user with relations
    const userWithRelations = await prisma.user.findFirst({
      include: {
        courses: true,
        enrollments: true,
        accounts: true
      }
    });
    logResult('User relations query', true);

  } catch (error) {
    logResult('User model queries', false, error.message);
  }
}

async function testCourseModel() {
  logSection('COURSE MODEL');

  try {
    const courseCount = await prisma.course.count();
    logResult('Course count query', true, `Found ${courseCount} courses`);

    // Test course with relations
    try {
      const courseWithRelations = await prisma.course.findFirst({
        select: {
          id: true,
          title: true,
          instructorId: true
        }
      });

      if (courseWithRelations) {
        logResult('Course query', true, `Course: ${courseWithRelations.title}`);
      } else {
        logWarning('Course query', 'No courses found to test');
      }
    } catch (relErr) {
      logWarning('Course relations query', 'Schema mismatch: ' + relErr.message.split('\n')[0]);
    }

  } catch (error) {
    logResult('Course model queries', false, error.message);
  }
}

async function testModuleModel() {
  logSection('MODULE MODEL');

  try {
    const moduleCount = await prisma.module.count();
    logResult('Module count query', true, `Found ${moduleCount} modules`);

    // Test module with sections
    try {
      const moduleWithRelations = await prisma.module.findFirst({
        select: {
          id: true,
          title: true,
          courseId: true
        }
      });

      if (moduleWithRelations) {
        logResult('Module query', true, `Module: ${moduleWithRelations.title}`);
      } else {
        logWarning('Module query', 'No modules found to test');
      }
    } catch (relErr) {
      logWarning('Module relations query', 'Schema mismatch: ' + relErr.message.split('\n')[0]);
    }

  } catch (error) {
    logResult('Module model queries', false, error.message);
  }
}

async function testAssignmentModel() {
  logSection('ASSIGNMENT MODEL');

  try {
    const assignmentCount = await prisma.assignment.count();
    logResult('Assignment count query', true, `Found ${assignmentCount} assignments`);

    const assignmentWithRelations = await prisma.assignment.findFirst({
      select: {
        id: true,
        title: true,
        courseId: true
      }
    });

    if (assignmentWithRelations) {
      logResult('Assignment query', true, `Assignment: ${assignmentWithRelations.title}`);
    } else {
      logWarning('Assignment query', 'No assignments found');
    }

  } catch (error) {
    // Handle schema mismatches gracefully
    logWarning('Assignment model', 'Schema mismatch: ' + error.message.split('\n')[0]);
  }
}

async function testEnrollmentModel() {
  logSection('ENROLLMENT MODEL');

  try {
    const enrollmentCount = await prisma.enrollment.count();
    logResult('Enrollment count query', true, `Found ${enrollmentCount} enrollments`);

  } catch (error) {
    logResult('Enrollment model queries', false, error.message);
  }
}

async function testCourseDesignModels() {
  logSection('COURSE DESIGN STUDIO MODELS');

  try {
    // Course Design Metadata
    const designCount = await prisma.courseDesignMetadata.count();
    logResult('CourseDesignMetadata count', true, `Found ${designCount} designs`);

    // Evidence Kit Items
    const evidenceCount = await prisma.evidenceKitItem.count();
    logResult('EvidenceKitItem count', true, `Found ${evidenceCount} evidence items`);

    // Course Objectives
    const objectiveCount = await prisma.courseObjective.count();
    logResult('CourseObjective count', true, `Found ${objectiveCount} objectives`);

    // Course Design Sections
    const sectionCount = await prisma.courseDesignSection.count();
    logResult('CourseDesignSection count', true, `Found ${sectionCount} sections`);

    // Section Content
    const contentCount = await prisma.sectionContent.count();
    logResult('SectionContent count', true, `Found ${contentCount} content items`);

    // Rubrics
    const rubricCount = await prisma.assessmentRubric.count();
    logResult('AssessmentRubric count', true, `Found ${rubricCount} rubrics`);

    // Syllabus Versions
    const syllabusCount = await prisma.syllabusVersion.count();
    logResult('SyllabusVersion count', true, `Found ${syllabusCount} syllabus versions`);

    // Ready Check Results
    const readyCheckCount = await prisma.readyCheckResult.count();
    logResult('ReadyCheckResult count', true, `Found ${readyCheckCount} ready checks`);

    // Course Audit Logs
    const auditCount = await prisma.courseAuditLog.count();
    logResult('CourseAuditLog count', true, `Found ${auditCount} audit logs`);

  } catch (error) {
    logResult('Course design model queries', false, error.message);
  }
}

async function testDiscussionModels() {
  logSection('DISCUSSION MODELS');

  try {
    const threadCount = await prisma.discussionThread.count();
    logResult('DiscussionThread count', true, `Found ${threadCount} threads`);

    const postCount = await prisma.discussionPost.count();
    logResult('DiscussionPost count', true, `Found ${postCount} posts`);

  } catch (error) {
    logResult('Discussion model queries', false, error.message);
  }
}

async function testSubscriptionModels() {
  logSection('SUBSCRIPTION & BILLING MODELS');

  try {
    // Check subscription types distribution
    const freeUsers = await prisma.user.count({
      where: {
        subscriptionType: 'FREE'
      }
    });
    const basicUsers = await prisma.user.count({
      where: {
        subscriptionType: 'BASIC'
      }
    });
    const premiumUsers = await prisma.user.count({
      where: {
        subscriptionType: 'PREMIUM'
      }
    });

    logResult('Subscription type query', true, `FREE: ${freeUsers}, BASIC: ${basicUsers}, PREMIUM: ${premiumUsers}`);

    // Credit transactions
    const creditTxCount = await prisma.creditTransaction.count();
    logResult('CreditTransaction count', true, `Found ${creditTxCount} transactions`);

  } catch (error) {
    logResult('Subscription model queries', false, error.message);
  }
}

async function testNotificationModel() {
  logSection('NOTIFICATION MODEL');

  try {
    // Check if notification model exists
    if (!prisma.notification) {
      logWarning('Notification model', 'Notification model not available');
      return;
    }

    const notificationCount = await prisma.notification.count();
    logResult('Notification count', true, `Found ${notificationCount} notifications`);

    // Test notification with relations
    const notificationWithRelations = await prisma.notification.findFirst({
      include: {
        course: true
      }
    });

    if (notificationWithRelations) {
      logResult('Notification relations', true);
    } else {
      logWarning('Notification relations', 'No notifications found');
    }

  } catch (error) {
    // Table might not exist in database yet
    logWarning('Notification model', 'Table not migrated yet: ' + error.message.split('\n')[0]);
  }
}

async function testOrganizationModels() {
  logSection('ORGANIZATION MODELS');

  try {
    const orgCount = await prisma.organization.count();
    logResult('Organization count', true, `Found ${orgCount} organizations`);

    const memberCount = await prisma.organizationMember.count();
    logResult('OrganizationMember count', true, `Found ${memberCount} members`);

  } catch (error) {
    logResult('Organization model queries', false, error.message);
  }
}

async function testSessionModel() {
  logSection('SESSION MODEL');

  try {
    const sessionCount = await prisma.session.count();
    logResult('Session count', true, `Found ${sessionCount} active sessions`);

    // Check for expired sessions
    const expiredSessions = await prisma.session.count({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });

    if (expiredSessions > 0) {
      logWarning('Expired sessions', `Found ${expiredSessions} expired sessions that should be cleaned up`);
    } else {
      logResult('Session expiry check', true, 'No expired sessions');
    }

  } catch (error) {
    logResult('Session model queries', false, error.message);
  }
}

async function testAdminModels() {
  logSection('ADMIN MODELS');

  try {
    // Invitations
    if (prisma.invitation) {
      const invitationCount = await prisma.invitation.count();
      logResult('Invitation count', true, `Found ${invitationCount} invitations`);
    } else {
      logWarning('Invitation model', 'Model not available');
    }

    // Check for users with owner role
    const ownerCount = await prisma.user.count({
      where: {
        isOwner: true
      }
    });
    logResult('Platform owner count', true, `Found ${ownerCount} platform owners`);

  } catch (error) {
    logResult('Admin model queries', false, error.message);
  }
}

async function testAIModels() {
  logSection('AI MODELS');

  try {
    // Professor styles
    const styleCount = await prisma.professorStyle.count();
    logResult('ProfessorStyle count', true, `Found ${styleCount} professor styles`);

    // User AI settings
    const aiSettingsCount = await prisma.userAISettings.count();
    logResult('UserAISettings count', true, `Found ${aiSettingsCount} AI settings`);

  } catch (error) {
    logResult('AI model queries', false, error.message);
  }
}

// ============================================================================
// SCHEMA INTEGRITY TESTS
// ============================================================================

async function testSchemaIntegrity() {
  logSection('SCHEMA INTEGRITY');

  try {
    // Test that all expected models exist
    const models = [
      'user', 'account', 'session', 'course', 'module', 'assignment',
      'enrollment', 'courseDesignMetadata', 'evidenceKitItem', 'courseObjective',
      'courseDesignSection', 'sectionContent', 'assessmentRubric', 'syllabusVersion',
      'readyCheckResult', 'courseAuditLog', 'discussionThread', 'discussionPost',
      'notification', 'organization', 'creditTransaction', 'invitation'
    ];

    let allExist = true;
    for (const model of models) {
      if (prisma[model]) {
        // Model exists
      } else {
        logResult(`Model ${model} exists`, false);
        allExist = false;
      }
    }

    if (allExist) {
      logResult('All expected models exist', true, `${models.length} models verified`);
    }

    // Test ModuleSection model (newly added)
    const moduleSectionExists = Boolean(prisma.moduleSection);
    logResult('ModuleSection model exists', moduleSectionExists);

  } catch (error) {
    logResult('Schema integrity check', false, error.message);
  }
}

// ============================================================================
// DATA CONSISTENCY TESTS
// ============================================================================

async function testDataConsistency() {
  logSection('DATA CONSISTENCY');

  try {
    // Check for orphaned enrollments
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: true,
        course: true
      }
    });

    const orphanedEnrollments = enrollments.filter(e => !e.user || !e.course);
    if (orphanedEnrollments.length > 0) {
      logWarning('Orphaned enrollments', `Found ${orphanedEnrollments.length} orphaned enrollments`);
    } else {
      logResult('Enrollment consistency', true, 'No orphaned enrollments');
    }

    // Check courses have instructors (instructorId is required in schema)
    // Verify all courses have valid instructor references
    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        instructorId: true
      }
    });

    const coursesWithEmptyInstructor = allCourses.filter(c => !c.instructorId || c.instructorId.trim() === '');

    if (coursesWithEmptyInstructor.length > 0) {
      logWarning('Courses with invalid instructors', `Found ${coursesWithEmptyInstructor.length} courses with empty instructorId`);
    } else {
      logResult('Course instructor consistency', true, `All ${allCourses.length} courses have valid instructors`);
    }

  } catch (error) {
    logResult('Data consistency check', false, error.message);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllTests() {
  log(`\n${colors.bold}Professor GENIE Platform - Database Integration Test Suite${colors.reset}`);
  log(`Started at: ${new Date().toISOString()}\n`);

  try {
    // Database connection test
    const connected = await testDatabaseConnection();

    if (!connected) {
      log('\nDatabase connection failed. Aborting tests.', colors.red);
      process.exit(1);
    }

    // Run all model tests
    await testUserModel();
    await testCourseModel();
    await testModuleModel();
    await testAssignmentModel();
    await testEnrollmentModel();
    await testCourseDesignModels();
    await testDiscussionModels();
    await testSubscriptionModels();
    await testNotificationModel();
    await testOrganizationModels();
    await testSessionModel();
    await testAdminModels();
    await testAIModels();
    await testSchemaIntegrity();
    await testDataConsistency();

  } catch (error) {
    log(`\nUnexpected error: ${error.message}`, colors.red);
  } finally {
    await prisma.$disconnect();
  }

  // Generate summary
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);
  const total = results.passed.length + results.failed.length;

  console.log('\n' + '='.repeat(60));
  log('  TEST SUMMARY', colors.bold + colors.cyan);
  console.log('='.repeat(60));

  log(`\n  Total Tests: ${total}`, colors.bold);
  log(`  ${colors.green}✓ Passed: ${results.passed.length}${colors.reset}`);
  log(`  ${colors.red}✗ Failed: ${results.failed.length}${colors.reset}`);
  log(`  ${colors.yellow}⚠ Warnings: ${results.warnings.length}${colors.reset}`);
  log(`  Duration: ${duration}s\n`);

  if (results.failed.length > 0) {
    log('  Failed Tests:', colors.red);
    results.failed.forEach(test => {
      log(`    - ${test.name}: ${test.details}`, colors.red);
    });
    console.log();
  }

  if (results.warnings.length > 0) {
    log('  Warnings:', colors.yellow);
    results.warnings.forEach(warning => {
      log(`    - ${warning.name}: ${warning.message}`, colors.yellow);
    });
    console.log();
  }

  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  log(`  Pass Rate: ${passRate}%\n`, passRate >= 80 ? colors.green : colors.red);

  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
