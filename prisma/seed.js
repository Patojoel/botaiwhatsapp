const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: 'admin', // En production, utiliser bcrypt
      name: 'Admin SaaS',
      role: 'ADMIN',
    },
  });

  const bot = await prisma.botInstance.upsert({
    where: { sessionId: 'default-bot' },
    update: {},
    create: {
      name: 'Mon Premier Bot AI',
      sessionId: 'default-bot',
      ownerId: user.id,
      status: 'DISCONNECTED',
    },
  });

  console.log('Seed terminé !');
  console.log('Compte:', user.email);
  console.log('BotInstance ID:', bot.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
