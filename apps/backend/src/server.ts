import chalk from 'chalk';
import { Elysia, status } from 'elysia';
import { env } from './env';
import { cors, crons, logger, openapi } from './plugins';
import { accounts } from './routes/accounts';
import { chapters } from './routes/chapters';
import { files } from './routes/files';
import { keywordCategories } from './routes/keyword-categories';
import { keywordNatures } from './routes/keyword-natures';
import { keywords } from './routes/keywords';
import { keywordsChapters } from './routes/keywords-chapters';
import { novels } from './routes/novels';
import { replacements } from './routes/replacements';
import { AuthError, HttpError } from './utils/errors';

export const app = new Elysia()
  .use(logger)
  .use(cors)
  .use(openapi)
  .use(crons)

  .error({ HttpError, AuthError })
  .onError(({ code, error }) => {
    if (code === 'HttpError') {
      return status(error.statusCode, { message: error.message });
    }

    if (code === 'AuthError') {
      return status(401, { message: error.message });
    }
  })

  // Routes
  .get('/', () => ({
    message: 'Made with ❤️ by Hussain Abbas, for docs checkout /docs',
  }))

  .use(accounts)
  .use(files)
  .use(novels)
  .use(chapters)
  .use(keywords)
  .use(keywordsChapters)
  .use(keywordCategories)
  .use(keywordNatures)
  .use(replacements)

  .listen(env.PORT, ({ url }) => {
    console.log(`🚀 Server is running at ${chalk.green(url)}`);
  });
