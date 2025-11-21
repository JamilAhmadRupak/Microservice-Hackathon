// Initialize tracing BEFORE any other imports
const { initTracing } = require('../../shared/utils/tracing');

const serviceName = 'pledge-service';
const serviceVersion = require('../package.json').version;

const tracer = initTracing(serviceName, serviceVersion);

module.exports = { tracer };
