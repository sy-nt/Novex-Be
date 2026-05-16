import { EventEmitter } from 'events';
import vault from 'node-vault';
import { SecretProviderRegistry } from './secret-provider.registry';
import { AuthProviderRegistry } from './auth-provider.registry';
import { VaultAuthManager } from './auth-manager';
import { VaultSecretManager } from './secret-manager';
import { SecretRecord } from './types/secret.type';
import { VaultAuthType } from './types/auth.types';
import {
  GenericSecretProvider,
  KvSecretProvider,
  DatabaseSecretProvider,
  TransitSecretProvider,
} from './secret-provider';
import { AppRoleAuthProvider, TokenAuthProvider } from './auth-provider';
import { resolveMergedValue } from './resolve-merged-value';
import { VaultServiceOptions } from './types/service.type';

function registerAuthProvider(
  registry: AuthProviderRegistry,
  auth: VaultServiceOptions['auth'],
): void {
  switch (auth.type) {
    case VaultAuthType.AppRole:
      registry.register(new AppRoleAuthProvider(auth.options));
      return;
    case VaultAuthType.Token:
      registry.register(new TokenAuthProvider(auth.options));
      return;
    default: {
      const unsupported: never = auth;
      throw new Error(
        `Unsupported Vault auth type "${(unsupported as { type: string }).type}"`,
      );
    }
  }
}

export class HashicorpVaultService extends EventEmitter {
  private readonly authManager: VaultAuthManager;
  private readonly secretManager: VaultSecretManager;

  constructor(private readonly options: VaultServiceOptions) {
    super();

    const client = vault(this.options.client);

    const authRegistry = new AuthProviderRegistry();
    registerAuthProvider(authRegistry, this.options.auth);

    this.authManager = new VaultAuthManager(
      client,
      this.options.auth,
      authRegistry,
      this.options.tokenRenewBufferMs ?? 60_000,
    );

    const secretRegistry = new SecretProviderRegistry()
      .register(new KvSecretProvider())
      .register(new DatabaseSecretProvider())
      .register(new TransitSecretProvider())
      .register(new GenericSecretProvider());

    this.secretManager = new VaultSecretManager(
      client,
      this.authManager,
      secretRegistry,
      this.options.secrets,
      this.options.pollIntervalMs ?? 10_000,
      this.options.databaseRotateBufferMs ?? 30_000,
    );

    this.secretManager.on('secretChanged', () => {
      this.emit('secretChanged', this.secretManager.getMergedData());
    });
  }

  async start(): Promise<void> {
    await this.authManager.start();
    await this.secretManager.start();
  }

  stop(): void {
    this.secretManager.stop();
    this.authManager.stop();
  }

  get<T = unknown>(key: string, fallback?: T): T {
    return resolveMergedValue(
      key,
      this.secretManager.getMergedData(),
      fallback,
    );
  }

  getAll<T extends Record<string, unknown>>(): T {
    return this.secretManager.getMergedData() as T;
  }

  getSecret<T extends Record<string, unknown>>(
    key: string,
  ): SecretRecord<T> | undefined {
    return this.secretManager.getRecord<T>(key);
  }

  getAllSecrets(): Record<string, SecretRecord> {
    return this.secretManager.getAllRecords();
  }
}
