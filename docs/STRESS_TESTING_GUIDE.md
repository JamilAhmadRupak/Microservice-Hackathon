# Stress Testing & Load Testing Guide

## Overview

This document describes the stress testing and failure scenario testing setup for the CareForAll donation platform. The tests validate that the system can handle **1000+ RPS** and gracefully handle partial failures.

## Test Tools

- **k6** - Open-source load testing tool
- **Installation**: https://k6.io/docs/getting-started/installation/

### Quick Install

**Windows (PowerShell):**
```powershell
winget install k6 --source winget
```

**MacOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Test Scenarios

### 1. Stress Test (`tests/stress-test.js`)

Simulates realistic user behavior under increasing load to test system scalability.

#### Load Profile

| Stage | Duration | Virtual Users | Purpose |
|-------|----------|---------------|---------|
| Ramp-up 1 | 30s | 0 → 50 | Initial load |
| Ramp-up 2 | 1m | 50 → 200 | Moderate traffic |
| Ramp-up 3 | 2m | 200 → 500 | High traffic |
| Spike | 1m | 500 → 1000 | Peak load (1000+ RPS) |
| Sustained | 2m | 1000 | Hold peak load |
| Ramp-down 1 | 30s | 1000 → 100 | Gradual decrease |
| Ramp-down 2 | 30s | 100 → 0 | Wind down |

**Total Duration**: ~7.5 minutes  
**Peak Load**: 1000 concurrent users  
**Expected RPS**: 1000-1500 requests/second

#### Test Scenarios

1. **Browse Campaigns (33% of traffic)**
   - Read-heavy operation
   - Tests read model performance
   - Target: < 500ms response time

2. **Create Campaign (20% of traffic)**
   - Write operation requiring authentication
   - Tests database write performance
   - Target: < 1000ms response time

3. **Make Donation/Pledge (50% of traffic)**
   - Critical path with idempotency
   - Tests payment flow and event publishing
   - Tests Outbox pattern reliability
   - Includes idempotency validation
   - Target: < 800ms response time

4. **View Campaign Details**
   - Read operation using optimized read models
   - Tests caching effectiveness
   - Target: < 300ms response time

#### Performance Thresholds

```javascript
thresholds: {
  'http_req_duration': ['p(95)<500', 'p(99)<1000'],  // 95% under 500ms
  'http_req_failed': ['rate<0.05'],                   // Error rate < 5%
}
```

### 2. Failure Scenarios (`tests/failure-scenarios.js`)

Tests system resilience under partial failure conditions.

#### Scenario 1: Redis Failure (Event Bus Down)
- **Duration**: 2 minutes
- **Virtual Users**: 50
- **Purpose**: Test Outbox pattern resilience
- **Expected Behavior**:
  - Pledges still created and saved to database
  - Events queued in Outbox table
  - System remains operational
  - < 20% error rate
  - < 2000ms response time

#### Scenario 2: MongoDB Slow Queries
- **Duration**: 1.5 minutes
- **Virtual Users**: 0 → 200 (ramping)
- **Purpose**: Test read model optimization
- **Expected Behavior**:
  - Read models serve data quickly
  - Campaign totals don't require aggregation
  - < 3000ms response time under load
  - No timeout errors (504)

#### Scenario 3: Service Timeout
- **Duration**: 1 minute
- **Virtual Users**: 30
- **Purpose**: Test graceful degradation
- **Expected Behavior**:
  - Services respond before timeout (10s)
  - Proper error messages returned
  - No cascading failures
  - < 5000ms for 99th percentile

## Running Tests

### Prerequisites

1. **Start All Services**:
```bash
docker-compose up -d
```

2. **Verify Services Running**:
```bash
docker-compose ps
```

3. **Check Health**:
```bash
curl http://localhost:3000/
```

### Execute Stress Test

```bash
# Basic stress test
k6 run tests/stress-test.js

# With custom base URL
k6 run --env BASE_URL=http://localhost:3000 tests/stress-test.js

# Save results to file
k6 run tests/stress-test.js --out json=stress-test-results.json

# Run with InfluxDB (for real-time monitoring)
k6 run --out influxdb=http://localhost:8086/k6 tests/stress-test.js
```

### Execute Failure Scenario Tests

```bash
k6 run tests/failure-scenarios.js
```

### Simulate Redis Failure During Test

In a separate terminal:
```bash
# Stop Redis during test
docker-compose stop redis

# Wait 1-2 minutes...

# Restart Redis
docker-compose start redis
```

### Simulate MongoDB Slowness

```bash
# Connect to MongoDB container
docker exec -it careforall-mongodb mongosh

# Enable profiling
use careforall
db.setProfilingLevel(2)

# Add artificial delay (not recommended for production!)
db.campaigns.find().forEach(function(doc) { sleep(100); });
```

## Interpreting Results

### Key Metrics

1. **Request Rate**: Should achieve 1000+ req/s at peak
2. **Response Time**:
   - p95 < 500ms
   - p99 < 1000ms
   - Average < 300ms
3. **Error Rate**: < 5%
4. **Virtual Users**: Peak 1000 concurrent users

### Success Criteria

✅ **PASS** if:
- System handles 1000+ concurrent users
- 95% of requests complete under 500ms
- Error rate stays below 5%
- No cascading failures
- Idempotency works correctly (duplicate requests don't create duplicates)
- Read models serve data efficiently
- Outbox pattern queues events when Redis is down

❌ **FAIL** if:
- Response times exceed 1000ms consistently
- Error rate > 10%
- System crashes or becomes unresponsive
- Database deadlocks occur
- Memory leaks detected

### Sample Output

```
=============================================================
STRESS TEST SUMMARY
=============================================================

Total Requests: 125,847
Request Rate: 1,432.18 req/s
Failed Requests: 2.13%

Response Times:
  Average: 287.43ms
  Median: 245.12ms
  95th Percentile: 478.91ms
  99th Percentile: 892.34ms
  Max: 1,234.56ms

Peak Virtual Users: 1000
Test Duration: 7.50 minutes

=============================================================
```

## Observability During Tests

### View Traces in Jaeger

1. Open: http://localhost:16686
2. Select service: `api-gateway`, `pledge-service`, etc.
3. Search for traces during test period
4. Look for:
   - End-to-end donation flow
   - Service call chains
   - Slow queries
   - Error traces

### View Metrics in Grafana

1. Open: http://localhost:3100 (admin/admin)
2. View dashboards:
   - System Overview
   - Request Rate
   - Response Times
   - Error Rates
3. Look for:
   - CPU/Memory spikes
   - Request queue buildups
   - Database connection pool exhaustion

### View Logs in Kibana

1. Open: http://localhost:5601
2. Create index pattern: `careforall-logs-*`
3. Search for errors during test window
4. Filter by:
   - Service name
   - Error level
   - Correlation ID

### Prometheus Queries

Access: http://localhost:9090

**Request Rate:**
```promql
rate(http_requests_total[1m])
```

**Error Rate:**
```promql
rate(http_requests_total{status=~"5.."}[1m])
```

**Response Time (p95):**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Performance Optimization Tips

### If Response Times Are High

1. **Check Database Indexes**:
```javascript
// Add indexes for frequently queried fields
campaignSchema.index({ status: 1, createdAt: -1 });
pledgeSchema.index({ campaignId: 1, createdAt: -1 });
```

2. **Enable Redis Caching**:
```javascript
// Cache campaign details
const cachedCampaign = await redis.get(`campaign:${id}`);
if (cachedCampaign) return JSON.parse(cachedCampaign);
```

3. **Use Read Models**:
```javascript
// Use pre-aggregated totals instead of counting
const totals = await CampaignTotals.findOne({ campaignId });
```

### If Error Rate Is High

1. **Check Connection Pools**:
```javascript
mongoose.connect(uri, {
  maxPoolSize: 100,
  minPoolSize: 10
});
```

2. **Add Retry Logic**:
```javascript
const retryOperation = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
};
```

3. **Enable Circuit Breaker**:
```javascript
// Fail fast when service is down
if (circuitOpen) throw new ServiceUnavailableError();
```

## Architecture Validation

### Tests Validate These Patterns

✅ **Idempotency**: Duplicate requests with same key return cached response  
✅ **Outbox Pattern**: Events queued when Redis is unavailable  
✅ **State Machine**: Invalid state transitions prevented  
✅ **Read Models**: Campaign totals served without aggregation  
✅ **Event-Driven**: Services communicate via Redis pub/sub  
✅ **Scalability**: Horizontal scaling with Docker replicas  
✅ **Fault Tolerance**: Graceful degradation during failures  

## Troubleshooting

### Test Fails to Connect

```bash
# Check if services are running
docker-compose ps

# Check API Gateway logs
docker logs api-gateway --tail=50

# Test connectivity
curl http://localhost:3000/
```

### High Memory Usage

```bash
# Check container stats
docker stats

# If MongoDB memory is high
docker exec -it careforall-mongodb mongosh
db.adminCommand({ setParameter: 1, internalQueryExecMaxBlockingSortBytes: 33554432 })
```

### Redis Connection Errors

```bash
# Check Redis logs
docker logs careforall-redis --tail=50

# Test Redis connection
docker exec -it careforall-redis redis-cli ping
```

## Continuous Performance Testing

### Add to CI/CD Pipeline

```yaml
# .github/workflows/performance-test.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run nightly
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services
        run: sleep 30
      
      - name: Install k6
        run: |
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run stress test
        run: k6 run tests/stress-test.js --out json=results.json
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: results.json
```

## Next Steps

1. ✅ Run baseline stress test
2. ✅ View traces in Jaeger
3. ✅ Monitor metrics in Grafana
4. ✅ Test failure scenarios
5. ✅ Document bottlenecks
6. ✅ Optimize and re-test

---

**Test Responsibly**: These tests generate significant load. Only run against test environments, never production!
