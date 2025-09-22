import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,

  server: {
    JWT_SECRET_KEY: z.string(),
    AUTH_TOKEN_EXPIRATION: z.string(),
    STORAGE_IMGBB_API_KEY: z.string(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
});
