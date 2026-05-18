import { get } from 'env-var';
import { DATABASE_CONFIG, DatabaseConfig } from '@core/modules';
import { ConfigFactory, registerAs } from '@nestjs/config';

export const databaseConfig: ConfigFactory<DatabaseConfig> = registerAs(
  DATABASE_CONFIG.toString(),
  () => ({
    host: get('DB_HOST').required().asString(),
    port: get('DB_PORT').required().asIntPositive(),
    database: get('DB_NAME').required().asString(),
  }),
);
