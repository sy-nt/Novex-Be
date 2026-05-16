import { Logger } from '@nestjs/common';
import { client as VaultNativeClient } from 'node-vault';
import { AuthProviderRegistry } from './auth-provider.registry';
import { VaultAuthConfig } from './types/auth.types';

interface TokenRenewResponse {
  auth?: {
    client_token?: string;
    renewable?: boolean;
    lease_duration?: number;
  };
}

export class VaultAuthManager {
  private readonly logger = new Logger(VaultAuthManager.name);
  private renewTimeout?: NodeJS.Timeout;
  private expiresAt = 0;
  private renewable = false;
  private authInFlight?: Promise<void>;

  constructor(
    private readonly client: VaultNativeClient,
    private readonly auth: VaultAuthConfig,
    private readonly registry: AuthProviderRegistry,
    private readonly renewBufferMs: number,
  ) {}

  async start(): Promise<void> {
    await this.authenticate();
  }

  stop(): void {
    if (this.renewTimeout) {
      clearTimeout(this.renewTimeout);
      this.renewTimeout = undefined;
    }
  }

  async ensureValidToken(): Promise<void> {
    const shouldRefresh =
      !this.client.token ||
      (this.expiresAt > 0 && Date.now() >= this.expiresAt - this.renewBufferMs);

    if (!shouldRefresh) {
      return;
    }

    await this.authenticate();
  }

  private async authenticate(): Promise<void> {
    if (this.authInFlight) {
      return this.authInFlight;
    }

    this.authInFlight = this.doAuthenticate().finally(() => {
      this.authInFlight = undefined;
    });

    return this.authInFlight;
  }

  private async doAuthenticate(): Promise<void> {
    const provider = this.registry.get(this.auth.type);
    const session = await provider.authenticate(this.client);

    this.client.token = session.token;
    this.renewable = session.renewable;
    this.expiresAt =
      session.leaseDurationSec > 0
        ? Date.now() + session.leaseDurationSec * 1000
        : 0;

    this.scheduleRenewal(session.leaseDurationSec);
  }

  private scheduleRenewal(leaseDurationSec: number): void {
    if (this.renewTimeout) {
      clearTimeout(this.renewTimeout);
      this.renewTimeout = undefined;
    }

    if (leaseDurationSec <= 0) {
      return;
    }

    const renewInMs = Math.max(
      leaseDurationSec * 1000 - this.renewBufferMs,
      5_000,
    );

    this.renewTimeout = setTimeout(() => {
      void this.runTokenRenewal();
    }, renewInMs);
  }

  private async runTokenRenewal(): Promise<void> {
    try {
      if (this.renewable) {
        await this.renewSelfToken();
        return;
      }

      await this.authenticate();
    } catch (error) {
      this.logger.warn(
        'Vault token renewal failed, re-authenticating',
        error instanceof Error ? error.stack : String(error),
      );

      try {
        await this.authenticate();
      } catch (reauthError) {
        this.logger.error(
          'Vault re-authentication failed after renewal error',
          reauthError instanceof Error
            ? reauthError.stack
            : String(reauthError),
        );
      }
    }
  }

  private async renewSelfToken(): Promise<void> {
    const renewed = (await this.client.tokenRenewSelf()) as TokenRenewResponse;
    const auth = renewed.auth;

    if (!auth?.client_token || typeof auth.lease_duration !== 'number') {
      await this.authenticate();
      return;
    }

    this.client.token = auth.client_token;
    this.renewable = auth.renewable ?? false;
    this.expiresAt = Date.now() + auth.lease_duration * 1000;

    this.scheduleRenewal(auth.lease_duration);
  }
}
