import type { currentNovelMeta } from '@/types';
import type { websiteSelector } from '@/types/configs';

/**
 * Detects the site name based on the xpath or url
 */
export function getSiteName(): string {
  return window?.location?.hostname || 'local';
}

/**
 * Extracts novel name from URL
 */
export function getNovelName(
  websiteSelector: websiteSelector,
  document: Document,
): string | null {
  if (websiteSelector.novel?.xpath) {
    return extractFromXpath(
      websiteSelector.novel?.xpath?.value || '',
      websiteSelector.novel?.xpath?.regex || '',
      document,
    );
  }

  if (websiteSelector.novel?.url) {
    return extractFromUrl(
      websiteSelector.novel?.url?.value || '',
      websiteSelector.novel?.url?.regex || '',
    );
  }

  return null;
}

/**
 * Checks if the current page is a novel chapter page
 */
export function getChapterNumber(
  websiteSelector: websiteSelector,
  document: Document,
): number | null {
  if (websiteSelector.chapter?.xpath) {
    return Number.parseInt(
      extractFromXpath(
        websiteSelector.chapter?.xpath?.value || '',
        websiteSelector.chapter?.xpath?.regex || '',
        document,
      ) || '0',
      10,
    );
  }

  if (websiteSelector.chapter.url) {
    return Number.parseInt(
      extractFromUrl(
        websiteSelector.chapter?.url?.value || '',
        websiteSelector.chapter?.url?.regex || '',
      ) || '0',
      10,
    );
  }

  return null;
}

/**
 * Extracts text from an xpath
 */
export function extractFromXpath(
  xpath: string,
  regex: string,
  document: Document,
): string | null {
  const element = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  );
  const textContent =
    element.singleNodeValue?.textContent?.replaceAll('\n', '').trim() || '';
  const match = textContent.match(regex);
  return match ? match[0] : null;
}

/**
 * Extracts text from a url
 */
export function extractFromUrl(url: string, regex: string): string | null {
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function getAllNovelData(
  websiteSelectorData: string | undefined,
  website: string | undefined,
  document: Document,
): currentNovelMeta | undefined {
  const websiteSelector = websiteSelectorData
    ? JSON.parse(websiteSelectorData || '{}')[website || '']
    : {};
  // only parse if websiteSelectorData.data.value is not null
  if (!websiteSelector) {
    console.log('Not a supported website selector, skipping content processing');
    return;
  }

  const novel = getNovelName(websiteSelector, document);
  // Only run on novel pages
  if (!novel) {
    console.log('Not a novel page, skipping content processing');
    return;
  }

  const chapter = getChapterNumber(websiteSelector, document);
  // Only run on novel chapter pages
  if (!chapter) {
    console.log('Not a novel chapter page, skipping content processing');
    return;
  }

  return { novelName: novel, chapter };
}
