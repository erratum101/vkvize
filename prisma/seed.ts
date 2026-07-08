import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  'Общие знания',
  'История',
  'Наука',
  'География',
  'Спорт',
  'Музыка',
  'Кино и сериалы',
  'IT и технологии',
  'Литература',
  'Искусство',
];

async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
