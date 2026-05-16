import { Logger } from '@nestjs/common';
import { createPool, DatabasePool, sql } from 'slonik';

export class DatabasePoolManager {
  private readonly logger = new Logger(DatabasePoolManager.name);
  private activePool!: DatabasePool;

  constructor(
    private readonly config: { host: string; port: number; database: string },
  ) {}

  async initialize(username: string, password: string) {
    this.activePool = await this.createValidatedPool(
      `postgres://${username}:${password}@${this.config.host}:${this.config.port}/${this.config.database}`,
    );
  }

  get pool(): DatabasePool {
    return this.activePool;
  }

  async rotate(connectionUri: string) {
    const newPool = await this.createValidatedPool(connectionUri);
    const oldPool = this.activePool;

    // atomic swap
    this.activePool = newPool;
    this.logger.log('Database pool swapped');

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await oldPool.end();
    }, 30000);
  }

  private async createValidatedPool(
    connectionUri: string,
  ): Promise<DatabasePool> {
    const pool = await createPool(connectionUri);

    // health check
    await pool.connect(async (conn) => {
      await conn.query(sql.unsafe`SELECT 1`);
    });

    return pool;
  }
}
