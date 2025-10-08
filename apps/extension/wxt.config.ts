import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/auto-icons',
    '@wxt-dev/webextension-polyfill',
  ],
  srcDir: 'src',
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.mode === 'development') {
        manifest.title += ' (DEV)';
      }
    },
  },

  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['tabs'],
  },

  webExt: {
    binaries: {
      chromium: '/usr/bin/chromium',
    },
    chromiumArgs: ['--user-data-dir=./.wxt/chromium-data'],
    keepProfileChanges: true,
    startUrls: ['https://rewayat.club/novel/hail-the-king/72'],
  },
});
