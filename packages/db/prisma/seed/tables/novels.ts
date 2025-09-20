import type { PrismaClient } from '@prisma/client';
import { fakerAR } from '@faker-js/faker';

export async function seedNovels(prisma: PrismaClient) {
  console.log('🌱', 'Seeding novels');

  const novelsNumbers = fakerAR.number.int({ min: 1, max: 100 });
  const promises = [];

  for (let i = 0; i < novelsNumbers; i++) {
    promises.push(
      prisma.novel.create({
        data: { name: fakerAR.book.title(), description: fakerAR.lorem.paragraph() },
      }),
    );
  }
  await Promise.all(promises);
}
