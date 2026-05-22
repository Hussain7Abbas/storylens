import type { ContentScriptContext } from '#imports';
import { WEBSITES_SELECTORS_KEY } from '@/components/node-selector/constants';
import { getAllNovelData } from '@/utils/site-detection';
import { setupApiClient } from '@/utils/setup-api-client';
import { getConfigsByKey } from '@repo/api/configs.js';
import type { AxiosResponse } from 'axios';
import { onMessage } from '../background/messaging';

export async function runContentScript(_ctx: ContentScriptContext): Promise<void> {
  setupApiClient();

  console.log('🔥', 'StoryLens content script loaded');

  const websiteSelectorData = (await getConfigsByKey(
    WEBSITES_SELECTORS_KEY,
  )) as AxiosResponse<{
    value: string;
  }>;

  const website = window.location.hostname;
  console.log('🔥', 'website', website);

  if (!website) {
    console.log('Not a supported website, skipping content processing');
    return;
  }

  const siteDetails = getAllNovelData(
    websiteSelectorData?.data?.value,
    website,
    document,
  );

  if (!siteDetails) {
    console.log('Not a supported website, skipping content processing');
    return;
  }

  onMessage('getCurrentNovel', () => {
    return siteDetails;
  });

  console.log('🔥', 'siteDetails', siteDetails);
}
