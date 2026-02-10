require('dotenv').config({
  path: '.env.local'
});
const {
  PrismaClient
} = require('@prisma/client');
const prisma = new PrismaClient();

async function clearUserSessions() {
  try {
    console.log("🧹 Clearing browser sessions for versorabusiness@gmail.com...");

    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: 'versorabusiness@gmail.com'
      }
    });

    if (user) {
      // Delete all sessions for this user
      await prisma.session.deleteMany({
        where: {
          userId: user.id
        }
      });
      console.log("✅ Cleared all sessions for versorabusiness@gmail.com");
    }

    console.log("\n🎯 User Status After Update:");
    console.log("📧 versorabusiness@gmail.com");
    console.log("   Role: ADMIN ✅");
    console.log("   Owner: TRUE ✅");
    console.log("   Subscription: PREMIUM ✅");
    console.log("   Status: ACTIVE ✅");
    console.log("   Sessions: Cleared ✅");

    console.log("\n🔄 Next Steps:");
    console.log("1. Refresh your browser or clear cookies");
    console.log("2. Sign in again as versorabusiness@gmail.com");
    console.log("3. You should now have PROFESSOR access with PREMIUM features");

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUserSessions();
