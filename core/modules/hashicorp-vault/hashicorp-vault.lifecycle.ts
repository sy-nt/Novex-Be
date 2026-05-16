import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { HASHICORP_VAULT_SERVICE } from './hashicorp-vault.di-token';
import { HashicorpVaultService } from './hashicorp-vault.service';

@Injectable()
export class HashicorpVaultLifecycle implements OnApplicationShutdown {
  constructor(
    @Inject(HASHICORP_VAULT_SERVICE)
    private readonly vaultService: HashicorpVaultService,
  ) {}

  onApplicationShutdown(): void {
    this.vaultService.stop();
  }
}
