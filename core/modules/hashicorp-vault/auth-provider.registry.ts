import { AuthProvider } from './auth-provider/auth-provider.port';
import { VaultAuthType } from './types/auth.types';

export class AuthProviderRegistry {
  private readonly providers = new Map<VaultAuthType, AuthProvider>();

  register(provider: AuthProvider): this {
    this.providers.set(provider.type, provider);
    return this;
  }

  get(type: VaultAuthType): AuthProvider {
    const provider = this.providers.get(type);

    if (!provider) {
      throw new Error(`No auth provider registered for type "${type}"`);
    }

    return provider;
  }
}
