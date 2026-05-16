import { Module } from '@nestjs/common';
import { hashicorpVaultConfig, databaseConfig } from './configs';
import { HashicorpVaultModule, DatabaseModule } from '@core/modules';
@Module({
  imports: [
    HashicorpVaultModule.forRoot(hashicorpVaultConfig),
    DatabaseModule.forRoot(databaseConfig),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
