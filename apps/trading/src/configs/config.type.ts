export type AppConfig = {
  port: number;
  serviceName: string;
  version: string;
  deploymentEnvironment: 'DEV' | 'PROD' | 'TEST';
};
