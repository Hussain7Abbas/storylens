const LEADING_SEPARATORS = /^[\s\-|:·–—]+/;

const METADATA_SUFFIXES = [/\s*مترجمة\s*$/iu, /\s*translated\s*$/iu, /\s*raw\s*$/iu];

function stripMetadataSuffixes(title: string): string {
  let result = title;
  for (const suffix of METADATA_SUFFIXES) {
    result = result.replace(suffix, '').trim();
  }
  return result;
}

export function cleanNovelTitle(raw: string): string {
  let title = raw.replace(/\s+/g, ' ').trim();
  title = title.replace(LEADING_SEPARATORS, '').trim();

  const dashParts = title.split(/\s[-–—]\s/);
  if (dashParts.length >= 3) {
    title = dashParts.slice(1, -1).join(' - ').trim();
  } else if (dashParts.length === 2) {
    const [first, second] = dashParts;
    const firstPart = first?.trim() ?? '';
    const secondPart = second?.trim() ?? '';

    if (!firstPart || /^[\s\-|:·–—]+$/.test(firstPart)) {
      title = secondPart;
    } else if (secondPart.length <= firstPart.length) {
      title = firstPart;
    }
  }

  title = stripMetadataSuffixes(title);
  title = title.replace(LEADING_SEPARATORS, '').trim();

  return stripMetadataSuffixes(title);
}

function getRawTextFromXpath(xpath: string, document: Document): string {
  const element = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  );
  return (
    element.singleNodeValue?.textContent
      ?.replaceAll('\n', ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

export function extractNovelNameFromXpath(
  xpath: string,
  regex: string,
  document: Document,
): string | null {
  const textContent = getRawTextFromXpath(xpath, document);
  if (!textContent) {
    return null;
  }

  try {
    const match = textContent.match(regex);
    if (match) {
      const captured = match[1] ?? match[0];
      if (captured) {
        const cleaned = cleanNovelTitle(captured);
        if (cleaned.length >= 2) {
          return cleaned;
        }
      }
    }
  } catch {
    // Fall through to cleaning the full xpath text.
  }

  const cleaned = cleanNovelTitle(textContent);
  return cleaned.length >= 2 ? cleaned : null;
}

export function extractFromXpath(
  xpath: string,
  regex: string,
  document: Document,
): string | null {
  const textContent = getRawTextFromXpath(xpath, document);
  if (!textContent) {
    return null;
  }

  const match = textContent.match(regex);
  return match ? (match[1] ?? match[0]) : null;
}
