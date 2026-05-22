import { type ContentScriptContext, defineContentScript } from '#imports';
import './content.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main(ctx: ContentScriptContext): Promise<void> {
    const { runContentScript } = await import('./main');
    await runContentScript(ctx);
  },
});
