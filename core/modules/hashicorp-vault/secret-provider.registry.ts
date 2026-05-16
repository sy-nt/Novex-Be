import { ProviderBase } from './secret-provider/secret-provider.base';

export class SecretProviderRegistry {
  private readonly providers = new Map<string, ProviderBase>();
  private fallbackProvider?: ProviderBase;

  register(provider: ProviderBase): this {
    if (provider.type === '*') {
      this.fallbackProvider = provider;
      return this;
    }

    this.providers.set(provider.type, provider);
    return this;
  }

  get(type: string): ProviderBase {
    const provider = this.providers.get(type) ?? this.fallbackProvider;

    if (!provider) {
      throw new Error(`No secret provider registered for type "${type}"`);
    }

    return provider;
  }
}
