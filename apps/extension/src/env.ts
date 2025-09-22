import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  clientPrefix: 'WXT_',

  client: {
    WXT_API_URL: z.coerce.string(),
  },
});
