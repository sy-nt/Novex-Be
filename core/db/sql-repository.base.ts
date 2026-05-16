import { RequestContextService } from '@core/application/context/AppRequestContext';
import { AggregateRoot, PaginatedQueryParams, Paginated } from '@core/ddd';
import { Mapper } from '@core/ddd';
import { RepositoryPort } from '@core/ddd';
import { ConflictException } from '@core/exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { None, Option, Some } from 'oxide.ts';
import {
  DatabasePool,
  DatabaseTransactionConnection,
  IdentifierSqlToken,
  PrimitiveValueExpression,
  QueryResult,
  QuerySqlToken,
  sql,
  UniqueIntegrityConstraintViolationError,
} from 'slonik';
import { LoggerPort } from '../ports/logger.port';
import { ObjectLiteral } from '../types';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export abstract class SqlRepositoryBase<
  Aggregate extends AggregateRoot<any>,
  DbModel extends ObjectLiteral,
> implements RepositoryPort<Aggregate> {
  protected abstract tableName: string;

  protected abstract schema: StandardSchemaV1<any>;

  protected constructor(
    private readonly _pool: DatabasePool,
    protected readonly mapper: Mapper<Aggregate, DbModel>,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly logger: LoggerPort,
  ) {}

  async findOneById(id: string): Promise<Option<Aggregate>> {
    const query = sql.type(this.schema)`SELECT * FROM ${sql.identifier([
      this.tableName,
    ])} WHERE id = ${id}`;

    const result = await this.pool.query(query);
    return result.rows[0] ? Some(this.mapper.toDomain(result.rows[0])) : None;
  }

  async findAll(): Promise<Aggregate[]> {
    const query = sql.type(this.schema)`SELECT * FROM ${sql.identifier([
      this.tableName,
    ])}`;

    const result = await this.pool.query(query);

    return result.rows.map(this.mapper.toDomain);
  }

  async findAllPaginated(
    params: PaginatedQueryParams,
  ): Promise<Paginated<Aggregate>> {
    const query = sql.type(this.schema)`
    SELECT * FROM ${sql.identifier([this.tableName])}
    LIMIT ${params.limit}
    OFFSET ${params.offset}
    `;

    const result = await this.pool.query(query);

    const entities = result.rows.map(this.mapper.toDomain);
    return new Paginated({
      data: entities,
      count: result.rowCount,
      limit: params.limit,
      page: params.page,
    });
  }

  async delete(entity: Aggregate): Promise<boolean> {
    entity.validate();
    const query = sql.type(this.schema)`DELETE FROM ${sql.identifier([
      this.tableName,
    ])} WHERE id = ${entity.id}`;

    this.logger.debug(
      `[${RequestContextService.getRequestId()}] deleting entities ${
        entity.id
      } from ${this.tableName}`,
    );

    const result = await this.pool.query(query);

    await entity.publishEvents(this.logger, this.eventEmitter);

    return result.rowCount > 0;
  }

  /**
   * Inserts an entity to a database
   * (also publishes domain events and waits for completion)
   */
  async insert(entity: Aggregate | Aggregate[]): Promise<void> {
    const entities = Array.isArray(entity) ? entity : [entity];

    const records = entities.map(this.mapper.toPersistence);

    const query = this.generateInsertQuery(records);

    try {
      await this.writeQuery(query, entities);
    } catch (error) {
      if (error instanceof UniqueIntegrityConstraintViolationError) {
        this.logger.debug(
          `[${RequestContextService.getRequestId()}] ${error.message}`,
        );
        throw new ConflictException('Record already exists', error);
      }
      throw error;
    }
  }

  /**
   * Utility method for write queries when you need to mutate an entity.
   * Executes entity validation, publishes events,
   * and does some debug logging.
   * For read queries use `this.pool` directly
   */
  protected async writeQuery<T extends StandardSchemaV1<unknown>>(
    sql: QuerySqlToken<T>,
    entity: Aggregate | Aggregate[],
  ): Promise<QueryResult<StandardSchemaV1.InferOutput<T>>> {
    const entities = Array.isArray(entity) ? entity : [entity];
    entities.forEach((entity) => entity.validate());
    const entityIds = entities.map((e) => e.id);

    this.logger.debug(
      `[${RequestContextService.getRequestId()}] writing ${
        entities.length
      } entities to "${this.tableName}" table: ${entityIds}`,
    );

    const result = await this.pool.query(sql);

    await Promise.all(
      entities.map((entity) =>
        entity.publishEvents(this.logger, this.eventEmitter),
      ),
    );
    return result;
  }

  /**
   * Utility method to generate insert query for any objects.
   * Use carefully and don't accept non-validated objects.
   *
   * Passing object with { name: string, email: string } will generate
   * a query: INSERT INTO "table" (name, email) VALUES ($1, $2)
   */
  protected generateInsertQuery(
    models: DbModel[],
  ): QuerySqlToken<StandardSchemaV1> {
    if (!models.length) {
      throw new Error('Cannot generate insert query for empty models');
    }

    const propertyKeys = Object.entries(models[0])
      .filter(([key, value]) => key && value !== undefined)
      .map(([key]) => key);
    const propertyNames: IdentifierSqlToken[] = propertyKeys.map((key) =>
      sql.identifier([key]),
    );
    const rows = models.map((model) =>
      sql.join(
        propertyKeys.map((key) => {
          const value = model[key as keyof DbModel];
          return value instanceof Date
            ? sql.timestamp(value)
            : (value as PrimitiveValueExpression);
        }),
        sql.fragment`, `,
      ),
    );

    const query = sql.type(this.schema)`INSERT INTO ${sql.identifier([
      this.tableName,
    ])} (${sql.join(propertyNames, sql.fragment`, `)}) VALUES ${sql.join(
      rows.map((row) => sql.fragment`(${row})`),
      sql.fragment`, `,
    )}`;

    return query;
  }

  /**
   * start a global transaction to save
   * results of all event handlers in one operation
   */
  public async transaction<T>(handler: () => Promise<T>): Promise<T> {
    return this.pool.transaction(async (connection) => {
      this.logger.debug(
        `[${RequestContextService.getRequestId()}] transaction started`,
      );
      if (!RequestContextService.getTransactionConnection()) {
        RequestContextService.setTransactionConnection(connection);
      }

      try {
        const result = await handler();
        this.logger.debug(
          `[${RequestContextService.getRequestId()}] transaction committed`,
        );
        return result;
      } catch (e) {
        this.logger.debug(
          `[${RequestContextService.getRequestId()}] transaction aborted`,
        );
        throw e;
      } finally {
        RequestContextService.cleanTransactionConnection();
      }
    });
  }

  /**
   * Get database pool.
   * If global request transaction is started,
   * returns a transaction pool.
   */
  protected get pool(): DatabasePool | DatabaseTransactionConnection {
    return (
      RequestContextService.getContext().transactionConnection ?? this._pool
    );
  }
}
