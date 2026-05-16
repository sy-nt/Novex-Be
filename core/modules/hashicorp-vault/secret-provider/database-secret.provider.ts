import { client as VaultNativeClient } from 'node-vault';
import { ProviderBase } from './secret-provider.base';
import {
  SecretDescriptor,
  SecretEngineType,
  SecretLease,
  SecretRecord,
} from '../types/secret.type';

interface LeaseResponse {
  data?: Record<string, unknown>;
  lease_id?: string;
  lease_duration?: number;
  renewable?: boolean;
}

export class DatabaseSecretProvider extends ProviderBase {
  readonly type = SecretEngineType.Database;

  async read(
    client: VaultNativeClient,
    secret: SecretDescriptor,
  ): Promise<SecretRecord> {
    const result = (await client.read(secret.path)) as LeaseResponse;
    const lease = this.toLease(result);

    return {
      key: secret.key,
      type: secret.type,
      path: secret.path,
      data: result.data ?? {},
      lease,
    };
  }

  private toLease(result: LeaseResponse): SecretLease | undefined {
    if (!result.lease_id || typeof result.lease_duration !== 'number') {
      return undefined;
    }

    return {
      leaseId: result.lease_id,
      leaseDurationSec: result.lease_duration,
      renewable: result.renewable ?? false,
      expiresAt: Date.now() + result.lease_duration * 1000,
    };
  }

  async getVersion(): Promise<number | undefined> {
    return undefined;
  }
}
