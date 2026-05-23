import { browser } from '#imports';

export const ON_LOAD_STATUS_ATTR = 'data-storylens-on-load';

export type OnLoadScriptResult =
  | { status: 'skipped' }
  | { status: 'success' }
  | { status: 'failed'; error: unknown };

type InjectionStatus = {
  status: string;
};

function mapInjectionStatus(status: string): OnLoadScriptResult {
  if (status === 'success') {
    return { status: 'success' };
  }

  if (status === 'failed') {
    return {
      status: 'failed',
      error: new Error('onLoadScript threw an error in page context'),
    };
  }

  return {
    status: 'failed',
    error: new Error(
      'onLoadScript did not execute — the page CSP may block blob: scripts',
    ),
  };
}

export async function injectOnLoadScriptInTab(
  tabId: number,
  script: string,
): Promise<OnLoadScriptResult> {
  const trimmed = script.trim();
  if (!trimmed) {
    return { status: 'skipped' };
  }

  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (scriptText: string, statusAttr: string) => {
        return new Promise<{ status: string }>((resolve) => {
          document.documentElement.removeAttribute(statusAttr);

          const wrapped = [
            '(function(){try{',
            scriptText,
            ";document.documentElement.setAttribute('",
            statusAttr,
            "','success');}catch(error){document.documentElement.setAttribute('",
            statusAttr,
            "','failed');console.error('[StoryLens] onLoadScript error in page context',error);}})();",
          ].join('');

          const blob = new Blob([wrapped], { type: 'text/javascript' });
          const url = URL.createObjectURL(blob);
          const scriptEl = document.createElement('script');
          scriptEl.src = url;

          scriptEl.onload = () => {
            URL.revokeObjectURL(url);
            scriptEl.remove();
            resolve({
              status: document.documentElement.getAttribute(statusAttr) ?? 'blocked',
            });
          };

          scriptEl.onerror = () => {
            URL.revokeObjectURL(url);
            scriptEl.remove();
            resolve({ status: 'blocked' });
          };

          (document.head || document.documentElement).appendChild(scriptEl);
        });
      },
      args: [trimmed, ON_LOAD_STATUS_ATTR],
    });

    const injection = results[0]?.result as InjectionStatus | undefined;
    if (!injection) {
      return {
        status: 'failed',
        error: new Error('executeScript returned no result'),
      };
    }

    return mapInjectionStatus(injection.status);
  } catch (error) {
    return { status: 'failed', error };
  }
}
