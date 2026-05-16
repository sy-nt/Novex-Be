import { client as VaultNativeClient } from 'node-vault';
import { SecretDescriptor, SecretRecord } from '../types/secret.type';

export abstract class ProviderBase {
  abstract readonly type: string;

  abstract read(
    client: VaultNativeClient,
    secret: SecretDescriptor,
  ): Promise<SecretRecord>;

  abstract getVersion(
    client: VaultNativeClient,
    secret: SecretDescriptor,
  ): Promise<number | undefined>;
}
