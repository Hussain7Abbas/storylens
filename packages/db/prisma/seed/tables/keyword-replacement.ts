import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedKeywordReplacement(prisma: PrismaClient) {
  console.log('🌱', 'Seeding keyword replacements');
  const novels = await prisma.novel.findMany();
  if (novels.length === 0) {
    throw new Error('No novels found');
  }

  const keywords = await prisma.keyword.findMany();
  if (keywords.length === 0) {
    throw new Error('No keywords found');
  }

  const replacementsNumbers = fakerAR.number.int({ min: 1, max: 10 });

  const promises = [];
  for (let i = 0; i < replacementsNumbers; i++) {
    const isLinkedToKeyword = fakerAR.helpers.weightedArrayElement([
      { value: true, weight: 3 },
      { value: false, weight: 7 },
    ]);
    promises.push(
      prisma.replacement.create({
        data: {
          from: fakerAR.person.fullName(),
          to: fakerAR.person.fullName(),
          novel: {
            connect: {
              id: fakerAR.helpers.arrayElement(novels).id,
            },
          },
          keyword: isLinkedToKeyword
            ? {
                connect: {
                  id: fakerAR.helpers.arrayElement(keywords).id,
                },
              }
            : undefined,
        },
      }),
    );
  }
  await Promise.all(promises);
}
