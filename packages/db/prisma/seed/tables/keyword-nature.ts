import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedKeywordNature(prisma: PrismaClient) {
  console.log('🌱', 'Seeding keyword natures');

  const keywordNaturesNumbers = 10;

  const promises = [];
  for (let i = 0; i < keywordNaturesNumbers; i++) {
    promises.push(
      prisma.keywordNature.create({
        data: {
          name: fakerAR.lorem.word(),
          color: fakerAR.color.rgb(),
        },
      }),
    );
  }
  await Promise.all(promises);
}
