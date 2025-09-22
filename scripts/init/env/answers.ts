import { input, password, select } from '@inquirer/prompts';
import { generateSecretKey } from './helpers';

export const answers = {
  nodeEnv: await select({
    message: 'Select node environment',
    choices: [
      { name: 'Development', value: 'development' },
      { name: 'Production', value: 'production' },
    ],
  }),

  backendPort: await input({
    message: 'Backend Port',
    default: '6000',
  }),

  extensionPort: await input({
    message: 'Extension Port',
    default: '6001',
  }),

  jwtSecretKey: generateSecretKey(16),

  rootUsername: await input({
    message: 'Root Username',
    default: 'root',
  }),

  rootPassword:
    (await password({ message: 'Root Password (random if empty)' })) ||
    generateSecretKey(6),

  autoTokenExpiration: await input({
    message: 'Auth Token Expiration',
    default: '30d',
  }),

  dbName: await input({
    message: 'Database Name',
    default: 'postgres',
  }),

  dbUser: await input({
    message: 'Database User',
    default: 'postgres',
  }),

  dbPassword:
    (await password({ message: 'Database Password (random if empty)' })) ||
    generateSecretKey(16),

  dbDomain: await input({
    message: 'Database Domain',
    default: 'localhost',
    required: true,
  }),

  dbPort: await input({
    message: 'Database Port',
    default: '5432',
  }),

  storageImgbbApiKey: await password({
    message: 'Storage Imgbb API Key',
  }),
};
