import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedKeywords(prisma: PrismaClient) {
  console.log('🌱', 'Seeding keywords');

  const novels = await prisma.novel.findMany();
  if (novels.length === 0) {
    throw new Error('No novels found');
  }

  const keywordCategories = await prisma.keywordCategory.findMany();
  if (keywordCategories.length === 0) {
    throw new Error('No keyword categories found');
  }

  const keywordNatures = await prisma.keywordNature.findMany();
  if (keywordNatures.length === 0) {
    throw new Error('No keyword natures found');
  }

  const chapters = await prisma.chapter.findMany();
  if (chapters.length === 0) {
    throw new Error('No chapters found');
  }

  const promises = [];
  for (const novel of novels) {
    const keywordsNumbers = fakerAR.number.int({ min: 1, max: 100 });
    for (let i = 0; i < keywordsNumbers; i++) {
      promises.push(
        prisma.keyword.create({
          data: {
            name: fakerAR.person.fullName(),
            description: fakerAR.lorem.paragraph(),
            novelId: novel.id,
            categoryId: fakerAR.helpers.arrayElement(keywordCategories)?.id,
            natureId: fakerAR.helpers.arrayElement(keywordNatures)?.id,
          },
        }),
      );
    }
  }

  await Promise.all(promises);
}
