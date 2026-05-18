import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  HASHICORP_VAULT_OPTIONS,
  HASHICORP_VAULT_SERVICE,
} from './hashicorp-vault.di-token';
import { HashicorpVaultLifecycle } from './hashicorp-vault.lifecycle';
import { HashicorpVaultService } from './hashicorp-vault.service';
import { HashicorpVaultOptions } from './types/service.type';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
})
export class HashicorpVaultModule {
  static forRoot(): DynamicModule {
    return {
      module: HashicorpVaultModule,
      providers: [
        {
          provide: HASHICORP_VAULT_SERVICE,
          useFactory: async (configService: ConfigService) => {
            const options = configService.getOrThrow<HashicorpVaultOptions>(
              HASHICORP_VAULT_OPTIONS.toString(),
            );
            const service = new HashicorpVaultService(options);
            await service.start();
            return service;
          },
          inject: [ConfigService],
        },
        HashicorpVaultLifecycle,
      ],
      exports: [HASHICORP_VAULT_SERVICE],
    };
  }
}
