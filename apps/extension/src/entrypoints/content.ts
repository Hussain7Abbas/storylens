import { defineContentScript } from '#imports';
import { getNovels } from '@repo/api/novels.ts';

export default defineContentScript({
  main,
  matches: ['*://*/*'],
});

async function main() {
  console.log('Hello content.', await getNovels({ page: '2', limit: '5' }));
}
