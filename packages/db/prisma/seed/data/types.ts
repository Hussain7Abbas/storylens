export type SeedNovel = {
  slug: string;
  name: string;
  lastModified: string;
};

export type SeedKeyword = {
  novelSlug: string;
  name: string;
  description: string;
  color: string;
  imageUrl: string;
  /** Legacy field — use `mapLegacyRole()` to resolve category + nature */
  role: string;
  timestamp?: number;
};

export type SeedReplacement = {
  novelSlug: string;
  from: string;
  to: string;
};

export type SeedKeywordCategory = {
  name: string;
  color: string;
};

export type SeedKeywordNature = {
  name: string;
  color: string;
};

export type KeywordCategoryName = 'انثى' | 'بطل' | 'ذكر' | 'سيد';

export type KeywordNatureName = 'عدو' | 'صديق' | 'بطل';

export type LegacyRoleMapping = {
  category: KeywordCategoryName;
  nature: KeywordNatureName;
};
