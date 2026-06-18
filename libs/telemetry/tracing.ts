import { NodeSDK } from '@opentelemetry/sdk-node';
import { get } from 'env-var';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import * as dotenv from 'dotenv';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resolve } from 'path';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

const tracing = (moduleName: string) => {
  dotenv.config({
    path: [
      resolve(process.cwd(), '.env'),
      resolve(process.cwd(), `apps/${moduleName.toLowerCase()}/.env`),
    ],
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: get('SERVICE_NAME').required().asString(),
      [ATTR_SERVICE_VERSION]: get('SERVICE_VERSION').required().asString(),
      deployment_environment: get('NODE_ENV').required().asString(),
    }),

    traceExporter: new OTLPTraceExporter({
      url: `${get('OTEL_EXPORTER_OTLP_ENDPOINT').required().asString()}/v1/traces`,
    }),

    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${get('OTEL_EXPORTER_OTLP_ENDPOINT').required().asString()}/v1/metrics`,
      }),
    }),

    logRecordProcessors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `${get('OTEL_EXPORTER_OTLP_ENDPOINT').required().asString()}/v1/logs`,
        }),
      ),
    ],

    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
};

export default tracing;
