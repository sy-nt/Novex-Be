export enum SecretEngineType {
  KV = 'kv',
  Database = 'database',
  Transit = 'transit',
}

export interface SecretLease {
  leaseId: string;
  leaseDurationSec: number;
  renewable: boolean;
  expiresAt: number;
}

export interface SecretDescriptor {
  key: string;
  type: SecretEngineType | string;
  path: string;
}

export interface SecretRecord<T = Record<string, unknown>> {
  key: string;
  type: SecretEngineType | string;
  path: string;
  data: T;
  version?: number;
  lease?: SecretLease;
}
