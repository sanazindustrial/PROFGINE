/**
 * Setup Platform Owner
 * 
 * This script marks an existing ADMIN user as the platform owner.
 * Only platform owners (isOwner = true) can access user management.
 * Regular admins will not have this privilege.
 */

const {
  PrismaClient
} = require('@prisma/client');
const prisma = new PrismaClient();

async function setupOwner() {
  try {
    console.log('🔍 Finding ADMIN users...\n');

    // Find all ADMIN users
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        isOwner: true
      }
    });

    if (admins.length === 0) {
      console.log('❌ No ADMIN users found!');
      console.log('Please create an admin user first using setup-admin.js\n');
      process.exit(1);
    }

    console.log(`Found ${admins.length} ADMIN user(s):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} (${admin.name || 'No name'}) ${admin.isOwner ? '👑 Already Owner' : ''}`);
    });

    // If only one admin, make them owner automatically
    let ownerEmail;
    if (admins.length === 1) {
      ownerEmail = admins[0].email;
      console.log(`\n✅ Auto-selecting: ${ownerEmail}`);
    } else {
      // If multiple admins, prompt for selection
      console.log('\n⚠️  Multiple admins found!');
      console.log('Please edit this script and set the email of the user you want to be owner.\n');
      console.log('Example: const ownerEmail = "your-email@example.com";');
      process.exit(0);
    }

    // Update the user to be owner
    const updatedUser = await prisma.user.update({
      where: {
        email: ownerEmail
      },
      data: {
        isOwner: true
      },
      select: {
        email: true,
        name: true,
        role: true,
        isOwner: true
      }
    });

    console.log('\n✅ Platform Owner set successfully!\n');
    console.log('Owner Details:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Name: ${updatedUser.name || 'Not set'}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log(`  Is Owner: ${updatedUser.isOwner ? '👑 Yes' : 'No'}`);
    console.log('\n📝 Notes:');
    console.log('  - Only platform owners can access /user-management');
    console.log('  - Regular admins will not have access to user management');
    console.log('  - You can have multiple owners by running this script again\n');

  } catch (error) {
    console.error('❌ Error setting up owner:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupOwner();
