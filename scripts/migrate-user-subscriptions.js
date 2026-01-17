// Migration script to ensure all users have UserSubscription records
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureAllUsersHaveSubscriptions() {
  console.log('🔍 Finding users without UserSubscription records...');
  
  // Find users without subscription records
  const usersWithoutSubs = await prisma.user.findMany({
    where: {
      userSubscription: null
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  console.log(`📊 Found ${usersWithoutSubs.length} users without subscription records`);

  if (usersWithoutSubs.length === 0) {
    console.log('✅ All users already have subscription records');
    return;
  }

  console.log('🔧 Creating subscription records...');

  // Create subscription records for each user
  for (const user of usersWithoutSubs) {
    try {
      await prisma.$transaction(async (tx) => {
        // Create UserSubscription with FREE_TRIAL
        const userSubscription = await tx.userSubscription.create({
          data: {
            userId: user.id,
            tier: 'FREE_TRIAL',
            status: 'ACTIVE',
            trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        });

        // Create UserUsageCounter
        await tx.userUsageCounter.create({
          data: {
            userId: user.id,
            students: 0,
            courses: 0,
            aiGenerations: 0,
            fileUploads: 0,
            resetDate: new Date()
          }
        });

        console.log(`  ✅ Created records for ${user.email}`);
      });
    } catch (error) {
      console.error(`  ❌ Failed to create records for ${user.email}:`, error.message);
    }
  }

  console.log('🎉 Migration completed!');
}

async function main() {
  console.log('🔄 Starting user subscription migration...');
  
  try {
    await ensureAllUsersHaveSubscriptions();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
