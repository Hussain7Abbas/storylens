import {
  KeywordCategoryPlain,
  KeywordNaturePlain,
  KeywordPlain,
  ReplacementPlain,
} from '@repo/db';
import { Elysia, t } from 'elysia';
import { paginationSchema, sortingSchema } from '@/schemas/common';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import { getNestedColumnObject, parsePaginationProps } from '@/utils/helpers';

export const replacements = new Elysia({
  prefix: '/replacements',
  tags: ['Replacements'],
})
  .use(setup)

  // Get all replacements for a keyword
  .get(
    '/keyword/:keywordId',
    async ({ t, prisma, params: { keywordId }, query: { pagination, sorting } }) => {
      const { skip, take } = parsePaginationProps(pagination);

      // Verify keyword exists
      const keyword = await prisma.keyword.findUnique({
        where: { id: keywordId },
      });

      if (!keyword) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Keyword not found',
            ar: 'الكلمة المفتاحية غير موجودة',
          }),
        });
      }

      const [replacements, total] = await Promise.all([
        prisma.replacement.findMany({
          where: { keywordId },
          skip,
          take,
          include: {
            keyword: true,
          },
          orderBy: getNestedColumnObject(sorting?.column, sorting?.direction),
        }),
        prisma.replacement.count({ where: { keywordId } }),
      ]);

      return {
        data: replacements,
        total,
      };
    },
    {
      params: t.Object({
        keywordId: t.String({ format: 'uuid' }),
      }),
      query: t.Object({
        pagination: paginationSchema,
        sorting: sortingSchema,
      }),
      response: {
        200: t.Object({
          data: t.Array(ReplacementPlain),
          total: t.Number(),
        }),
      },
    },
  )

  // Get replacement by ID
  .get(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const replacement = await prisma.replacement.findUnique({
        where: { id },
        include: {
          keyword: {
            include: {
              category: true,
              nature: true,
            },
          },
        },
      });

      if (!replacement) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Replacement not found',
            ar: 'البديل غير موجود',
          }),
        });
      }

      return replacement;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: {
        200: t.Composite([
          ReplacementPlain,
          t.Object({
            keyword: t.Nullable(
              t.Composite([
                KeywordPlain,
                t.Object({
                  category: KeywordCategoryPlain,
                  nature: KeywordNaturePlain,
                }),
              ]),
            ),
          }),
        ]),
      },
    },
  )

  // Create replacement (User only)
  .post(
    '/',
    async ({ t, prisma, body }) => {
      // Verify keyword exists
      const keyword = await prisma.keyword.findUnique({
        where: { id: body.keywordId },
      });

      if (!keyword) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Keyword not found',
            ar: 'الكلمة المفتاحية غير موجودة',
          }),
        });
      }

      // Check if replacement already exists for this keyword
      const existingReplacement = await prisma.replacement.findFirst({
        where: {
          replacement: body.replacement,
          keywordId: body.keywordId,
        },
      });

      if (existingReplacement) {
        throw new HttpError({
          message: t({
            en: 'Replacement already exists for this keyword',
            ar: 'البديل موجود بالفعل لهذه الكلمة المفتاحية',
          }),
        });
      }

      const replacement = await prisma.replacement.create({
        data: {
          replacement: body.replacement,
          keywordId: body.keywordId,
          novelId: body.novelId,
        },
        include: {
          keyword: true,
        },
      });

      return replacement;
    },
    {
      body: t.Object({
        replacement: t.String({ minLength: 1 }),
        keywordId: t.String({ format: 'uuid' }),
        novelId: t.String({ format: 'uuid' }),
      }),
      response: {
        200: t.Composite([
          ReplacementPlain,
          t.Object({
            keyword: t.Nullable(KeywordPlain),
          }),
        ]),
      },
    },
  )

  // Update replacement (User only)
  .put(
    '/:id',
    async ({ t, prisma, params: { id }, body }) => {
      const existingReplacement = await prisma.replacement.findUnique({
        where: { id },
      });

      if (!existingReplacement) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Replacement not found',
            ar: 'البديل غير موجود',
          }),
        });
      }

      // If changing replacement text, check for conflicts within the same keyword
      if (body.replacement && body.replacement !== existingReplacement.replacement) {
        const conflictReplacement = await prisma.replacement.findFirst({
          where: {
            replacement: body.replacement,
            keywordId: existingReplacement.keywordId,
            id: { not: id },
          },
        });

        if (conflictReplacement) {
          throw new HttpError({
            message: t({
              en: 'Replacement already exists for this keyword',
              ar: 'البديل موجود بالفعل لهذه الكلمة المفتاحية',
            }),
          });
        }
      }

      const replacement = await prisma.replacement.update({
        where: { id },
        data: {
          replacement: body.replacement,
        },
        include: {
          keyword: true,
        },
      });

      return replacement;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: t.Object({
        replacement: t.String({ minLength: 1 }),
      }),
      response: {
        200: t.Composite([
          ReplacementPlain,
          t.Object({
            keyword: t.Nullable(KeywordPlain),
          }),
        ]),
      },
    },
  )

  // Delete replacement (User only)
  .delete(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const existingReplacement = await prisma.replacement.findUnique({
        where: { id },
      });

      if (!existingReplacement) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Replacement not found',
            ar: 'البديل غير موجود',
          }),
        });
      }

      await prisma.replacement.delete({
        where: { id },
      });

      return existingReplacement;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: {
        200: ReplacementPlain,
      },
    },
  );
