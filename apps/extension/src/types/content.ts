/**
 * Content script types for keyword replacement and novel management
 */

export interface KeywordCategory {
  id: string;
  name: string;
  color: string;
}

export interface KeywordNature {
  id: string;
  name: string;
  color: string;
}

export interface Keyword {
  id: string;
  name: string;
  description: string;
  category: KeywordCategory;
  nature: KeywordNature;
  image?: {
    url: string;
    type: 'Image' | 'Video';
  };
  parent?: {
    id: string;
    name: string;
  };
  novel: {
    id: string;
    name: string;
  };
}

export interface Replacement {
  id: string;
  replacement: string;
  keywordId: string;
}

export interface NovelData {
  keywords: Record<string, Keyword>;
  replacements: Record<string, Replacement>;
}

export interface NovelsData {
  [novelName: string]: NovelData;
}

export type SiteName = 'kolnovel' | 'riwyat' | 'other';

export interface ContentScriptMessage {
  type: 'UPDATE_KEYWORDS' | 'UPDATE_REPLACEMENTS' | 'ADD_KEYWORD' | 'DELETE_KEYWORD';
  keywords?: Record<string, Keyword>;
  replacements?: Record<string, Replacement>;
  keyword?: Keyword;
  keywordId?: string;
  novelId?: string;
}

export interface TooltipElement extends HTMLSpanElement {
  tooltip?: HTMLSpanElement;
}
