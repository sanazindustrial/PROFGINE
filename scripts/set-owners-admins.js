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

async function main() {
  const results = [];

  for (const email of emails) {
    const user = await prisma.user.upsert({
      where: {
        email
      },
      update: {
        role: "ADMIN",
        isOwner: true
      },
      create: {
        email,
        role: "ADMIN",
        isOwner: true,
      },
      select: {
        email: true,
        role: true,
        isOwner: true
      },
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
