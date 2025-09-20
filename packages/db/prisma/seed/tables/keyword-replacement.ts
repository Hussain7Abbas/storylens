import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedKeywordReplacement(prisma: PrismaClient) {
  console.log('🌱', 'Seeding keyword replacements');

  const keywords = await prisma.keyword.findMany();
  if (keywords.length === 0) {
    throw new Error('No keywords found');
  }

  const replacementsNumbers = fakerAR.number.int({ min: 1, max: 10 });

  const promises = [];
  for (let i = 0; i < replacementsNumbers; i++) {
    promises.push(
      prisma.replacement.create({
        data: {
          replacement: fakerAR.person.fullName(),
          keyword: {
            connect: {
              id: fakerAR.helpers.arrayElement(keywords).id,
            },
          },
        },
      }),
    );
  }
  await Promise.all(promises);
}
