import { Elysia, t } from 'elysia';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import { authenticate } from '@/utils/helpers';

export const keywordsChapters = new Elysia({
  prefix: '/keywords-chapters',
  tags: ['KeywordsChapters'],
})
  .use(setup)

  // Get all keyword-chapter relationships for a specific chapter
  .get(
    '/chapter/:chapterId',
    async ({ t, prisma, params: { chapterId }, query: { page = 1, limit = 10 } }) => {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Verify chapter exists
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Chapter not found',
            ar: 'الفصل غير موجود',
          }),
        });
      }

      const [relationships, total] = await Promise.all([
        prisma.keywordsChapters.findMany({
          where: { chapterId },
          skip,
          take,
          include: {
            keyword: {
              include: {
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
                image: {
                  select: {
                    url: true,
                    type: true,
                  },
                },
              },
            },
            chapter: {
              select: {
                id: true,
                name: true,
                number: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.keywordsChapters.count({ where: { chapterId } }),
      ]);

      return {
        relationships,
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
        chapterId: t.String({ format: 'uuid' }),
      }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )

  // Get all keyword-chapter relationships for a specific keyword
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

      const [relationships, total] = await Promise.all([
        prisma.keywordsChapters.findMany({
          where: { keywordId },
          skip,
          take,
          include: {
            keyword: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            chapter: {
              include: {
                novel: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.keywordsChapters.count({ where: { keywordId } }),
      ]);

      return {
        relationships,
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

  // Get relationship by ID
  .get(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const relationship = await prisma.keywordsChapters.findUnique({
        where: { id },
        include: {
          keyword: {
            include: {
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
              image: {
                select: {
                  url: true,
                  type: true,
                },
              },
            },
          },
          chapter: {
            include: {
              novel: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!relationship) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Relationship not found',
            ar: 'العلاقة غير موجودة',
          }),
        });
      }

      return relationship;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Create keyword-chapter relationship (User only)
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

      // Verify both keyword and chapter exist
      const [keyword, chapter] = await Promise.all([
        prisma.keyword.findUnique({ where: { id: body.keywordId } }),
        prisma.chapter.findUnique({ where: { id: body.chapterId } }),
      ]);

      if (!keyword) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Keyword not found',
            ar: 'الكلمة المفتاحية غير موجودة',
          }),
        });
      }

      if (!chapter) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Chapter not found',
            ar: 'الفصل غير موجود',
          }),
        });
      }

      // Check if relationship already exists
      const existingRelationship = await prisma.keywordsChapters.findFirst({
        where: {
          keywordId: body.keywordId,
          chapterId: body.chapterId,
        },
      });

      if (existingRelationship) {
        throw new HttpError({
          message: t({
            en: 'Relationship already exists',
            ar: 'العلاقة موجودة بالفعل',
          }),
        });
      }

      const relationship = await prisma.keywordsChapters.create({
        data: {
          keywordId: body.keywordId,
          chapterId: body.chapterId,
        },
        include: {
          keyword: {
            select: {
              id: true,
              name: true,
            },
          },
          chapter: {
            select: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
      });

      return relationship;
    },
    {
      body: t.Object({
        keywordId: t.String({ format: 'uuid' }),
        chapterId: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Delete keyword-chapter relationship (User only)
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

      const existingRelationship = await prisma.keywordsChapters.findUnique({
        where: { id },
      });

      if (!existingRelationship) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Relationship not found',
            ar: 'العلاقة غير موجودة',
          }),
        });
      }

      await prisma.keywordsChapters.delete({
        where: { id },
      });

      return {
        message: t({
          en: 'Relationship deleted successfully',
          ar: 'تم حذف العلاقة بنجاح',
        }),
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  );
