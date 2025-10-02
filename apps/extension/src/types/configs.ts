export interface websiteSelector {
  website: string;
  novel: {
    xpath?: {
      value: string;
      regex: string;
    } | null;
    url?: {
      value: string;
      regex: string;
    } | null;
  };
  chapter: {
    xpath?: {
      value: string;
      regex: string;
    } | null;
    url?: {
      value: string;
      regex: string;
    } | null;
  };
}

export interface websiteSelectors {
  [key: string]: websiteSelector;
}
