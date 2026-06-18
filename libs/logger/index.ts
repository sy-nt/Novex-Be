import { ConfigModule, ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { LoggerModuleAsyncParams } from 'nestjs-pino';
import { context, trace } from '@opentelemetry/api';
import { v7 as uuidv7 } from 'uuid';
import { RequestMethod } from '@nestjs/common';

interface RequestWithId extends Request {
  requestId?: string;
  user?: {
    id?: string;
  };
}

export const loggerModuleParams: LoggerModuleAsyncParams = {
  imports: [ConfigModule],
  inject: [ConfigService],

  useFactory: (configService: ConfigService) => ({
    forRoutes: [{ method: RequestMethod.ALL, path: '*splat' }],
    pinoHttp: {
      level: configService.get<string>('application.logLevel', 'info'),

      genReqId: (req: RequestWithId, res: Response) => {
        const requestId = (req.headers['x-request-id'] as string) ?? uuidv7();

        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);
        return requestId;
      },

      customProps: (req: RequestWithId) => {
        const span = trace.getSpan(context.active());
        const spanContext = span?.spanContext();

        return {
          requestId: req.requestId,
          traceId: spanContext?.traceId,
          spanId: spanContext?.spanId,
          userId: req.user?.id,
          service: configService.get<string>('application.serviceName'),
          version: configService.get<string>('application.version'),
          environment: configService.get<string>(
            'application.deploymentEnvironment',
          ),
        };
      },

      serializers: {
        req(req: RequestWithId) {
          return {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            ip: req.ip,
          };
        },

        res(res: Response) {
          return {
            statusCode: res.statusCode,
          };
        },

        err(error: Error) {
          return {
            type: error.name,
            message: error.message,
            stack: error.stack,
          };
        },
      },

      transport:
        configService.get<string>('application.deploymentEnvironment') !==
        'PROD'
          ? {
              targets: [
                {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: "yyyy-mm-dd'T'HH:mm:ss.l'Z'",
                    singleLine: false,
                    ignore: 'pid,hostname',
                  },
                },
              ],
            }
          : undefined,

      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          'accessToken',
          'refreshToken',
        ],
        censor: '[REDACTED]',
      },

      autoLogging: false,
    },
  }),
};
