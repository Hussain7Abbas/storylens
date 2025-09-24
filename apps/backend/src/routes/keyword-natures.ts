import { Elysia, t } from 'elysia';
import { paginationSchema, sortingSchema } from '@/schemas/common';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import {
  authenticate,
  getNestedColumnObject,
  parsePaginationProps,
} from '@/utils/helpers';

export const keywordNatures = new Elysia({
  prefix: '/keyword-natures',
  tags: ['KeywordNatures'],
})
  .use(setup)

  // Get all keyword natures
  .get(
    '/',
    async ({ prisma, query: { pagination, sorting } }) => {
      const { skip, take } = parsePaginationProps(pagination);

      const [natures, total] = await Promise.all([
        prisma.keywordNature.findMany({
          skip,
          take,
          include: {
            _count: {
              select: {
                keywords: true,
              },
            },
          },
          orderBy: getNestedColumnObject(sorting?.column, sorting?.direction),
        }),
        prisma.keywordNature.count(),
      ]);

      return {
        data: natures,
        total,
      };
    },
    {
      query: t.Object({
        pagination: paginationSchema,
        sorting: sortingSchema,
      }),
    },
  )

  // Get keyword nature by ID
  .get(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const nature = await prisma.keywordNature.findUnique({
        where: { id },
        include: {
          keywords: {
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
            },
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              keywords: true,
            },
          },
        },
      });

      if (!nature) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Nature not found',
            ar: 'الطبيعة غير موجودة',
          }),
        });
      }

      return nature;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Create keyword nature (User only)
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

      // Check if nature name already exists
      const existingNature = await prisma.keywordNature.findFirst({
        where: {
          name: body.name,
        },
      });

      if (existingNature) {
        throw new HttpError({
          message: t({
            en: 'Nature name already exists',
            ar: 'اسم الطبيعة موجود بالفعل',
          }),
        });
      }

      const nature = await prisma.keywordNature.create({
        data: {
          name: body.name,
          color: body.color,
        },
      });

      return nature;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        color: t.String({ pattern: '^#[0-9A-Fa-f]{6}$' }),
      }),
    },
  )

  // Update keyword nature (User only)
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

      const existingNature = await prisma.keywordNature.findUnique({
        where: { id },
      });

      if (!existingNature) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Nature not found',
            ar: 'الطبيعة غير موجودة',
          }),
        });
      }

      // If changing name, check for conflicts
      if (body.name && body.name !== existingNature.name) {
        const conflictNature = await prisma.keywordNature.findFirst({
          where: {
            name: body.name,
            id: { not: id },
          },
        });

        if (conflictNature) {
          throw new HttpError({
            message: t({
              en: 'Nature name already exists',
              ar: 'اسم الطبيعة موجود بالفعل',
            }),
          });
        }
      }

      const nature = await prisma.keywordNature.update({
        where: { id },
        data: {
          name: body.name,
          color: body.color,
        },
      });

      return nature;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        color: t.String({ pattern: '^#[0-9A-Fa-f]{6}$' }),
      }),
    },
  )

  // Delete keyword nature (User only)
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

      const existingNature = await prisma.keywordNature.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              keywords: true,
            },
          },
        },
      });

      if (!existingNature) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Nature not found',
            ar: 'الطبيعة غير موجودة',
          }),
        });
      }

      // Check if nature has keywords
      if (existingNature._count.keywords > 0) {
        throw new HttpError({
          message: t({
            en: 'Cannot delete nature with keywords',
            ar: 'لا يمكن حذف طبيعة تحتوي على كلمات مفتاحية',
          }),
        });
      }

      await prisma.keywordNature.delete({
        where: { id },
      });

      return {
        message: t({
          en: 'Nature deleted successfully',
          ar: 'تم حذف الطبيعة بنجاح',
        }),
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  );
