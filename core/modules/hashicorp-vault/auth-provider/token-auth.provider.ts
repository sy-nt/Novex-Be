import { TokenAuthOptions, VaultAuthType } from '../types/auth.types';
import { AuthProvider, AuthSession } from './auth-provider.port';
import { client as VaultNativeClient } from 'node-vault';

interface TokenLookupSelfResponse {
  data?: {
    ttl?: number;
    renewable?: boolean;
  };
}

export class TokenAuthProvider implements AuthProvider {
  readonly type = VaultAuthType.Token;

  constructor(private readonly options: TokenAuthOptions) {}

  async authenticate(client: VaultNativeClient): Promise<AuthSession> {
    client.token = this.options.token;

    if (typeof this.options.ttlSeconds === 'number') {
      return {
        token: this.options.token,
        renewable: this.options.renewable ?? false,
        leaseDurationSec: this.options.ttlSeconds,
      };
    }

    try {
      const result =
        (await client.tokenLookupSelf()) as TokenLookupSelfResponse;

      return {
        token: this.options.token,
        renewable: result.data?.renewable ?? this.options.renewable ?? false,
        leaseDurationSec: result.data?.ttl ?? 0,
      };
    } catch (cause) {
      throw new Error(
        'Vault token lookup failed; set auth.options.ttlSeconds for static tokens',
        { cause },
      );
    }
  }
}
