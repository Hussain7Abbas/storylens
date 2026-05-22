import { configureApiClient } from '@repo/api/client';
import { env } from '@/env';

export function setupApiClient(): void {
  configureApiClient(env.WXT_API_URL);
}
