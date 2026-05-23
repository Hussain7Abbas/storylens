import type { WebsiteSelector } from '../schemas/chapter-selector';
import { createDocumentFromHtml, extractTextFromXpath } from './xpath';

export type SelectorValidation = {
  novelSlug: string | null;
  chapter: number | null;
  errors: string[];
};

function extractFromUrl(pageUrl: string, regex: string): string | null {
  const match = pageUrl.match(new RegExp(regex));
  return match ? (match[1] ?? null) : null;
}

function isValidNovelSlug(slug: string | null): slug is string {
  return !!slug && slug.length >= 2 && !/^https?:?$/.test(slug);
}

export function validateWebsiteSelectors(
  selectors: WebsiteSelector,
  pageUrl: string,
  html: string,
): SelectorValidation {
  const document = createDocumentFromHtml(html);
  const errors: string[] = [];

  let novelSlug: string | null = null;

  if (selectors.novel.xpath?.value) {
    novelSlug = extractTextFromXpath(
      selectors.novel.xpath.value,
      selectors.novel.xpath.regex,
      document,
    );
    if (!isValidNovelSlug(novelSlug)) {
      errors.push('Novel XPath did not match a valid novel slug.');
    }
  } else if (selectors.novel.url?.regex) {
    novelSlug = extractFromUrl(pageUrl, selectors.novel.url.regex);
    if (!isValidNovelSlug(novelSlug)) {
      errors.push('Novel URL regex did not match a valid novel slug.');
    }
  } else {
    errors.push('No novel selector (XPath or URL regex) was provided.');
  }

  let chapter: number | null = null;

  if (selectors.chapter.xpath?.value) {
    const chapterText = extractTextFromXpath(
      selectors.chapter.xpath.value,
      selectors.chapter.xpath.regex,
      document,
    );
    chapter = chapterText ? Number.parseInt(chapterText, 10) : null;
    if (!chapter || Number.isNaN(chapter)) {
      errors.push('Chapter XPath did not produce a valid chapter number.');
    }
  } else if (selectors.chapter.url?.regex) {
    const chapterText = extractFromUrl(pageUrl, selectors.chapter.url.regex);
    chapter = chapterText ? Number.parseInt(chapterText, 10) : null;
    if (!chapter || Number.isNaN(chapter)) {
      errors.push('Chapter URL regex did not produce a valid chapter number.');
    }
  } else {
    errors.push('No chapter selector (XPath or URL regex) was provided.');
  }

  return { novelSlug, chapter, errors };
}
