import { defineContentScript } from '#imports';
import {
  getSiteName,
  getNovelName,
  isNovelChapterPage,
} from '../../utils/site-detection';
import { NovelStorage } from '../../utils/storage';
import { KeywordReplacer } from '../../utils/character-replacement';
import type { ContentScriptMessage, Keyword, Replacement } from '../../types/content';
import './content.css';

// Import browser types and API
import browser, { type Runtime } from 'webextension-polyfill';

export default defineContentScript({
  main,
  matches: ['*://*/*'],
});

/**
 * Main content script function
 */
async function main(): Promise<void> {
  console.log('StoryLens content script loaded');

  // Only run on novel chapter pages
  if (!isNovelChapterPage()) {
    console.log('Not a novel chapter page, skipping content processing');
    return;
  }

  // Initialize keyword replacer
  const urlParts = window.location.href.split('/');
  const siteName = getSiteName(urlParts);
  const novelName = getNovelName(urlParts);

  const replacer = new KeywordReplacer(siteName);

  // Load initial data
  await loadAndProcessData(novelName, replacer);

  // Listen for messages from popup/background
  setupMessageListener(novelName, replacer);

  // Set up mutation observer for dynamic content
  setupMutationObserver(replacer);
}

/**
 * Loads data from storage and processes the content
 */
async function loadAndProcessData(
  novelName: string,
  replacer: KeywordReplacer,
): Promise<void> {
  try {
    const novelData = await NovelStorage.loadNovelData(novelName);

    replacer.updateData(novelData.keywords, novelData.replacements);
    replacer.processContent();

    console.log(`✅ Loaded data for novel: ${novelName}`, {
      keywords: Object.keys(novelData.keywords).length,
      replacements: Object.keys(novelData.replacements).length,
    });
  } catch (error) {
    console.error('Failed to load novel data:', error);
  }
}

/**
 * Sets up message listener for communication with popup/background
 */
function setupMessageListener(novelName: string, replacer: KeywordReplacer): void {
  browser.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: Runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ): true => {
      const typedMessage = message as ContentScriptMessage;
      console.log('Content script received message:', typedMessage);

      switch (typedMessage.type) {
        case 'UPDATE_KEYWORDS':
          if (typedMessage.keywords) {
            replacer.updateData(typedMessage.keywords, replacer['replacements']);
            replacer.processContent();
            console.log('✅ Keywords updated and content reprocessed');
          }
          break;

        case 'UPDATE_REPLACEMENTS':
          if (typedMessage.replacements) {
            replacer.updateData(replacer['keywords'], typedMessage.replacements);
            replacer.processContent();
            console.log('✅ Replacements updated and content reprocessed');
          }
          break;

        case 'ADD_KEYWORD':
          if (typedMessage.keyword) {
            const currentKeywords = replacer['keywords'];
            currentKeywords[typedMessage.keyword.id] = typedMessage.keyword;
            replacer.updateData(currentKeywords, replacer['replacements']);
            replacer.processContent();
            console.log('✅ Keyword added and content reprocessed');
          }
          break;

        case 'DELETE_KEYWORD':
          if (typedMessage.keywordId) {
            const currentKeywords = replacer['keywords'];
            delete currentKeywords[typedMessage.keywordId];
            replacer.updateData(currentKeywords, replacer['replacements']);
            replacer.processContent();
            console.log('✅ Keyword deleted and content reprocessed');
          }
          break;

        default:
          console.warn('Unknown message type:', typedMessage.type);
      }

      sendResponse({ success: true });
      return true;
    },
  );
}

/**
 * Sets up mutation observer to handle dynamically loaded content
 */
function setupMutationObserver(replacer: KeywordReplacer): void {
  const observer = new MutationObserver((mutations) => {
    let shouldReprocess = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes contain paragraph elements
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'P' || element.querySelector('p')) {
              shouldReprocess = true;
              break;
            }
          }
        }
      }
    }

    if (shouldReprocess) {
      console.log('🔄 Dynamic content detected, reprocessing...');
      replacer.processContent();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('✅ Mutation observer setup complete');
}
