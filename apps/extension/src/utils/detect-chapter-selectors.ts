import { customInstance } from '@repo/api/client';

export type NodeSelectorFormValues = {
  website: string;
  novelXpath: string;
  novelXpathRegex: string;
  novelUrl: string;
  novelUrlRegex: string;
  chapterXpath: string;
  chapterXpathRegex: string;
  chapterUrl: string;
  chapterUrlRegex: string;
};

export type DetectChapterSelectorsResponse = {
  result: {
    website: string;
    confidence: 'high' | 'medium' | 'low';
    notes?: string;
  };
  nodeSelectorForm: NodeSelectorFormValues;
  novelForm: {
    name: string;
    description: string;
    slugs: string[];
  };
  validation: {
    novelSlug: string | null;
    chapter: number | null;
    errors: string[];
  };
};

export async function detectChapterSelectors(input: {
  url: string;
  html: string;
  model?: string;
}) {
  const response = await customInstance<DetectChapterSelectorsResponse>({
    url: '/ai/chapter-selectors',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: input,
  });

  return response.data;
}
