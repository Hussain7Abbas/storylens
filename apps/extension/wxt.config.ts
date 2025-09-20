import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
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
  },

  webExt: {
    binaries: {
      chrome: '/usr/bin/google-chrome',
    },
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    keepProfileChanges: true,
  },
});
