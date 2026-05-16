import { AppRoleAuthOptions, VaultAuthType } from '../types/auth.types';
import { AuthProvider, AuthSession } from './auth-provider.port';
import { client as VaultNativeClient } from 'node-vault';

interface AppRoleLoginResponse {
  auth?: {
    client_token?: string;
    renewable?: boolean;
    lease_duration?: number;
  };
}

export class AppRoleAuthProvider implements AuthProvider {
  readonly type = VaultAuthType.AppRole;

  constructor(private readonly options: AppRoleAuthOptions) {}

  async authenticate(client: VaultNativeClient): Promise<AuthSession> {
    const payload: Record<string, string> = {
      role_id: this.options.roleId,
      secret_id: this.options.secretId,
    };

    if (this.options.mountPath) {
      payload.mount_point = this.options.mountPath;
    }

    const result = (await client.approleLogin(payload)) as AppRoleLoginResponse;
    const auth = result.auth;

    if (
      !auth?.client_token ||
      typeof auth.renewable !== 'boolean' ||
      typeof auth.lease_duration !== 'number'
    ) {
      throw new Error('Vault AppRole login returned an invalid auth response');
    }

    return {
      token: auth.client_token,
      renewable: auth.renewable,
      leaseDurationSec: auth.lease_duration,
    };
  }
}
