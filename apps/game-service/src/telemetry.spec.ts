import { isTelemetryEnabled } from "./telemetry";

describe("isTelemetryEnabled", () => {
  it("is off without an OTLP endpoint", () => {
    expect(isTelemetryEnabled({ NODE_ENV: "production" })).toBe(false);
  });

  it("is off in test and when explicitly disabled", () => {
    const endpoint = "http://otel-collector:4318";
    expect(isTelemetryEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: endpoint, NODE_ENV: "test" })).toBe(false);
    expect(isTelemetryEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: endpoint, OTEL_SDK_DISABLED: "true" })).toBe(false);
  });

  it("is on with an endpoint outside tests", () => {
    expect(
      isTelemetryEnabled({ OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector:4318", NODE_ENV: "production" }),
    ).toBe(true);
  });
});