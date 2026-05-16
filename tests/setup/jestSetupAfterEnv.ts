import { Test, TestingModuleBuilder, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// Setting up test server and utilities

export class TestServer {
  constructor(
    public readonly serverApplication: NestExpressApplication,
    public readonly testingModule: TestingModule,
  ) {}

  public static async new(
    testingModuleBuilder: TestingModuleBuilder,
  ): Promise<TestServer> {
    const testingModule: TestingModule = await testingModuleBuilder.compile();

    const app: NestExpressApplication = testingModule.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );

    app.enableShutdownHooks();

    await app.init();

    return new TestServer(app, testingModule);
  }
}

let testServer: TestServer;
type DatabasePool = {
  end: () => Promise<void>;
};

const workspaceRequire = createRequire(__filename);
let pool: DatabasePool | undefined;

function getServiceNameFromTestPath(testPath: string | undefined): string {
  if (!testPath) {
    throw new Error('Unable to resolve current test file path.');
  }

  const normalizedPath = testPath.replaceAll('\\', '/');
  const match =
    normalizedPath.match(/\/apps\/([^/]+)\/test\//) ??
    normalizedPath.match(/\/tests\/([^/]+)\//);

  if (!match) {
    throw new Error(
      `Unable to infer service from test path: ${testPath}. Expected path format ".../apps/<service>/test/..." or ".../tests/<service>/...".`,
    );
  }

  return match[1];
}

function getServiceModuleCandidates(serviceName: string): string[] {
  const serviceSrcPath = join(process.cwd(), 'apps', serviceName, 'src');

  return [
    join(serviceSrcPath, 'app.module'),
    join(serviceSrcPath, `${serviceName}.module`),
  ];
}

async function resolveServiceModuleClass(
  serviceName: string,
): Promise<new (...args: unknown[]) => unknown> {
  const candidates = getServiceModuleCandidates(serviceName);

  for (const candidatePath of candidates) {
    const candidatePathWithExtension = `${candidatePath}.ts`;

    if (!existsSync(candidatePathWithExtension)) {
      continue;
    }

    const moduleExports = workspaceRequire(
      candidatePathWithExtension,
    ) as Record<string, unknown>;
    const moduleClass = Object.values(moduleExports).find(
      (exportedValue: unknown) =>
        typeof exportedValue === 'function' &&
        exportedValue.name.endsWith('Module'),
    );

    if (moduleClass) {
      return moduleClass as new (...args: unknown[]) => unknown;
    }
  }

  throw new Error(
    `Unable to resolve root Nest module for service "${serviceName}". Checked: ${candidates.map((candidate) => `${candidate}.ts`).join(', ')}`,
  );
}

export async function generateTestingApplication(): Promise<{
  testServer: TestServer;
}> {
  const testPath = expect.getState().testPath;
  const serviceName = getServiceNameFromTestPath(testPath);
  const rootModuleClass = await resolveServiceModuleClass(serviceName);

  const testServer = await TestServer.new(
    Test.createTestingModule({
      imports: [rootModuleClass],
    }),
  );

  return {
    testServer,
  };
}

export function getTestServer(): TestServer {
  return testServer;
}

export function getConnectionPool(): DatabasePool {
  if (!pool) {
    throw new Error(
      'Database pool is not initialized for this test context. This service may not use a postgres database config.',
    );
  }

  return pool;
}

export function setConnectionPool(databasePool: DatabasePool): void {
  pool = databasePool;
}

export function getHttpServer(): ReturnType<typeof request> {
  const testServer = getTestServer();
  const httpServer = request(testServer.serverApplication.getHttpServer());

  return httpServer;
}

// setup
beforeAll(async (): Promise<void> => {
  ({ testServer } = await generateTestingApplication());
});

// cleanup
afterAll(async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }

  if (testServer) {
    await testServer.serverApplication.close();
  }
});
