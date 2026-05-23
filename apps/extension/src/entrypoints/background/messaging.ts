import type { currentNovelMeta } from '@/types';
import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getCurrentNovel(): currentNovelMeta | undefined;
  getPageHtml(): { url: string; html: string } | undefined;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
