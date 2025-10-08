import { type ContentScriptContext, defineContentScript } from '#imports';
import { getSiteName, getAllNovelData } from '../../utils/site-detection';
import './content.css';

// Import browser types and API
import { WEBSITES_SELECTORS_KEY } from '@/components/node-selector/constants';
import { getConfigsByKey } from '@repo/api/configs.js';
import type { AxiosResponse } from 'axios';

export default defineContentScript({
  matches: ['<all_urls>'],
  main,
});

/**
 * Main content script function
 */
async function main(ctx: ContentScriptContext): Promise<void> {
  console.log('🔥', 'StoryLens content script loaded');

  const websiteSelectorData = (await getConfigsByKey(
    WEBSITES_SELECTORS_KEY,
  )) as AxiosResponse<{
    value: string;
  }>;

  const website = getSiteName();
  console.log('🔥', 'website', website);
  if (!website) {
    console.log('Not a supported website, skipping content processing');
    return;
  }

  const novelData = getAllNovelData(websiteSelectorData?.data?.value, website);
  if (!novelData) {
    return;
  }

  console.log('🔥', 'Processing content for', {
    website,
    novel: novelData?.novel,
    chapter: novelData?.chapter,
  });
}
