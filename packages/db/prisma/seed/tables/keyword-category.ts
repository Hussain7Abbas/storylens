import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedKeywordCategory(prisma: PrismaClient) {
  console.log('🌱', 'Seeding keyword categories');

  const keywordCategoriesNumbers = 10;

  const promises = [];
  for (let i = 0; i < keywordCategoriesNumbers; i++) {
    promises.push(
      prisma.keywordCategory.create({
        data: {
          name: fakerAR.book.genre(),
          color: fakerAR.color.rgb(),
        },
      }),
    );
  }
  await Promise.all(promises);
}
