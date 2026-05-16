import { client as VaultNativeClient } from 'node-vault';
import { ProviderBase } from './secret-provider.base';
import {
  SecretDescriptor,
  SecretEngineType,
  SecretRecord,
} from '../types/secret.type';

interface TransitReadResponse {
  data?: Record<string, unknown>;
}

export class TransitSecretProvider extends ProviderBase {
  readonly type = SecretEngineType.Transit;

  async read(
    client: VaultNativeClient,
    secret: SecretDescriptor,
  ): Promise<SecretRecord> {
    const result = (await client.read(secret.path)) as TransitReadResponse;

    return {
      key: secret.key,
      type: secret.type,
      path: secret.path,
      data: result.data ?? {},
    };
  }

  async getVersion(): Promise<number | undefined> {
    return undefined;
  }
}
