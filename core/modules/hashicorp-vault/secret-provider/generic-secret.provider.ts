import { client as VaultNativeClient } from 'node-vault';
import { ProviderBase } from './secret-provider.base';
import { SecretDescriptor, SecretRecord } from '../types/secret.type';

interface GenericResponse {
  data?: Record<string, unknown>;
}

export class GenericSecretProvider extends ProviderBase {
  readonly type = '*';

  async read(
    client: VaultNativeClient,
    secret: SecretDescriptor,
  ): Promise<SecretRecord> {
    const result = (await client.read(secret.path)) as GenericResponse;

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
