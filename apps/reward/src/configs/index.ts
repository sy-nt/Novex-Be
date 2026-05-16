import {
  SecretEngineType,
  VaultAuthType,
  VaultServiceOptions,
} from '@core/modules';
import { loadAppEnv } from '@core/utils';
import { get } from 'env-var';

loadAppEnv('reward');

export const hashicorpVaultConfig: VaultServiceOptions = {
  client: {
    endpoint: get('VAULT_ENDPOINT').required().asString(),
    apiVersion: get('VAULT_API_VERSION').default('v1').asString(),
  },
  auth: {
    type: VaultAuthType.AppRole,
    options: {
      roleId: get('VAULT_ROLE_ID').required().asString(),
      secretId: get('VAULT_SECRET_ID').required().asString(),
    },
  },
  secrets: [
    {
      key: 'reward-service',
      type: SecretEngineType.KV,
      path: 'kv/data/novex/dev/reward-service',
    },
    {
      key: 'novex-dev',
      type: SecretEngineType.KV,
      path: 'kv/data/novex/dev',
    },
    {
      key: 'database',
      type: SecretEngineType.Database,
      path: 'database/creds/reward-service',
    },
  ],
};

export const databaseConfig: { host: string; port: number; database: string } =
  {
    host: get('DB_HOST').required().asString(),
    port: get('DB_PORT').required().asIntPositive(),
    database: get('DB_NAME').required().asString(),
  };

export const appConfig: { port: number } = {
  port: get('PORT').required().asIntPositive(),
};
