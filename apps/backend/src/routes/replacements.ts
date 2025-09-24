import { Elysia, t } from 'elysia';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import { authenticate } from '@/utils/helpers';

export const replacements = new Elysia({
  prefix: '/replacements',
  tags: ['Replacements'],
})
  .use(setup)

  // Get all replacements for a keyword
  .get(
    '/keyword/:keywordId',
    async ({ t, prisma, params: { keywordId }, query: { page = 1, limit = 10 } }) => {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

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
            keyword: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.replacement.count({ where: { keywordId } }),
      ]);

      return {
        data: replacements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    },
    {
      params: t.Object({
        keywordId: t.String({ format: 'uuid' }),
      }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
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
            select: {
              id: true,
              name: true,
              description: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              nature: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
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
    },
  )

  // Create replacement (User only)
  .post(
    '/',
    async ({ t, prisma, bearer, body }) => {
      await authenticate({
        token: bearer || '',
        errorMessage: t({
          en: 'Authentication required',
          ar: 'مطلوب التحقق من الهوية',
        }),
      });

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
        },
        include: {
          keyword: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return replacement;
    },
    {
      body: t.Object({
        replacement: t.String({ minLength: 1 }),
        keywordId: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Update replacement (User only)
  .put(
    '/:id',
    async ({ t, prisma, bearer, params: { id }, body }) => {
      await authenticate({
        token: bearer || '',
        errorMessage: t({
          en: 'Authentication required',
          ar: 'مطلوب التحقق من الهوية',
        }),
      });

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
          keyword: {
            select: {
              id: true,
              name: true,
            },
          },
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
    },
  )

  // Delete replacement (User only)
  .delete(
    '/:id',
    async ({ t, prisma, bearer, params: { id } }) => {
      await authenticate({
        token: bearer || '',
        errorMessage: t({
          en: 'Authentication required',
          ar: 'مطلوب التحقق من الهوية',
        }),
      });

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

      return {
        message: t({
          en: 'Replacement deleted successfully',
          ar: 'تم حذف البديل بنجاح',
        }),
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  );
