export interface websiteSelector {
  novel: {
    xpath?: string | null;
    url?: string | null;
  };
  chapter: {
    xpath?: string | null;
    url?: string | null;
  };
}

export interface websiteSelectors {
  [key: string]: websiteSelector;
}
