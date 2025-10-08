import type { websiteSelector } from '@/types/configs';

/**
 * Detects the site name based on the xpath or url
 */
export function getSiteName(): string {
  return window.location.hostname || 'local';
}

/**
 * Extracts novel name from URL
 */
export function getNovelName(websiteSelector: websiteSelector): string | null {
  if (websiteSelector.novel?.xpath) {
    return extractFromXpath(
      websiteSelector.novel?.xpath?.value || '',
      websiteSelector.novel?.xpath?.regex || '',
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
export function getChapterName(websiteSelector: websiteSelector): string | null {
  if (websiteSelector.chapter?.xpath) {
    return extractFromXpath(
      websiteSelector.chapter?.xpath?.value || '',
      websiteSelector.chapter?.xpath?.regex || '',
    );
  }

  if (websiteSelector.chapter.url) {
    return extractFromUrl(
      websiteSelector.chapter?.url?.value || '',
      websiteSelector.chapter?.url?.regex || '',
    );
  }

  return null;
}

/**
 * Extracts text from an xpath
 */
export function extractFromXpath(xpath: string, regex: string): string | null {
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
) {
  const websiteSelector = websiteSelectorData
    ? JSON.parse(websiteSelectorData || '{}')[website || '']
    : {};
  // only parse if websiteSelectorData.data.value is not null
  if (!websiteSelector) {
    console.log('Not a supported website selector, skipping content processing');
    return;
  }

  const novel = getNovelName(websiteSelector);
  // Only run on novel pages
  if (!novel) {
    console.log('Not a novel page, skipping content processing');
    return;
  }

  const chapter = getChapterName(websiteSelector);
  // Only run on novel chapter pages
  if (!chapter) {
    console.log('Not a novel chapter page, skipping content processing');
    return;
  }

  return { novel, chapter };
}
