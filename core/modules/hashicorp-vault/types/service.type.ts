import { VaultAuthConfig, VaultClientOptions } from './auth.types';
import { SecretDescriptor } from './secret.type';

export interface HashicorpVaultOptions {
  client: VaultClientOptions;
  auth: VaultAuthConfig;
  secrets: SecretDescriptor[];
  tokenRenewBufferMs?: number;
  pollIntervalMs?: number;
  databaseRotateBufferMs?: number;
}
