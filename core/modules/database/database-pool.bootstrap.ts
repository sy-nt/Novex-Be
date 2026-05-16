import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DatabasePoolManager } from './database-pool.manager';
import { HashicorpVaultService } from '../hashicorp-vault/hashicorp-vault.service';
import { HASHICORP_VAULT_SERVICE } from '../hashicorp-vault/hashicorp-vault.di-token';
import { DATABASE_POOL_MANAGER } from './database-pool.di-token';

@Injectable()
export class DatabasePoolBootstrap implements OnModuleInit {
  constructor(
    @Inject(DATABASE_POOL_MANAGER)
    private readonly databasePoolManager: DatabasePoolManager,
    @Inject(HASHICORP_VAULT_SERVICE)
    private readonly hashicorpVaultService: HashicorpVaultService,
  ) {}

  async onModuleInit(): Promise<void> {
    const creds = this.hashicorpVaultService.getSecret<{
      username: string;
      password: string;
    }>('database');
    if (!creds) throw new Error('Database credentials not found');

    await this.databasePoolManager.initialize(
      creds.data.username,
      creds.data.password,
    );
  }
}
