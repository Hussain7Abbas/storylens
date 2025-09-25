import type { NovelsData, NovelData, Keyword, Replacement } from '../types/content';
import browser from 'webextension-polyfill';

/**
 * Storage utilities for managing novel data in browser storage
 */
export class NovelStorage {
  private static readonly STORAGE_KEY = 'novels';

  /**
   * Loads all novels data from storage
   */
  static async loadNovels(): Promise<NovelsData> {
    try {
      const result = await browser.storage.local.get(NovelStorage.STORAGE_KEY);
      return (result[NovelStorage.STORAGE_KEY] as NovelsData) || {};
    } catch (error) {
      console.error('Failed to load novels from storage:', error);
      return {} as NovelsData;
    }
  }

  /**
   * Saves novels data to storage
   */
  static async saveNovels(novels: NovelsData): Promise<void> {
    try {
      await browser.storage.local.set({ [NovelStorage.STORAGE_KEY]: novels });
    } catch (error) {
      console.error('Failed to save novels to storage:', error);
      throw error;
    }
  }

  /**
   * Loads data for a specific novel
   */
  static async loadNovelData(novelName: string): Promise<NovelData> {
    const novels = await NovelStorage.loadNovels();
    return novels[novelName] || { keywords: {}, replacements: {} };
  }

  /**
   * Saves data for a specific novel
   */
  static async saveNovelData(novelName: string, data: NovelData): Promise<void> {
    const novels = await NovelStorage.loadNovels();
    novels[novelName] = data;
    await NovelStorage.saveNovels(novels);
  }

  /**
   * Updates keywords for a specific novel
   */
  static async updateKeywords(
    novelName: string,
    keywords: Record<string, Keyword>,
  ): Promise<void> {
    const novelData = await NovelStorage.loadNovelData(novelName);
    novelData.keywords = keywords;
    await NovelStorage.saveNovelData(novelName, novelData);
  }

  /**
   * Updates replacements for a specific novel
   */
  static async updateReplacements(
    novelName: string,
    replacements: Record<string, Replacement>,
  ): Promise<void> {
    const novelData = await NovelStorage.loadNovelData(novelName);
    novelData.replacements = replacements;
    await NovelStorage.saveNovelData(novelName, novelData);
  }
}
