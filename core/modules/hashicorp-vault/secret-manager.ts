import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import { client as VaultNativeClient } from 'node-vault';
import { SecretProviderRegistry } from './secret-provider.registry';
import {
  SecretDescriptor,
  SecretEngineType,
  SecretRecord,
} from './types/secret.type';
import { VaultAuthManager } from './auth-manager';

const MIN_SCHEDULE_MS = 5_000;

export interface SecretManagerEvents {
  secretChanged: (secret: SecretRecord) => void;
}

export class VaultSecretManager extends EventEmitter {
  private readonly logger = new Logger(VaultSecretManager.name);
  private readonly records = new Map<string, SecretRecord>();
  private readonly dbRotateTimers = new Map<string, NodeJS.Timeout>();
  private pollTimer?: NodeJS.Timeout;

  constructor(
    private readonly client: VaultNativeClient,
    private readonly authManager: VaultAuthManager,
    private readonly registry: SecretProviderRegistry,
    private readonly secrets: SecretDescriptor[],
    private readonly pollIntervalMs: number,
    private readonly databaseRotateBufferMs: number,
  ) {
    super();
  }

  async start(): Promise<void> {
    await this.loadAll();
    this.startPolling();
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    for (const timer of this.dbRotateTimers.values()) {
      clearTimeout(timer);
    }

    this.dbRotateTimers.clear();
  }

  getRecord<T = Record<string, unknown>>(
    key: string,
  ): SecretRecord<T> | undefined {
    return this.records.get(key) as SecretRecord<T> | undefined;
  }

  getAllRecords(): Record<string, SecretRecord> {
    const data: Record<string, SecretRecord> = {};

    for (const [key, record] of this.records.entries()) {
      data[key] = record;
    }

    return data;
  }

  getMergedData(): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    for (const record of this.records.values()) {
      merged[record.key] = record.data;
    }

    return merged;
  }

  private async loadAll(): Promise<void> {
    for (const secret of this.secrets) {
      await this.refreshSecret(secret, false);
    }
  }

  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      void this.pollVersionedSecrets();
    }, this.pollIntervalMs);
  }

  private async pollVersionedSecrets(): Promise<void> {
    for (const secret of this.secrets) {
      try {
        await this.syncVersionedSecret(secret);
      } catch (error) {
        this.logger.warn(
          `Failed to sync Vault secret "${secret.key}"`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async syncVersionedSecret(secret: SecretDescriptor): Promise<void> {
    await this.authManager.ensureValidToken();
    const provider = this.registry.get(secret.type);

    const latestVersion = await provider.getVersion(this.client, secret);
    if (typeof latestVersion !== 'number') {
      return;
    }

    const currentVersion = this.records.get(secret.key)?.version;
    if (typeof currentVersion === 'number' && currentVersion >= latestVersion) {
      return;
    }

    await this.refreshSecret(secret, true);
  }

  private async refreshSecret(
    secret: SecretDescriptor,
    emitEvent: boolean,
  ): Promise<void> {
    await this.authManager.ensureValidToken();
    const provider = this.registry.get(secret.type);
    const record = await provider.read(this.client, secret);

    this.records.set(secret.key, record);
    this.scheduleDatabaseRotation(secret, record);

    if (emitEvent) {
      this.emit('secretChanged', record);
    }
  }

  private scheduleDatabaseRotation(
    secret: SecretDescriptor,
    record: SecretRecord,
  ): void {
    if ((secret.type as SecretEngineType) !== SecretEngineType.Database) {
      return;
    }

    const existing = this.dbRotateTimers.get(secret.key);
    if (existing) {
      clearTimeout(existing);
    }

    if (!record.lease) {
      this.scheduleDatabaseRefresh(secret, this.pollIntervalMs);
      return;
    }

    const rotateInMs = Math.max(
      record.lease.expiresAt - Date.now() - this.databaseRotateBufferMs,
      MIN_SCHEDULE_MS,
    );

    this.scheduleDatabaseRefresh(secret, rotateInMs);
  }

  private scheduleDatabaseRefresh(
    secret: SecretDescriptor,
    delayMs: number,
  ): void {
    const timer = setTimeout(() => {
      void this.runDatabaseRotation(secret);
    }, delayMs);

    this.dbRotateTimers.set(secret.key, timer);
  }

  private async runDatabaseRotation(secret: SecretDescriptor): Promise<void> {
    try {
      await this.refreshSecret(secret, true);
    } catch (error) {
      this.logger.error(
        `Failed to rotate Vault database secret "${secret.key}", retrying`,
        error instanceof Error ? error.stack : String(error),
      );
      this.scheduleDatabaseRefresh(
        secret,
        Math.max(this.pollIntervalMs, MIN_SCHEDULE_MS),
      );
    }
  }
}
