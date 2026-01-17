import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUserOnSignIn(user: any) {
    try {
        // Check if user already has subscription records
        const existingUserSub = await prisma.userSubscription.findUnique({
            where: { userId: user.id }
        });

        if (!existingUserSub) {
            console.log(`Creating subscription records for new user: ${user.email}`);

            // Create individual user subscription + usage
            await prisma.userSubscription.create({
                data: {
                    userId: user.id,
                    tier: "FREE_TRIAL",
                    status: "TRIALING"
                },
            });

            await prisma.userUsageCounter.create({
                data: { userId: user.id },
            });

            // Optional: Also create an organization for them
            // Uncomment this if you want every user to have their own org by default
            /*
            const org = await prisma.organization.create({
              data: {
                name: user.name ? `${user.name}'s Organization` : `${user.email}'s Organization`,
                members: { 
                  create: { 
                    userId: user.id, 
                    orgRole: "OWNER" 
                  } 
                },
                subscription: { 
                  create: { 
                    tier: "FREE_TRIAL", 
                    status: "TRIALING" 
                  } 
                },
                usage: { create: {} },
              },
            });
      
            console.log("Auto-created organization:", org.id);
            */

            console.log(`Successfully created user subscription records for ${user.email}`);
        }
    } catch (error) {
        console.error('Error creating user subscription records:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// For manual user creation scripts
export async function ensureAllUsersHaveSubscriptions() {
    const users = await prisma.user.findMany({
        include: {
            userSubscription: true,
            userUsage: true,
        }
    });

    console.log(`Found ${users.length} users to check...`);

    for (const user of users) {
        if (!user.userSubscription) {
            console.log(`Creating subscription for existing user: ${user.email}`);
            await prisma.userSubscription.create({
                data: {
                    userId: user.id,
                    tier: "FREE_TRIAL",
                    status: "TRIALING"
                },
            });
        }

        if (!user.userUsage) {
            console.log(`Creating usage counter for existing user: ${user.email}`);
            await prisma.userUsageCounter.create({
                data: { userId: user.id },
            });
        }
    }

    console.log('Finished ensuring all users have subscription records');
    await prisma.$disconnect();
}

export { prisma };