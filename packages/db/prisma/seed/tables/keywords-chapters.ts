import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedKeywordsChapters(prisma: PrismaClient) {
  console.log('🌱', 'Seeding keywords chapters');

  const keywords = await prisma.keyword.findMany();
  if (keywords.length === 0) {
    throw new Error('No keywords found');
  }

  const chapters = await prisma.chapter.findMany();
  if (chapters.length === 0) {
    throw new Error('No chapters found');
  }

  const promises = [];
  for (const chapter of chapters) {
    const keywordsNumbers = fakerAR.number.int({ min: 1, max: 10 });
    for (let i = 0; i < keywordsNumbers; i++) {
      promises.push(
        prisma.keywordsChapters.create({
          data: {
            keywordId: fakerAR.helpers.arrayElement(keywords)?.id,
            chapterId: chapter.id,
          },
        }),
      );
    }
  }

  await Promise.all(promises);
}
