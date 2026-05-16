import { Module } from '@nestjs/common';
import { DatabaseModule, HashicorpVaultModule } from '@core/modules';
import { databaseConfig, hashicorpVaultConfig } from './configs';
@Module({
  imports: [
    HashicorpVaultModule.forRoot(hashicorpVaultConfig),
    DatabaseModule.forRoot(databaseConfig),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
