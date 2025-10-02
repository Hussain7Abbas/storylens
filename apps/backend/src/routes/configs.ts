import { Elysia, t } from 'elysia';
import { setup } from '@/setup';
import { HttpError } from '@/utils/errors';

/**
 * Config routes for managing application configuration
 */
export const configs = new Elysia({
  prefix: '/configs',
  tags: ['Configs'],
})
  .use(setup)

  /**
   * Get all configs
   */
  .get('/', async ({ prisma }) => {
    const configs = await prisma.config.findMany({
      orderBy: {
        key: 'asc',
      },
    });

    return {
      data: configs,
    };
  })

  /**
   * Get config by key
   */
  .get(
    '/:key',
    async ({ prisma, params: { key } }) => {
      const config = await prisma.config.findUnique({
        where: { key },
      });

      if (!config) {
        throw new HttpError({ message: 'Config not found', statusCode: 404 });
      }

      return config;
    },
    {
      params: t.Object({
        key: t.String(),
      }),
    },
  )

  /**
   * Create or update config
   */
  .put(
    '/',
    async ({ prisma, body }) => {
      const config = await prisma.config.upsert({
        where: { key: body.key },
        update: {
          value: body.value,
        },
        create: {
          key: body.key,
          value: body.value,
        },
      });

      return config;
    },
    {
      body: t.Object({
        key: t.String(),
        value: t.String(),
      }),
    },
  )

  /**
   * Delete config
   */
  .delete(
    '/:key',
    async ({ prisma, params: { key } }) => {
      try {
        await prisma.config.delete({
          where: { key },
        });

        return {
          success: true,
        };
      } catch (_) {
        throw new HttpError({ message: 'Config not found', statusCode: 404 });
      }
    },
    {
      params: t.Object({
        key: t.String(),
      }),
    },
  );
