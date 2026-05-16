import { VaultAuthType } from '../types/auth.types';
import { client as VaultNativeClient } from 'node-vault';

export interface AuthSession {
  token: string;
  renewable: boolean;
  leaseDurationSec: number;
}

export interface AuthProvider {
  readonly type: VaultAuthType;
  authenticate(client: VaultNativeClient): Promise<AuthSession>;
}
