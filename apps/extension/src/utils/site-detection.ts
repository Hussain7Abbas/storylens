import type { SiteName } from '../types/content';

/**
 * Detects the site name based on the current URL
 */
export function getSiteName(urlParts: string[]): SiteName {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes('kolnovel')) {
    return 'kolnovel';
  }

  if (hostname.includes('riwyat')) {
    return 'riwyat';
  }

  return 'other';
}

/**
 * Extracts novel name from URL
 */
export function getNovelName(urlParts: string[]): string {
  // Extract novel name from URL - this might need adjustment based on site structure
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  // For most novel sites, the novel name is usually in the path
  // This is a generic implementation that might need site-specific adjustments
  return pathParts[pathParts.length - 1] || 'unknown';
}

/**
 * Checks if the current page is a novel chapter page
 */
export function isNovelChapterPage(): boolean {
  const pathname = window.location.pathname.toLowerCase();

  // Common patterns for novel chapter pages
  return (
    pathname.includes('/chapter/') ||
    pathname.includes('/ch/') ||
    pathname.includes('/read/') ||
    pathname.includes('/novel/')
  );
}
