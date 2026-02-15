#!/usr/bin/env node

/**
 * Clean up expired sessions from the database
 */

const {
  PrismaClient
} = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupExpiredSessions() {
  console.log('🧹 Cleaning up expired sessions...\n');

  try {
    // Find expired sessions
    const expiredSessions = await prisma.session.findMany({
      where: {
        expires: {
          lt: new Date()
        }
      },
      select: {
        id: true,
        userId: true,
        expires: true
      }
    });

    console.log(`Found ${expiredSessions.length} expired session(s)`);

    if (expiredSessions.length > 0) {
      // Delete expired sessions
      const result = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date()
          }
        }
      });

      console.log(`✓ Deleted ${result.count} expired session(s)`);
    } else {
      console.log('✓ No expired sessions to clean up');
    }

    // Show remaining active sessions
    const activeSessions = await prisma.session.count({
      where: {
        expires: {
          gt: new Date()
        }
      }
    });

    console.log(`\n📊 Active sessions remaining: ${activeSessions}`);

  } catch (error) {
    console.error('Error cleaning up sessions:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupExpiredSessions();
