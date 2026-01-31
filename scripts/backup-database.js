/**
 * Database Backup Script
 * 
 * This script exports all data from the current Neon database
 * for migration to a new server.
 */

require('dotenv').config({
  path: '.env.local'
});

const {
  PrismaClient
} = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('🔄 Starting database backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, {
        recursive: true
      });
    }

    const backup = {
      timestamp: new Date().toISOString(),
      source: 'Neon PostgreSQL',
      data: {}
    };

    // Backup Users
    console.log('📦 Backing up Users...');
    backup.data.users = await prisma.user.findMany();
    console.log(`   ✅ ${backup.data.users.length} users backed up`);

    // Backup Courses
    console.log('📦 Backing up Courses...');
    backup.data.courses = await prisma.course.findMany();
    console.log(`   ✅ ${backup.data.courses.length} courses backed up`);

    // Backup Presentations
    console.log('📦 Backing up Presentations...');
    backup.data.presentations = await prisma.presentation.findMany();
    console.log(`   ✅ ${backup.data.presentations.length} presentations backed up`);

    // Backup Assignments
    console.log('📦 Backing up Assignments...');
    backup.data.assignments = await prisma.assignment.findMany();
    console.log(`   ✅ ${backup.data.assignments.length} assignments backed up`);

    // Backup Submissions
    console.log('📦 Backing up Submissions...');
    backup.data.submissions = await prisma.submission.findMany();
    console.log(`   ✅ ${backup.data.submissions.length} submissions backed up`);

    // Backup Discussion Posts
    console.log('📦 Backing up Discussion Posts...');
    backup.data.discussionPosts = await prisma.discussionPost.findMany();
    console.log(`   ✅ ${backup.data.discussionPosts.length} posts backed up`);

    // Backup Grades
    console.log('📦 Backing up Grades...');
    backup.data.grades = await prisma.grade.findMany();
    console.log(`   ✅ ${backup.data.grades.length} grades backed up`);

    // Backup Enrollments
    console.log('📦 Backing up Enrollments...');
    backup.data.enrollments = await prisma.enrollment.findMany();
    console.log(`   ✅ ${backup.data.enrollments.length} enrollments backed up`);

    // Save backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('\n✅ Database backup completed successfully!\n');
    console.log('📁 Backup saved to:', backupFile);
    console.log('📊 Backup statistics:');
    console.log(`   - Users: ${backup.data.users.length}`);
    console.log(`   - Courses: ${backup.data.courses.length}`);
    console.log(`   - Presentations: ${backup.data.presentations.length}`);
    console.log(`   - Assignments: ${backup.data.assignments.length}`);
    console.log(`   - Submissions: ${backup.data.submissions.length}`);
    console.log(`   - Discussion Threads: ${backup.data.discussionThreads.length}`);
    console.log(`   - Discussion Posts: ${backup.data.discussionPosts.length}`);
    console.log(`   - Grades: ${backup.data.grades.length}`);
    console.log(`   - Organizations: ${backup.data.organizations.length}`);
    console.log(`   - Enrollments: ${backup.data.enrollments.length}`);

    const fileSizeMB = (fs.statSync(backupFile).size / (1024 * 1024)).toFixed(2);
    console.log(`   - File size: ${fileSizeMB} MB`);

    console.log('\n📝 Next steps:');
    console.log('1. Copy this backup file to your new server');
    console.log('2. Use restore-database.js to restore the data');
    console.log('3. Or use pg_dump for a complete SQL backup (see DATABASE_BACKUP_GUIDE.md)\n');

  } catch (error) {
    console.error('❌ Backup error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
