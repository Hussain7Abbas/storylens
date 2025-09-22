import { Elysia, t } from 'elysia';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';
import { authenticate } from '@/utils/helpers';

export const keywords = new Elysia({ prefix: '/keywords' })
  .use(setup)

  // Get all keywords with filters
  .get(
    '/',
    async ({
      prisma,
      query: { page = 1, limit = 10, search, categoryId, natureId, novelId },
    }) => {
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const where: Record<string, unknown> = {};

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive' as const,
        };
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (natureId) {
        where.natureId = natureId;
      }

      if (novelId) {
        where.novelId = novelId;
      }

      const [keywords, total] = await Promise.all([
        prisma.keyword.findMany({
          where,
          skip,
          take,
          include: {
            category: true,
            nature: true,
            image: {
              select: {
                url: true,
                type: true,
              },
            },
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                children: true,
                KeywordsChapters: true,
                replacements: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.keyword.count({ where }),
      ]);

      return {
        keywords,
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
        categoryId: t.Optional(t.String({ format: 'uuid' })),
        natureId: t.Optional(t.String({ format: 'uuid' })),
        novelId: t.Optional(t.String({ format: 'uuid' })),
      }),
    },
  )

  // Get keyword by ID
  .get(
    '/:id',
    async ({ t, prisma, params: { id } }) => {
      const keyword = await prisma.keyword.findUnique({
        where: { id },
        include: {
          category: true,
          nature: true,
          image: {
            select: {
              url: true,
              type: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              category: true,
              nature: true,
            },
          },
          novel: {
            select: {
              id: true,
              name: true,
            },
          },
          KeywordsChapters: {
            include: {
              chapter: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                },
              },
            },
          },
          replacements: true,
        },
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

      return keyword;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Create keyword (User only)
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

      // Verify related entities exist
      const [category, nature, novel] = await Promise.all([
        prisma.keywordCategory.findUnique({ where: { id: body.categoryId } }),
        prisma.keywordNature.findUnique({ where: { id: body.natureId } }),
        prisma.novel.findUnique({ where: { id: body.novelId } }),
      ]);

      if (!category) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Category not found',
            ar: 'الفئة غير موجودة',
          }),
        });
      }

      if (!nature) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Nature not found',
            ar: 'الطبيعة غير موجودة',
          }),
        });
      }

      if (!novel) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Novel not found',
            ar: 'الرواية غير موجودة',
          }),
        });
      }

      // Check if keyword name already exists for this novel
      const existingKeyword = await prisma.keyword.findFirst({
        where: {
          name: body.name,
          novelId: body.novelId,
        },
      });

      if (existingKeyword) {
        throw new HttpError({
          message: t({
            en: 'Keyword name already exists for this novel',
            ar: 'اسم الكلمة المفتاحية موجود بالفعل لهذه الرواية',
          }),
        });
      }

      const keyword = await prisma.keyword.create({
        data: {
          name: body.name,
          description: body.description,
          categoryId: body.categoryId,
          natureId: body.natureId,
          imageId: body.imageId,
          parentId: body.parentId,
          novelId: body.novelId,
        },
        include: {
          category: true,
          nature: true,
          image: {
            select: {
              url: true,
              type: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return keyword;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        categoryId: t.String({ format: 'uuid' }),
        natureId: t.String({ format: 'uuid' }),
        imageId: t.Optional(t.String({ format: 'uuid' })),
        parentId: t.Optional(t.String({ format: 'uuid' })),
        novelId: t.String({ format: 'uuid' }),
      }),
    },
  )

  // Update keyword (User only)
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

      const existingKeyword = await prisma.keyword.findUnique({
        where: { id },
      });

      if (!existingKeyword) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Keyword not found',
            ar: 'الكلمة المفتاحية غير موجودة',
          }),
        });
      }

      // If changing name, check for conflicts within the same novel
      if (body.name && body.name !== existingKeyword.name) {
        const conflictKeyword = await prisma.keyword.findFirst({
          where: {
            name: body.name,
            novelId: existingKeyword.novelId,
            id: { not: id },
          },
        });

        if (conflictKeyword) {
          throw new HttpError({
            message: t({
              en: 'Keyword name already exists for this novel',
              ar: 'اسم الكلمة المفتاحية موجود بالفعل لهذه الرواية',
            }),
          });
        }
      }

      // If changing category or nature, verify they exist
      if (body.categoryId || body.natureId) {
        const [category, nature] = await Promise.all([
          body.categoryId
            ? prisma.keywordCategory.findUnique({ where: { id: body.categoryId } })
            : Promise.resolve(null),
          body.natureId
            ? prisma.keywordNature.findUnique({ where: { id: body.natureId } })
            : Promise.resolve(null),
        ]);

        if (body.categoryId && !category) {
          throw new HttpError({
            statusCode: 404,
            message: t({
              en: 'Category not found',
              ar: 'الفئة غير موجودة',
            }),
          });
        }

        if (body.natureId && !nature) {
          throw new HttpError({
            statusCode: 404,
            message: t({
              en: 'Nature not found',
              ar: 'الطبيعة غير موجودة',
            }),
          });
        }
      }

      const keyword = await prisma.keyword.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          categoryId: body.categoryId,
          natureId: body.natureId,
          imageId: body.imageId,
          parentId: body.parentId,
        },
        include: {
          category: true,
          nature: true,
          image: {
            select: {
              url: true,
              type: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return keyword;
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        categoryId: t.String({ format: 'uuid' }),
        natureId: t.String({ format: 'uuid' }),
        imageId: t.Optional(t.String({ format: 'uuid' })),
        parentId: t.Optional(t.String({ format: 'uuid' })),
      }),
    },
  )

  // Delete keyword (User only)
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

      const existingKeyword = await prisma.keyword.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              children: true,
              KeywordsChapters: true,
              replacements: true,
            },
          },
        },
      });

      if (!existingKeyword) {
        throw new HttpError({
          statusCode: 404,
          message: t({
            en: 'Keyword not found',
            ar: 'الكلمة المفتاحية غير موجودة',
          }),
        });
      }

      // Check if keyword has children
      if (existingKeyword._count.children > 0) {
        throw new HttpError({
          message: t({
            en: 'Cannot delete keyword with child keywords',
            ar: 'لا يمكن حذف كلمة مفتاحية لها كلمات فرعية',
          }),
        });
      }

      await prisma.keyword.delete({
        where: { id },
      });

      return {
        message: t({
          en: 'Keyword deleted successfully',
          ar: 'تم حذف الكلمة المفتاحية بنجاح',
        }),
      };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  );
