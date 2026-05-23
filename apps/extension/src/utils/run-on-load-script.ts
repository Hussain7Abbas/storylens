import { sendMessage } from '@/entrypoints/background/messaging';
import type { OnLoadScriptResult } from '@/utils/inject-on-load-script';

export type { OnLoadScriptResult } from '@/utils/inject-on-load-script';

export async function runOnLoadScript(script: string): Promise<OnLoadScriptResult> {
  const trimmed = script.trim();
  if (!trimmed) {
    return { status: 'skipped' };
  }

  return sendMessage('runOnLoadScript', { script: trimmed });
}
