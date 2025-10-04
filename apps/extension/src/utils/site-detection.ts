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
  if (websiteSelector.novel.xpath) {
    return extractFromXpath(
      websiteSelector.novel.xpath.value,
      websiteSelector.novel.xpath.regex,
    );
  }

  if (websiteSelector.novel.url) {
    return extractFromUrl(
      websiteSelector.novel.url.value,
      websiteSelector.novel.url.regex,
    );
  }

  return null;
}

/**
 * Checks if the current page is a novel chapter page
 */
export function getChapterName(websiteSelector: websiteSelector): string | null {
  if (websiteSelector.chapter.xpath) {
    return extractFromXpath(
      websiteSelector.chapter.xpath.value,
      websiteSelector.chapter.xpath.regex,
    );
  }

  if (websiteSelector.chapter.url) {
    return extractFromUrl(
      websiteSelector.chapter.url.value,
      websiteSelector.chapter.url.regex,
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
  const textContent = element.singleNodeValue?.textContent || '';
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
