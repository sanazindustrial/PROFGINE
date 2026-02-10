const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function resyncUsers() {
  console.log("🔄 Resyncing user display data...");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isOwner: true,
      subscriptionType: true,
      creditBalance: true,
      monthlyCredits: true
    },
  });

  let updated = 0;

  for (const user of users) {
    const nextName = user.name && user.name.trim() ? user.name : user.email.split("@")[0];
    const nextImage = user.image && user.image.trim() ?
      user.image :
      `https://ui-avatars.com/api/?name=${encodeURIComponent(nextName)}&background=0D8ABC&color=fff`;

    const defaultCredits = user.subscriptionType === "BASIC" ? 200 : user.subscriptionType === "PREMIUM" ? 500 : 50;
    const shouldSeedCredits = (user.creditBalance ?? 0) === 0 && (user.monthlyCredits ?? 0) === 0;

    if (nextName !== user.name || nextImage !== user.image || shouldSeedCredits) {
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          name: nextName,
          image: nextImage,
          ...(shouldSeedCredits ? { creditBalance: defaultCredits, monthlyCredits: defaultCredits } : {})
        },
      });
      updated += 1;
    }

    await prisma.userSubscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tier: "FREE_TRIAL", status: "TRIALING" },
      update: {}
    });

    await prisma.userUsageCounter.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {}
    });
  }

  console.log(`
Done. Updated ${updated} user(s) out of ${users.length}.`);
}

resyncUsers()
  .catch((error) => {
    console.error("❌ Resync failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
