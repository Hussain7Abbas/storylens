import type {
  Keyword,
  Replacement,
  SiteName,
  TooltipElement,
} from '../types/content';

/**
 * Keyword replacement utilities for content processing
 */
export class KeywordReplacer {
  private keywords: Record<string, Keyword> = {};
  private replacements: Record<string, Replacement> = {};
  private siteName: SiteName;

  constructor(siteName: SiteName) {
    this.siteName = siteName;
  }

  /**
   * Updates the keywords and replacements data
   */
  updateData(
    keywords: Record<string, Keyword>,
    replacements: Record<string, Replacement>,
  ): void {
    this.keywords = keywords;
    this.replacements = replacements;
  }

  /**
   * Processes and replaces content in the page
   */
  processContent(): void {
    const contentElements = this.getContentElements();

    for (const element of contentElements) {
      this.processElement(element);
    }
  }

  /**
   * Gets the appropriate content elements based on the site
   */
  private getContentElements(): HTMLCollectionOf<Element> {
    let elements: HTMLCollectionOf<Element>;

    if (this.siteName === 'kolnovel') {
      const tagsList = document.getElementsByClassName('epwrapper');
      if (tagsList.length > 0) {
        // Convert various tags to paragraphs for kolnovel
        this.convertTagsToParagraphs(tagsList[0]);
        elements = tagsList[0].getElementsByTagName('p');
      } else {
        elements = document.getElementsByTagName('p');
      }
    } else if (this.siteName === 'riwyat') {
      const chapterBody = document.querySelector('.reading-content');
      if (chapterBody) {
        this.cleanRiwyatContent(chapterBody);
        elements = chapterBody.getElementsByTagName('p');
      } else {
        elements = document.getElementsByTagName('p');
      }
    } else {
      elements = document.getElementsByTagName('p');
    }

    return elements;
  }

  /**
   * Converts various HTML tags to paragraphs for kolnovel
   */
  private convertTagsToParagraphs(container: Element): void {
    const tagReplacements = [
      { from: 'strong', to: 'p' },
      { from: 'h5', to: 'p' },
      { from: 'h4', to: 'p' },
      { from: 'h3', to: 'p' },
      { from: 'h2', to: 'p' },
      { from: 'h1', to: 'p' },
    ];

    let html = container.innerHTML;

    // Replace tags
    for (const replacement of tagReplacements) {
      html = html.replaceAll(`<${replacement.from}>`, `<${replacement.to}>`);
      html = html.replaceAll(`</${replacement.from}>`, `</${replacement.to}>`);
    }

    // Remove specific font styles
    html = html.replaceAll(
      'font-family: custom_font_1, serif;font-size: 18px;font-weight: bold;',
      ' ',
    );
    html = html.replaceAll('font-family: custom_font_1, serif;font-size: 18px;', ' ');

    container.innerHTML = html;
  }

  /**
   * Cleans content for riwyat site
   */
  private cleanRiwyatContent(container: Element): void {
    let html = container.innerHTML;

    // Remove empty paragraphs and non-breaking spaces
    html = html.replaceAll(`<p style="text-align: center;">\n</p>`, '');
    html = html.replaceAll('&nbsp;', '');

    container.innerHTML = html;
  }

  /**
   * Processes a single element for keyword and replacement processing
   */
  private processElement(element: Element): void {
    let html = element.innerHTML;

    // Apply replacements first
    for (const replacement of Object.values(this.replacements)) {
      html = html.replaceAll(replacement.replacement, replacement.replacement);
    }

    // Apply keyword replacements with tooltips
    for (const keyword of Object.values(this.keywords)) {
      const keywordRegex = new RegExp(keyword.name, 'g');
      html = html.replace(keywordRegex, this.createKeywordTooltip(keyword));
    }

    element.innerHTML = html;
  }

  /**
   * Creates HTML for keyword tooltip
   */
  private createKeywordTooltip(keyword: Keyword): string {
    const categoryColor = keyword.category.color;
    const natureColor = keyword.nature.color;
    const imageHtml = keyword.image
      ? `<img src="${keyword.image.url}" alt="${keyword.name}" />`
      : '';

    return `
      <span class="tooltip1 keyword-tooltip" style="color: ${natureColor}">
        <span class="category-indicator" style="background-color: ${categoryColor}"></span>
        ${keyword.name}
        <span class="tooltiptext1">
          ${imageHtml}
          <div class="keyword-info">
            <strong>${keyword.name}</strong>
            <p>${keyword.description}</p>
            <div class="keyword-meta">
              <span class="category" style="color: ${categoryColor}">${keyword.category.name}</span>
              <span class="nature" style="color: ${natureColor}">${keyword.nature.name}</span>
            </div>
          </div>
        </span>
      </span>
    `;
  }

  /**
   * Removes all keyword tooltips from the page
   */
  removeTooltips(): void {
    const tooltips = document.querySelectorAll('.tooltip1');
    tooltips.forEach((tooltip) => {
      const parent = tooltip.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(tooltip.textContent || ''),
          tooltip,
        );
        parent.normalize();
      }
    });
  }
}
