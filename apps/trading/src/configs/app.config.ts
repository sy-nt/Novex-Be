import { get } from 'env-var';
import { AppConfig } from './config.type';
import { ConfigFactory, registerAs } from '@nestjs/config';

export const appConfig: ConfigFactory<AppConfig> = registerAs(
  'application',
  () => ({
    port: get('PORT').required().asIntPositive(),
    version: get('SERVICE_VERSION').required().asString(),
    serviceName: get('SERVICE_NAME').default('campaign').asString(),
    deploymentEnvironment: get('NODE_ENV')
      .required()
      .asEnum(['DEV', 'PROD', 'TEST']),
    logLevel: get('LOG_LEVEL').default('info').asString(),
  }),
);
