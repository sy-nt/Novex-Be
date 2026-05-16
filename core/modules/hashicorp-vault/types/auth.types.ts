export enum VaultAuthType {
  AppRole = 'app-role',
  Token = 'token',
}

export interface AppRoleAuthOptions {
  roleId: string;
  secretId: string;
  mountPath?: string;
}

export interface TokenAuthOptions {
  token: string;
  /**
   * Optional explicit TTL in seconds for static tokens.
   */
  ttlSeconds?: number;
  renewable?: boolean;
}

export type VaultAuthConfig =
  | {
      type: VaultAuthType.AppRole;
      options: AppRoleAuthOptions;
    }
  | {
      type: VaultAuthType.Token;
      options: TokenAuthOptions;
    };

export interface VaultClientOptions {
  endpoint: string;
  apiVersion?: string;
}
