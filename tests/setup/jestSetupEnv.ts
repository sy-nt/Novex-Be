import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envPaths = [resolve(root, '.env.test'), resolve(root, '.env')].filter(
  (path) => existsSync(path),
);

if (envPaths.length > 0) {
  config({ path: envPaths });
}

process.env.NODE_ENV = 'TEST';
