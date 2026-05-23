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
