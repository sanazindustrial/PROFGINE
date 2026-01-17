import { prisma } from "@/prisma/client";

export async function testDatabaseConnection() {
  try {
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Users in database: ${userCount}`);

    // Test NextAuth models
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    console.log(`✅ NextAuth tables working. Accounts: ${accountCount}, Sessions: ${sessionCount}`);

    return {
      success: true,
      data: {
        users: userCount,
        accounts: accountCount,
        sessions: sessionCount
      }
    };
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function createTestUser(email: string, name: string) {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: "PROFESSOR", // Default role for testing
        subscription: {
          create: {
            type: "FREE",
            status: "TRIALING",
            trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
          }
        }
      },
      include: {
        subscription: true
      }
    });

    console.log(`✅ Test user created:`, user);
    return { success: true, user };
  } catch (error) {
    console.error("❌ Failed to create test user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            courses: true,
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Retrieved ${users.length} users from database`);
    return { success: true, users };
  } catch (error) {
    console.error("❌ Failed to get users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function testRoleAssignment(email: string) {
  // Import the role assignment logic
  const { determineRoleFromEmail } = await import("@/lib/user-management");

  const role = determineRoleFromEmail(email);
  console.log(`📧 Email: ${email} → Role: ${role}`);

  return { email, role };
}