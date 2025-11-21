const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { MongoDBInstrumentation } = require('@opentelemetry/instrumentation-mongodb');
const { RedisInstrumentation } = require('@opentelemetry/instrumentation-redis-4');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

/**
 * Initialize OpenTelemetry tracing for a service
 * @param {string} serviceName - Name of the service
 * @param {string} serviceVersion - Version of the service
 * @returns {object} - Tracer instance
 */
function initTracing(serviceName, serviceVersion = '1.0.0') {
  const jaegerHost = process.env.JAEGER_HOST || 'localhost';
  const jaegerPort = process.env.JAEGER_PORT || 14268;
  
  // Create a tracer provider with resource information
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
    })
  });

  // Configure Jaeger exporter
  const jaegerExporter = new JaegerExporter({
    endpoint: `http://${jaegerHost}:${jaegerPort}/api/traces`,
  });

  // Add batch span processor
  provider.addSpanProcessor(new BatchSpanProcessor(jaegerExporter));

  // Register the provider
  provider.register();

  // Auto-instrument libraries
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        requestHook: (span, request) => {
          span.setAttribute('http.request.id', request.headers['x-correlation-id']);
        }
      }),
      new ExpressInstrumentation(),
      new MongoDBInstrumentation({
        enhancedDatabaseReporting: true
      }),
      new RedisInstrumentation()
    ]
  });

  console.log(`[${serviceName}] OpenTelemetry tracing initialized with Jaeger at ${jaegerHost}:${jaegerPort}`);

  // Return tracer for manual instrumentation
  const { trace } = require('@opentelemetry/api');
  return trace.getTracer(serviceName, serviceVersion);
}

/**
 * Create a custom span
 * @param {object} tracer - Tracer instance
 * @param {string} spanName - Name of the span
 * @param {function} fn - Function to execute within the span
 * @param {object} attributes - Optional span attributes
 */
async function createSpan(tracer, spanName, fn, attributes = {}) {
  const span = tracer.startSpan(spanName);
  
  // Add custom attributes
  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });

  try {
    const result = await fn(span);
    span.setStatus({ code: 1 }); // OK
    return result;
  } catch (error) {
    span.setStatus({
      code: 2, // ERROR
      message: error.message
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

module.exports = {
  initTracing,
  createSpan
};
