import type { currentNovelMeta } from '@/types';
import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getCurrentNovel(): currentNovelMeta | undefined;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
