import { defineConfig } from 'orval';

export default defineConfig({
  'storylens-api': {
    input: 'http://localhost:7000/openapi.json',
    output: {
      mode: 'tags',
      target: './src/endpoints',
      schemas: './src/schemas',
      client: 'react-query',
      biome: true,
      baseUrl: {
        getBaseUrlFromSpecification: true,
      },
    },
  },
});
