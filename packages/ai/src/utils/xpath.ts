import { JSDOM } from 'jsdom';

export function createDocumentFromHtml(html: string) {
  return new JSDOM(html).window.document;
}

export function extractTextFromXpath(
  xpathExpression: string,
  regex: string,
  document: Document,
): string | null {
  const xpathResultType =
    document.defaultView?.XPathResult.FIRST_ORDERED_NODE_TYPE ?? 9;

  const result = document.evaluate(
    xpathExpression,
    document,
    null,
    xpathResultType,
    null,
  );

  const textContent =
    result.singleNodeValue?.textContent?.replaceAll('\n', '').trim() ?? '';
  const match = textContent.match(new RegExp(regex));
  return match ? (match[1] ?? match[0] ?? null) : null;
}
