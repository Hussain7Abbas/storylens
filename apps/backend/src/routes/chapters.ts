import { Elysia, t } from 'elysia';
import { paginationSchema, sortingSchema } from '@/schemas/common';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import {
  authenticate,
  getNestedColumnObject,
  parsePaginationProps,
} from '@/utils/helpers';

export const chapters = new Elysia({ prefix: '/chapters', tags: ['Chapters'] })
  .use(setup)

  // Get all chapters for a novel
  .get(
    '/novel/:novelId',
    async ({ t, prisma, params: { novelId }, query: { pagination, sorting } }) => {
      const { skip, take } = parsePaginationProps(pagination);

      // Verify novel exists
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
      });

      if (!novel) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Novel not found',
            ar: 'الرواية غير موجودة',
          }),
        });
      }

      const [chapters, total] = await Promise.all([
        prisma.chapter.findMany({
          where: { novelId },
          skip,
          take,
          include: {
            _count: {
              select: {
                KeywordsChapters: true,
              },
            },
          },
          orderBy: getNestedColumnObject(sorting?.column, sorting?.direction),
        }),
        prisma.chapter.count({ where: { novelId } }),
      ]);

      return {
        data: chapters,
        total,
      };
    },
    {
      params: t.Object({
        novelId: t.String({ format: 'uuid' }),
      }),
      query: t.Object({
        pagination: paginationSchema,
        sorting: sortingSchema,
      }),
    },
  )

  // Get chapter by ID
  .get(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const chapter = await prisma.chapter.findUnique({
        where: { id },
        include: {
          novel: {
            select: {
              id: true,
              name: true,
            },
          },
          KeywordsChapters: {
            include: {
              keyword: {
                include: {
                  category: true,
                  nature: true,
                  image: {
                    select: {
                      url: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
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

      return chapter;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Create chapter (User only)
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

      // Verify novel exists
      const novel = await prisma.novel.findUnique({
        where: { id: body.novelId },
      });

      if (!novel) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Novel not found',
            ar: 'الرواية غير موجودة',
          }),
        });
      }

      // Check if chapter number already exists for this novel
      const existingChapter = await prisma.chapter.findFirst({
        where: {
          novelId: body.novelId,
          number: body.number,
        },
      });

      if (existingChapter) {
        throw new HttpError({
          message: t({
            en: 'Chapter number already exists for this novel',
            ar: 'رقم الفصل موجود بالفعل لهذه الرواية',
          }),
        });
      }

      const chapter = await prisma.chapter.create({
        data: {
          name: body.name,
          number: body.number,
          description: body.description,
          novelId: body.novelId,
        },
      });

      return chapter;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        number: t.Number({ minimum: 1 }),
        description: t.Optional(t.String()),
        novelId: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Update chapter (User only)
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

      const existingChapter = await prisma.chapter.findUnique({
        where: { id },
      });

      if (!existingChapter) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Chapter not found',
            ar: 'الفصل غير موجود',
          }),
        });
      }

      // If changing chapter number, check for conflicts
      if (body.number && body.number !== existingChapter.number) {
        const conflictChapter = await prisma.chapter.findFirst({
          where: {
            novelId: existingChapter.novelId,
            number: body.number,
            id: { not: id },
          },
        });

        if (conflictChapter) {
          throw new HttpError({
            message: t({
              en: 'Chapter number already exists for this novel',
              ar: 'رقم الفصل موجود بالفعل لهذه الرواية',
            }),
          });
        }
      }

      const chapter = await prisma.chapter.update({
        where: { id },
        data: {
          name: body.name,
          number: body.number,
          description: body.description,
        },
      });

      return chapter;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        number: t.Number({ minimum: 1 }),
        description: t.Optional(t.String()),
      }),
    },
  )

  // Delete chapter (User only)
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

      const existingChapter = await prisma.chapter.findUnique({
        where: { id },
      });

      if (!existingChapter) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Chapter not found',
            ar: 'الفصل غير موجود',
          }),
        });
      }

      await prisma.chapter.delete({
        where: { id },
      });

      return {
        message: t({
          en: 'Chapter deleted successfully',
          ar: 'تم حذف الفصل بنجاح',
        }),
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  );
