import { defineConfig } from 'orval';
import './src/load-env';
import { env } from './src/env';

export default defineConfig({
  'storylens-api': {
    input: `${env.API_URL}/openapi.json`,
    output: {
      mode: 'tags',
      target: './src/endpoints',
      schemas: './src/schemas',
      client: 'react-query',
      httpClient: 'axios',
      biome: true,
      baseUrl: env.API_URL,
      override: {
        mutator: {
          path: './src/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
