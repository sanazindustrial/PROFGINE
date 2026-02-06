const {
  PrismaClient
} = require("@prisma/client");

const prisma = new PrismaClient();

const emails = [
  "ohaddad12@gmail.com",
  "Rjassaf13@gmail.com",
  "versorabusiness@gmail.com",
  "sanazindustrial@gmail.com",
];

const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const creditBalance = 10000;
const monthlyCredits = 10000;

async function main() {
  const results = [];

  for (const email of emails) {
    const user = await prisma.user.upsert({
      where: {
        email
      },
      update: {
        role: "ADMIN",
        isOwner: true,
        subscriptionType: "PREMIUM",
        subscriptionExpiresAt: oneYearFromNow,
        trialExpiresAt: null,
        creditBalance,
        monthlyCredits
      },
      create: {
        email,
        role: "ADMIN",
        isOwner: true,
        subscriptionType: "PREMIUM",
        subscriptionExpiresAt: oneYearFromNow,
        trialExpiresAt: null,
        creditBalance,
        monthlyCredits
      },
      select: {
        id: true,
        email: true,
        role: true,
        isOwner: true,
        subscriptionType: true,
        subscriptionExpiresAt: true,
        creditBalance: true,
        monthlyCredits: true
      },
    });

    await prisma.userSubscription.upsert({
      where: {
        userId: user.id
      },
      create: {
        user: {
          connect: {
            id: user.id
          }
        },
        tier: "ENTERPRISE",
        status: "ACTIVE",
        currentPeriodEnd: oneYearFromNow
      },
      update: {
        tier: "ENTERPRISE",
        status: "ACTIVE",
        currentPeriodEnd: oneYearFromNow
      }
    });

    results.push(user);
  }

  console.log({
    updated: results.length
  });
  console.log(results);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
