import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,

  server: {
    STORAGE_IMGBB_API_KEY: z.string(),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().optional(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
});
