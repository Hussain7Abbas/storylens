import { Elysia, t } from 'elysia';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import { authenticate } from '@/utils/helpers';

export const keywordCategories = new Elysia({
  prefix: '/keyword-categories',
  tags: ['KeywordCategories'],
})
  .use(setup)

  // Get all keyword categories
  .get(
    '/',
    async ({ prisma, query: { page = 1, limit = 10 } }) => {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [categories, total] = await Promise.all([
        prisma.keywordCategory.findMany({
          skip,
          take,
          include: {
            _count: {
              select: {
                keywords: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.keywordCategory.count(),
      ]);

      return {
        data: categories,
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
      }),
    },
  )

  // Get keyword category by ID
  .get(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const category = await prisma.keywordCategory.findUnique({
        where: { id },
        include: {
          keywords: {
            select: {
              id: true,
              name: true,
              description: true,
              nature: {
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

      if (!category) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Category not found',
            ar: 'الفئة غير موجودة',
          }),
        });
      }

      return category;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Create keyword category (User only)
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

      // Check if category name already exists
      const existingCategory = await prisma.keywordCategory.findFirst({
        where: {
          name: body.name,
        },
      });

      if (existingCategory) {
        throw new HttpError({
          message: t({
            en: 'Category name already exists',
            ar: 'اسم الفئة موجود بالفعل',
          }),
        });
      }

      const category = await prisma.keywordCategory.create({
        data: {
          name: body.name,
          color: body.color,
        },
      });

      return category;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        color: t.String({ pattern: '^#[0-9A-Fa-f]{6}$' }),
      }),
    },
  )

  // Update keyword category (User only)
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

      const existingCategory = await prisma.keywordCategory.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Category not found',
            ar: 'الفئة غير موجودة',
          }),
        });
      }

      // If changing name, check for conflicts
      if (body.name && body.name !== existingCategory.name) {
        const conflictCategory = await prisma.keywordCategory.findFirst({
          where: {
            name: body.name,
            id: { not: id },
          },
        });

        if (conflictCategory) {
          throw new HttpError({
            message: t({
              en: 'Category name already exists',
              ar: 'اسم الفئة موجود بالفعل',
            }),
          });
        }
      }

      const category = await prisma.keywordCategory.update({
        where: { id },
        data: {
          name: body.name,
          color: body.color,
        },
      });

      return category;
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

  // Delete keyword category (User only)
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

      const existingCategory = await prisma.keywordCategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              keywords: true,
            },
          },
        },
      });

      if (!existingCategory) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Category not found',
            ar: 'الفئة غير موجودة',
          }),
        });
      }

      // Check if category has keywords
      if (existingCategory._count.keywords > 0) {
        throw new HttpError({
          message: t({
            en: 'Cannot delete category with keywords',
            ar: 'لا يمكن حذف فئة تحتوي على كلمات مفتاحية',
          }),
        });
      }

      await prisma.keywordCategory.delete({
        where: { id },
      });

      return {
        message: t({
          en: 'Category deleted successfully',
          ar: 'تم حذف الفئة بنجاح',
        }),
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  );
