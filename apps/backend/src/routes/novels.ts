import { Elysia, t } from 'elysia';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import { authenticate } from '@/utils/helpers';

export const novels = new Elysia({
  prefix: '/novels',
  tags: ['Novels'],
})
  .use(setup)

  // Get all novels with pagination
  .get(
    '/',
    async ({ prisma, query: { page = 1, limit = 10, search } }) => {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const where = search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: search,
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
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.novel.count({ where }),
      ]);

      return {
        novels,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
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
    async ({ t, prisma, bearer, body }) => {
      await authenticate({
        token: bearer || '',
        errorMessage: t({
          en: 'Authentication required',
          ar: 'مطلوب التحقق من الهوية',
        }),
      });

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
        description: t.String({ minLength: 1 }),
        imageId: t.Optional(t.String({ format: 'uuid' })),
      }),
    },
  )

  // Update novel (User only)
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
        description: t.String({ minLength: 1 }),
        imageId: t.Optional(t.String({ format: 'uuid' })),
      }),
    },
  )

  // Delete novel (User only)
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
