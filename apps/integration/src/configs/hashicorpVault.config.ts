import { ConfigFactory, registerAs } from '@nestjs/config';
import {
  HashicorpVaultOptions,
  SecretEngineType,
  VaultAuthType,
  HASHICORP_VAULT_OPTIONS,
} from '@core/modules';
import { get } from 'env-var';

export const hashicorpVaultConfig: ConfigFactory<HashicorpVaultOptions> =
  registerAs(HASHICORP_VAULT_OPTIONS.toString(), () => ({
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
        key: 'integration-service',
        type: SecretEngineType.KV,
        path: 'kv/data/novex/dev/integration-service',
      },
      {
        key: 'novex-dev',
        type: SecretEngineType.KV,
        path: 'kv/data/novex/dev',
      },
      {
        key: 'database',
        type: SecretEngineType.Database,
        path: 'database/creds/integration-service',
      },
    ],
  }));
