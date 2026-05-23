import type { OpenRouter } from '@openrouter/sdk';
import { z } from 'zod';
import { createOpenRouterClient, resolveOpenRouterModel } from '../client';
import {
  type ChapterSelectorAgentInput,
  type ChapterSelectorAgentResult,
  chapterSelectorAgentInputSchema,
  chapterSelectorAgentResultSchema,
  toNodeSelectorFormValues,
  toNovelFormValues,
} from '../schemas/chapter-selector';
import { extractPageContextForAgent, getHostnameFromUrl } from '../utils/html';
import {
  applyNovelFormNameFallback,
  validateWebsiteSelectors,
} from '../utils/validate-selectors';

const SYSTEM_INSTRUCTIONS = `You analyze web novel chapter pages and produce XPath/regex selectors for a browser extension.

The extension extracts three distinct values:
1. novelSlug — a stable URL path identifier (e.g. "hail-the-king"), NEVER a display title
2. novelName — the human-readable novel title (e.g. "رواية حيوا الملك")
3. chapter — the current chapter number as an integer

Novel slug vs novel name (critical):
- novelSlug MUST come from URL regex when the slug appears in the URL path or query string.
- novelName comes from XPath when a title, heading, or breadcrumb element contains the novel title in the DOM.
- NEVER use XPath to extract novelSlug. NEVER set novelForm.slugs from XPath text.
- When both URL slug and DOM title are available, provide BOTH selectors: url regex for slug, xpath+regex for name.

XPath regex rules for novelName:
- XPath regex is applied to the matched element's textContent after trimming.
- Prefer capture group 1 when the element contains extra site text, but "(.*)" is acceptable because the server cleans titles automatically.
- Pick an XPath whose text includes the novel title, even if it also includes site branding or chapter labels.
- novelForm.name must be the cleaned human-readable title, not the slug.
- Example: text "- رواية حيوا الملك مترجمة - نادي الروايات" → novelForm.name = "رواية حيوا الملك"

Other selector rules:
- Prefer URL regex for chapter when the chapter number is clearly in the URL path or query string.
- URL regex MUST include capture group 1 for the extracted value. Example: /novel/([^/]+)/
- For chapter XPath regex use "(\\\\d+)" to capture digits only.
- Provide at least one working source for novel slug (prefer url) and one for chapter (xpath or url).
- novelForm.name = extracted novelName (clean title, not slug).
- novelForm.slugs = [extracted novelSlug from URL only].
- selectors.website and website must be the hostname only (example.com), no protocol or path.
- Use stable XPaths from the provided element list when possible.
- Avoid selectors that depend on ads, comments, or navigation menus.`;

const MAX_ATTEMPTS = 2;

export type ChapterSelectorAgentOptions = {
  client?: OpenRouter;
  apiKey?: string;
  model?: string;
};

export type ChapterSelectorAgentOutput = {
  result: ChapterSelectorAgentResult;
  nodeSelectorForm: ReturnType<typeof toNodeSelectorFormValues>;
  novelForm: ReturnType<typeof toNovelFormValues>;
  validation: ReturnType<typeof validateWebsiteSelectors>;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
  };
};

function buildUserPrompt(
  input: ChapterSelectorAgentInput,
  validationErrors?: string[],
) {
  const pageContext = extractPageContextForAgent(input.html, input.url);

  const validationSection = validationErrors?.length
    ? `\nPrevious selectors failed validation:\n${validationErrors.map((error) => `- ${error}`).join('\n')}\nFix the selectors and try again.\n`
    : '';

  return `Analyze this web novel chapter page and return JSON selectors that work on this exact page.

Page URL: ${input.url}
Hostname: ${getHostnameFromUrl(input.url)}
${validationSection}
Important: novelSlug must be extracted from the URL path (e.g. "hail-the-king" from /novel/hail-the-king/72).
novelName must be extracted from DOM text via XPath regex capture group 1, stripping optional site branding and metadata suffixes.

Page context:
${pageContext}`;
}

function parseStructuredResult(content: string | null | undefined) {
  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : content;

  return chapterSelectorAgentResultSchema.parse(JSON.parse(jsonText));
}

async function requestStructuredSelectors(
  client: OpenRouter,
  model: string,
  input: ChapterSelectorAgentInput,
  validationErrors?: string[],
) {
  const response = await client.chat.send({
    chatRequest: {
      model,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTIONS },
        { role: 'user', content: buildUserPrompt(input, validationErrors) },
      ],
      responseFormat: {
        type: 'json_schema',
        jsonSchema: {
          name: 'chapter_selector_result',
          strict: true,
          schema: z.toJSONSchema(chapterSelectorAgentResultSchema),
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content;
  const result = parseStructuredResult(
    typeof content === 'string' ? content : JSON.stringify(content),
  );

  return {
    result,
    usage: response.usage
      ? {
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
          cost: response.usage.cost ?? undefined,
        }
      : undefined,
  };
}

export async function detectChapterSelectors(
  input: ChapterSelectorAgentInput,
  options: ChapterSelectorAgentOptions = {},
): Promise<ChapterSelectorAgentOutput> {
  const parsedInput = chapterSelectorAgentInputSchema.parse(input);
  const client = options.client ?? createOpenRouterClient({ apiKey: options.apiKey });
  const model = resolveOpenRouterModel(options.model ?? parsedInput.model);

  let lastValidationErrors: string[] | undefined;
  let lastUsage: ChapterSelectorAgentOutput['usage'];
  let result: ChapterSelectorAgentResult | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const response = await requestStructuredSelectors(
      client,
      model,
      parsedInput,
      lastValidationErrors,
    );

    result = response.result;
    lastUsage = response.usage;

    const validation = applyNovelFormNameFallback(
      validateWebsiteSelectors(result.selectors, parsedInput.url, parsedInput.html),
      result.novelForm.name,
    );

    if (validation.errors.length === 0) {
      return {
        result,
        nodeSelectorForm: toNodeSelectorFormValues(result, parsedInput.url),
        novelForm: toNovelFormValues(result),
        validation,
        usage: lastUsage,
      };
    }

    lastValidationErrors = validation.errors;
  }

  if (!result) {
    throw new Error('Failed to detect chapter selectors.');
  }

  const validation = applyNovelFormNameFallback(
    validateWebsiteSelectors(result.selectors, parsedInput.url, parsedInput.html),
    result.novelForm.name,
  );

  return {
    result,
    nodeSelectorForm: toNodeSelectorFormValues(result, parsedInput.url),
    novelForm: toNovelFormValues(result),
    validation,
    usage: lastUsage,
  };
}
