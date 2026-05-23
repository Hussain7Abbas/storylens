import type { ApiProxyRequest, ApiProxyResponse } from '@/types/api-proxy';
import type { currentNovelMeta } from '@/types';
import type { OnLoadScriptResult } from '@/utils/inject-on-load-script';
import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getCurrentNovel(): currentNovelMeta | undefined;
  getPageHtml(): { url: string; html: string } | undefined;
  reportCurrentNovel(data: currentNovelMeta): void;
  getCachedTabNovel(tabId: number): currentNovelMeta | undefined;
  getWebsiteSelectors(): string | undefined;
  runOnLoadScript(data: { script: string }): OnLoadScriptResult;
  refreshContent(): void;
  apiRequest<T = unknown>(data: ApiProxyRequest): ApiProxyResponse<T>;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
