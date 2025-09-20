import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedChapters(prisma: PrismaClient) {
  console.log('🌱', 'Seeding chapters');

  const novels = await prisma.novel.findMany();

  if (novels.length === 0) {
    throw new Error('No novels found');
  }

  const promises = [];
  for (const novel of novels) {
    const chaptersNumbers = fakerAR.number.int({ min: 1, max: 100 });
    for (let i = 0; i < chaptersNumbers; i++) {
      promises.push(
        prisma.chapter.create({
          data: {
            name: `${i + 1} - ${fakerAR.book.title()}`,
            description: fakerAR.lorem.paragraph(),
            number: i + 1,
            novelId: novel.id,
          },
        }),
      );
    }
  }

  await Promise.all(promises);
}
