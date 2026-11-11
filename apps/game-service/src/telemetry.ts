/**
 * Inicializacion de OpenTelemetry (trazas + metricas via OTLP/HTTP).
 * Debe importarse ANTES que cualquier otro modulo en main.ts.
 *
 * Solo se activa si OTEL_EXPORTER_OTLP_ENDPOINT esta definido, OTEL_SDK_DISABLED
 * no es "true" y NODE_ENV no es "test". Sin colector (Render, tests) no hace nada;
 * si el colector cae, los exportadores fallan en silencio y la app sigue.
 */
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { SocketIoInstrumentation } from "@opentelemetry/instrumentation-socket.io";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

export function isTelemetryEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) &&
    env.OTEL_SDK_DISABLED !== "true" &&
    env.NODE_ENV !== "test"
  );
}

let sdk: NodeSDK | undefined;

export function startTelemetry(env: NodeJS.ProcessEnv = process.env): NodeSDK | undefined {
  if (sdk || !isTelemetryEnabled(env)) {
    return sdk;
  }
  try {
    const base = env.OTEL_EXPORTER_OTLP_ENDPOINT!.trim().replace(/\/+$/, "");
    env.OTEL_SERVICE_NAME ??= "game-service";
    const instance = new NodeSDK({
      traceExporter: new OTLPTraceExporter({ url: `${base}/v1/traces` }),
      metricReaders: [new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: `${base}/v1/metrics` }),
        exportIntervalMillis: 10_000,
      })],
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new NestInstrumentation(),
        new SocketIoInstrumentation(),
      ],
    });
    instance.start();
    sdk = instance;
    const shutdown = () => {
      void instance.shutdown().catch(() => undefined);
    };
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  } catch (err) {
    console.warn(`[telemetry] OpenTelemetry no pudo iniciar: ${String(err)}`);
  }
  return sdk;
}

startTelemetry();