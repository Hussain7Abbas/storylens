import { Elysia, t } from 'elysia';
import { paginationSchema, sortingSchema } from '@/schemas/common';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import { getNestedColumnObject, parsePaginationProps } from '@/utils/helpers';

export const novels = new Elysia({
  prefix: '/novels',
  tags: ['Novels'],
})
  .use(setup)

  // Get all novels with pagination
  .get(
    '/',
    async ({ prisma, query: { pagination, query, sorting } }) => {
      const { skip, take } = parsePaginationProps(pagination);

      const where = query?.search
        ? {
            OR: [
              {
                name: {
                  contains: query?.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: query?.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {};

      const [novels, total] = await Promise.all([
        prisma.novel.findMany({
          where,
          skip,
          take,
          include: {
            image: {
              select: {
                url: true,
                type: true,
              },
            },
            _count: {
              select: {
                chapters: true,
                Keywords: true,
              },
            },
          },
          orderBy: getNestedColumnObject(sorting?.column, sorting?.direction),
        }),
        prisma.novel.count({ where }),
      ]);

      return {
        data: novels,
        total,
      };
    },
    {
      query: t.Object({
        pagination: paginationSchema,
        sorting: sortingSchema,
        query: t.Optional(
          t.Object({
            search: t.Optional(t.String()),
          }),
        ),
      }),
    },
  )

  // Get novel by ID
  .get(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const novel = await prisma.novel.findUnique({
        where: { id },
        include: {
          image: {
            select: {
              url: true,
              type: true,
            },
          },
          chapters: {
            orderBy: {
              number: 'asc',
            },
            include: {
              _count: {
                select: {
                  KeywordsChapters: true,
                },
              },
            },
          },
          Keywords: {
            include: {
              category: true,
              nature: true,
              image: {
                select: {
                  url: true,
                  type: true,
                },
              },
              _count: {
                select: {
                  replacements: true,
                  children: true,
                },
              },
            },
          },
        },
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

      return novel;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Create novel (User only)
  .post(
    '/',
    async ({ prisma, body }) => {
      const novel = await prisma.novel.create({
        data: {
          name: body.name,
          description: body.description,
          imageId: body.imageId,
        },
        include: {
          image: {
            select: {
              url: true,
              type: true,
            },
          },
        },
      });

      return novel;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String({ minLength: 1 })),
        imageId: t.Optional(t.String({ format: 'uuid' })),
      }),
    },
  )

  // Update novel (User only)
  .put(
    '/:id',
    async ({ t, prisma, params: { id }, body }) => {
      const existingNovel = await prisma.novel.findUnique({
        where: { id },
      });

      if (!existingNovel) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Novel not found',
            ar: 'الرواية غير موجودة',
          }),
        });
      }

      const novel = await prisma.novel.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          imageId: body.imageId,
        },
        include: {
          image: {
            select: {
              url: true,
              type: true,
            },
          },
        },
      });

      return novel;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String({ minLength: 1 })),
        imageId: t.Optional(t.String({ format: 'uuid' })),
      }),
    },
  )

  // Delete novel (User only)
  .delete(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const existingNovel = await prisma.novel.findUnique({
        where: { id },
      });

      if (!existingNovel) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Novel not found',
            ar: 'الرواية غير موجودة',
          }),
        });
      }

      await prisma.novel.delete({
        where: { id },
      });

      return {
        message: t({
          en: 'Novel deleted successfully',
          ar: 'تم حذف الرواية بنجاح',
        }),
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  );
