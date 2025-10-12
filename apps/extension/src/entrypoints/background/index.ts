// import { onMessage } from '@/entrypoints/background/messaging';
import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  console.log('🔥', 'Background script loaded');

  // === Listen for messages from content script ===

  // onMessage('getNovelName', (message) => {
  //   return message.data.length;
  // });
});
