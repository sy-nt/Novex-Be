import { config } from 'dotenv';
import { resolve } from 'node:path';

export function loadAppEnv(appName: string) {
  const root = process.cwd();
  const paths = [resolve(root, '.env'), resolve(root, `apps/${appName}/.env`)];

  if (process.env.NODE_ENV === 'test') {
    paths.push(resolve(root, '.env.test'));
  }

  config({ path: paths });
}
