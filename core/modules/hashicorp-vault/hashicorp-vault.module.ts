import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  HASHICORP_VAULT_OPTIONS,
  HASHICORP_VAULT_SERVICE,
} from './hashicorp-vault.di-token';
import { HashicorpVaultLifecycle } from './hashicorp-vault.lifecycle';
import { HashicorpVaultService } from './hashicorp-vault.service';
import { VaultServiceOptions } from './types/service.type';

@Global()
@Module({})
export class HashicorpVaultModule {
  static forRoot(options: VaultServiceOptions): DynamicModule {
    return {
      module: HashicorpVaultModule,
      providers: [
        {
          provide: HASHICORP_VAULT_OPTIONS,
          useValue: options,
        },
        {
          provide: HASHICORP_VAULT_SERVICE,
          useFactory: async (options: VaultServiceOptions) => {
            const service = new HashicorpVaultService(options);
            await service.start();
            return service;
          },
          inject: [HASHICORP_VAULT_OPTIONS],
        },
        HashicorpVaultLifecycle,
      ],
      exports: [HASHICORP_VAULT_SERVICE],
    };
  }
}
