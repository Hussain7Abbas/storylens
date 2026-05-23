import { parseHTML } from 'linkedom';

const DEFAULT_MAX_CONTEXT_CHARS = 18_000;
const MAX_TEXT_SNIPPET = 160;
const MAX_ELEMENTS = 120;

const INTERESTING_SELECTOR =
  'h1,h2,h3,h4,h5,h6,nav,[role="navigation"],[aria-label],link[rel="canonical"],[id],[class*="chapter"],[class*="novel"],[class*="title"],[class*="breadcrumb"]';

function truncate(text: string, max = MAX_TEXT_SNIPPET) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

function getElementXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === 1 && current.tagName !== 'HTML') {
    const tagName = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;

    if (!parent) {
      segments.unshift(tagName);
      break;
    }

    const siblings = [...parent.children].filter(
      (child) => child.tagName === current?.tagName,
    );
    const index = siblings.indexOf(current) + 1;
    segments.unshift(`${tagName}[${index}]`);
    current = parent;
  }

  return `/${segments.join('/')}`;
}

function collectInterestingElements(document: Document) {
  const elements = [...document.querySelectorAll(INTERESTING_SELECTOR)];
  const lines: string[] = [];

  for (const element of elements.slice(0, MAX_ELEMENTS)) {
    const xpath = getElementXPath(element);
    const text = truncate(element.textContent ?? '');
    const attrs = [
      element.id ? `id="${element.id}"` : null,
      element.className ? `class="${truncate(String(element.className), 80)}"` : null,
      element.getAttribute('aria-label')
        ? `aria-label="${truncate(element.getAttribute('aria-label') ?? '', 80)}"`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    lines.push(
      `- <${element.tagName.toLowerCase()}${attrs ? ` ${attrs}` : ''}> xpath=${xpath}${text ? ` text="${text}"` : ''}`,
    );
  }

  return lines;
}

export function extractPageContextForAgent(
  html: string,
  url: string,
  maxChars = DEFAULT_MAX_CONTEXT_CHARS,
) {
  const { document } = parseHTML(html);
  const parsedUrl = new URL(url);
  const lines: string[] = [
    `URL: ${url}`,
    `Hostname: ${parsedUrl.hostname}`,
    `Path segments: ${parsedUrl.pathname.split('/').filter(Boolean).join(' / ')}`,
    `Title: ${truncate(document.title || '(empty)', 200)}`,
  ];

  const canonical = document
    .querySelector('link[rel="canonical"]')
    ?.getAttribute('href');
  if (canonical) {
    lines.push(`Canonical: ${canonical}`);
  }

  for (const meta of document.querySelectorAll('meta[name], meta[property]')) {
    const name = meta.getAttribute('name') ?? meta.getAttribute('property');
    const content = meta.getAttribute('content');
    if (name && content) {
      lines.push(`Meta ${name}: ${truncate(content, 120)}`);
    }
  }

  lines.push('', 'Interesting elements:');
  lines.push(...collectInterestingElements(document as unknown as Document));

  const context = lines.join('\n');
  if (context.length <= maxChars) {
    return context;
  }

  return `${context.slice(0, maxChars)}\n<!-- truncated -->`;
}

const COPY_PROTECTION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'oncopy handler', pattern: /\boncopy\s*=/i },
  { label: 'oncut handler', pattern: /\boncut\s*=/i },
  { label: 'onpaste handler', pattern: /\bonpaste\s*=/i },
  { label: 'onselectstart handler', pattern: /\bonselectstart\s*=/i },
  { label: 'oncontextmenu handler', pattern: /\boncontextmenu\s*=/i },
  { label: 'ondragstart handler', pattern: /\bondragstart\s*=/i },
  { label: 'user-select:none CSS', pattern: /user-select\s*:\s*none/i },
  {
    label: 'user-select:none !important CSS',
    pattern: /user-select\s*:\s*none\s*!important/i,
  },
  {
    label: '-webkit-user-select:none CSS',
    pattern: /-webkit-user-select\s*:\s*none/i,
  },
  { label: 'pointer-events:none CSS', pattern: /pointer-events\s*:\s*none/i },
  {
    label: '-webkit-touch-callout:none CSS',
    pattern: /-webkit-touch-callout\s*:\s*none/i,
  },
  { label: 'unselectable attribute', pattern: /\bunselectable\s*=\s*['"]?on/i },
  {
    label: 'copy event listener',
    pattern: /addEventListener\s*\(\s*['"]copy['"]/i,
  },
  {
    label: 'selectstart event listener',
    pattern: /addEventListener\s*\(\s*['"]selectstart['"]/i,
  },
  {
    label: 'contextmenu event listener',
    pattern: /addEventListener\s*\(\s*['"]contextmenu['"]/i,
  },
  {
    label: 'keydown copy shortcut blocker',
    pattern: /key(?:Code|)\s*===?\s*67|ctrlKey.*[cC]|metaKey.*[cC]/i,
  },
  { label: 'disable copy script', pattern: /disable.*copy|no-?copy|anti-?copy/i },
  {
    label: 'selection overlay',
    pattern: /pointer-events\s*:\s*none[\s\S]{0,80}(?:overlay|mask|protect)/i,
  },
];

function detectCopyProtectionSignals(html: string): string[] {
  const signals: string[] = [];

  for (const { label, pattern } of COPY_PROTECTION_PATTERNS) {
    if (pattern.test(html)) {
      signals.push(label);
    }
  }

  return signals;
}

export function extractCopyProtectionHints(html: string): string {
  const signals = detectCopyProtectionSignals(html);
  if (signals.length === 0) {
    return 'Copy protection signals: none detected';
  }

  return `Copy protection signals detected:\n${signals.map((signal) => `- ${signal}`).join('\n')}`;
}

const REMOVE_TAGS = ['script', 'style', 'noscript', 'svg', 'iframe'];

export function prepareHtmlForAgent(
  html: string,
  maxChars = DEFAULT_MAX_CONTEXT_CHARS,
) {
  let sanitized = html;

  for (const tag of REMOVE_TAGS) {
    sanitized = sanitized.replace(
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'),
      '',
    );
  }

  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  if (sanitized.length <= maxChars) {
    return sanitized;
  }

  const head = sanitized.slice(0, Math.floor(maxChars * 0.65));
  const tail = sanitized.slice(-Math.floor(maxChars * 0.25));

  return `${head}\n<!-- truncated -->\n${tail}`;
}

export function getHostnameFromUrl(url: string) {
  return new URL(url).hostname;
}
