import { client as VaultNativeClient } from 'node-vault';
import { ProviderBase } from './secret-provider.base';
import {
  SecretDescriptor,
  SecretEngineType,
  SecretRecord,
} from '../types/secret.type';

interface KvReadResponse {
  data?: {
    data?: Record<string, unknown>;
    metadata?: {
      version?: number;
    };
  };
}

interface KvMetadataResponse {
  data?: {
    current_version?: number;
  };
}

export class KvSecretProvider extends ProviderBase {
  readonly type = SecretEngineType.KV;

  async read(
    client: VaultNativeClient,
    secret: SecretDescriptor,
  ): Promise<SecretRecord> {
    const result = (await client.read(secret.path)) as KvReadResponse;

    return {
      key: secret.key,
      type: secret.type,
      path: secret.path,
      data: result.data?.data ?? {},
      version: result.data?.metadata?.version,
    };
  }

  async getVersion(
    client: VaultNativeClient,
    secret: SecretDescriptor,
  ): Promise<number | undefined> {
    const metadataPath = secret.path.replace('/data/', '/metadata/');

    if (metadataPath === secret.path) {
      return undefined;
    }

    const metadata = (await client.read(metadataPath)) as KvMetadataResponse;
    return metadata.data?.current_version;
  }
}
