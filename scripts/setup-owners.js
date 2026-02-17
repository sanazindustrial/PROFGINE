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
        },
        include: {
          sessionPolicy: true,
          costControl: true
        }
      });

      if (existingUser) {
        // Update existing user to OWNER role
        const updatedUser = await prisma.user.update({
          where: {
            email
          },
          data: {
            role: 'OWNER',
            isOwner: true,
            isPremium: true,
            subscriptionType: 'PREMIUM',
            maxConcurrentSessions: 10, // Owners get more sessions
            creditBalance: 999999,
            monthlyCredits: 999999
          }
        });

        // Create session policy if doesn't exist
        if (!existingUser.sessionPolicy) {
          await prisma.sessionPolicy.create({
            data: {
              userId: updatedUser.id,
              maxConcurrentSessions: 10,
              sessionTimeout: 86400, // 24 hours for owners
              enforceIpConsistency: false
            }
          });
        }

        // Create cost control if doesn't exist (owners have no limits)
        if (!existingUser.costControl) {
          await prisma.costControl.create({
            data: {
              userId: updatedUser.id,
              monthlyBudget: null, // No limit
              hardLimit: false
            }
          });
        }

        console.log(`✅ Updated ${email} to OWNER role`);
      } else {
        // Create new user with OWNER role
        const newUser = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0],
            role: 'OWNER',
            isOwner: true,
            isPremium: true,
            subscriptionType: 'PREMIUM',
            maxConcurrentSessions: 10,
            creditBalance: 999999,
            monthlyCredits: 999999
          }
        });

        // Create session policy
        await prisma.sessionPolicy.create({
          data: {
            userId: newUser.id,
            maxConcurrentSessions: 10,
            sessionTimeout: 86400
          }
        });

        // Create cost control
        await prisma.costControl.create({
          data: {
            userId: newUser.id,
            monthlyBudget: null,
            hardLimit: false
          }
        });

        console.log(`✅ Created ${email} as OWNER`);
      }

      // Log owner setup (console only - OwnerAccessLog model pending)
      console.log('[OWNER_SETUP]', {
        action: 'OWNER_SETUP',
        email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error setting up ${email}:`, error.message);
    }
  }

  // Create owner config entries
  const configs = [{
      key: 'OWNER_EMAILS',
      value: OWNER_EMAILS,
      description: 'List of platform owner email addresses'
    },
    {
      key: 'MAX_SESSIONS_DEFAULT',
      value: {
        default: 2,
        premium: 5,
        owner: 10
      },
      description: 'Maximum concurrent sessions by user type'
    },
    {
      key: 'SESSION_SHARING_BLOCKED',
      value: {
        enabled: true,
        graceMinutes: 5
      },
      description: 'Prevent same account from multiple users'
    }
  ];

  for (const config of configs) {
    await prisma.ownerConfig.upsert({
      where: {
        key: config.key
      },
      update: {
        value: config.value
      },
      create: config
    });
    console.log(`📝 Config set: ${config.key}`);
  }

  console.log('\n✨ Owner setup complete!');
  console.log('\nOwner privileges:');
  console.log('  - Full access to client data');
  console.log('  - Payment cycle & billing management');
  console.log('  - Cost control system access');
  console.log('  - Client session tracking & termination');
  console.log('  - Unlimited credits & resources');
  console.log('  - Up to 10 concurrent sessions');
}

setupOwners()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
