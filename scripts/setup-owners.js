// scripts/setup-owners.js
// Run this script to set up platform owners with premium access
// Usage: node scripts/setup-owners.js

const {
  PrismaClient
} = require('@prisma/client');

const prisma = new PrismaClient();

// Platform owner emails - these users get OWNER role with full access
const OWNER_EMAILS = [
  'rjassaf12@gmail.com',
  'ohaddad12@gmail.com',
  'sanazindustrial@gmail.com',
  'versorabusiness@gmail.com'
];

async function setupOwners() {
  console.log('🔧 Setting up platform owners...\n');

  for (const email of OWNER_EMAILS) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email
        }
      });

      if (existingUser) {
        // Update existing user to OWNER status (using ADMIN role with isOwner flag)
        const updatedUser = await prisma.user.update({
          where: {
            email
          },
          data: {
            role: 'ADMIN',
            isOwner: true,
            subscriptionType: 'PREMIUM',
            creditBalance: 999999,
            monthlyCredits: 999999
          }
        });

        console.log(`✅ Updated ${email} to OWNER role (id: ${updatedUser.id})`);
      } else {
        console.log(`⏭️  User ${email} does not exist yet - will be promoted on first login`);
      }

      // Log owner setup
      console.log('[OWNER_SETUP]', {
        action: 'OWNER_SETUP',
        email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error setting up ${email}:`, error.message);
    }
  }

  console.log('\n✨ Owner setup complete!');
  console.log('\nOwner privileges:');
  console.log('  - Full access to platform admin features');
  console.log('  - Unlimited credits & resources');
  console.log('  - Premium subscription status');
}

setupOwners()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
