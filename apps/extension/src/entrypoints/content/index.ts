import { type ContentScriptContext, defineContentScript } from '#imports';
import {
  getSiteName,
  getNovelName,
  getChapterName,
} from '../../utils/site-detection';
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
  console.log('🔥', 'ctx', ctx);

  console.log('StoryLens content script loaded');

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

  const websiteSelector = websiteSelectorData?.data?.value
    ? JSON.parse(websiteSelectorData.data.value)[website]
    : {};
  console.log('🔥', 'websiteSelector', {
    websiteSelector,
    websiteSelectorData,
    rawValue: websiteSelectorData.data.value,
    parsedValue: JSON.parse(websiteSelectorData.data.value),
  });
  if (!websiteSelector) {
    console.log('Not a supported website selector, skipping content processing');
    return;
  }

  const novel = getNovelName(websiteSelector);
  if (!novel) {
    console.log('Not a novel page, skipping content processing');
    return;
  }

  const chapter = getChapterName(websiteSelector);
  if (!chapter) {
    console.log('Not a novel chapter page, skipping content processing');
    return;
  }

  // Only run on novel pages
  if (!novel) {
    console.log('Not a novel page, skipping content processing');
    return;
  }

  // Only run on novel chapter pages
  if (!chapter) {
    console.log('Not a novel chapter page, skipping content processing');
    return;
  }

  console.log('🔥', 'Processing content for', { website, novel, chapter });
}
