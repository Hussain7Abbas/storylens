import { defineContentScript } from '#imports';
import { getNovels } from '@repo/api/novels.ts';

export default defineContentScript({
  main,
  matches: ['*://*/*'],
});

async function main() {
  console.log(
    'Hello content.',
    await getNovels({
      pagination: { page: 2, pageSize: 5 },
      sorting: { column: 'name', direction: 'asc' },
    }),
  );
}
