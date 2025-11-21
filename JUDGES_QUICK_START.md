# 🎯 Quick Start Guide for Judges

## ⚡ Start the Platform (One Command)

### Windows (PowerShell)
```powershell
.\setup-and-run.ps1
```

### Linux/Mac
```bash
chmod +x setup-and-run.sh
./setup-and-run.sh
```

**OR** manually:
```bash
docker-compose up -d
```

Wait 30 seconds for services to initialize.

---

## 🌐 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | - |
| **API Gateway** | http://localhost:3000 | - |
| **Grafana** | http://localhost:3100 | admin/admin |
| **Prometheus** | http://localhost:9090 | - |
| **Jaeger (Tracing)** | http://localhost:16686 | - |
| **Kibana (Logs)** | http://localhost:5601 | - |

---

## 🔍 View Distributed Tracing (OpenTelemetry + Jaeger)

### Step 1: Generate Some Activity
```bash
# Get a campaign ID (or create one via frontend)
curl http://localhost:3000/api/campaigns

# Create a donation
curl -X POST http://localhost:3000/api/pledges \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: demo-$(date +%s)" \
  -d '{
    "campaignId": "PASTE_CAMPAIGN_ID_HERE",
    "amount": 5000,
    "donorInfo": {
      "name": "Judge Demo",
      "email": "judge@hackathon.com"
    }
  }'
```

### Step 2: View in Jaeger
1. Open: http://localhost:16686
2. Select Service: `api-gateway`
3. Click: **"Find Traces"**
4. Click on most recent trace

### What You'll See
```
api-gateway (POST /api/pledges)
  └─▶ pledge-service (createPledge)
       ├─▶ MongoDB (insert pledge)
       ├─▶ MongoDB (insert outbox)
       └─▶ Redis (publish pledge.created)
            └─▶ payment-service (processPayment)
                 ├─▶ MongoDB (insert transaction)
                 ├─▶ Mock Provider (authorize)
                 └─▶ Redis (publish pledge.completed)
                      └─▶ campaign-service (updateTotals)
                           └─▶ MongoDB (update totals)
```

**Expected Duration**: ~400-500ms end-to-end

---

## 🚀 Run Stress Tests (1000+ RPS)

### Prerequisites
Install k6:
```powershell
# Windows
winget install k6 --source winget

# Mac
brew install k6

# Linux
sudo apt-get install k6
```

### Run Main Stress Test
```bash
k6 run tests/stress-test.js
```

**Expected Results:**
- ✅ 1000+ requests per second
- ✅ 95th percentile < 500ms
- ✅ Error rate < 5%
- ✅ Idempotency validated
- ✅ System remains stable

### Run Failure Scenarios
```bash
k6 run tests/failure-scenarios.js
```

**Tests:**
- Redis failure (Outbox pattern resilience)
- MongoDB slow queries (Read model optimization)
- Service timeouts (Graceful degradation)

---

## 📋 Verify Key Features

### 1. Idempotency (Prevents Duplicate Charges)
```bash
# Create pledge with same idempotency key twice
IDEM_KEY="test-$(date +%s)"

curl -X POST http://localhost:3000/api/pledges \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDEM_KEY" \
  -d '{"campaignId":"CID","amount":1000,"donorInfo":{"name":"Test","email":"test@test.com"}}'

# Same request - should return cached response, not create duplicate
curl -X POST http://localhost:3000/api/pledges \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDEM_KEY" \
  -d '{"campaignId":"CID","amount":1000,"donorInfo":{"name":"Test","email":"test@test.com"}}'
```

**Verify**: Only one pledge created in database

### 2. Outbox Pattern (Reliable Events)
```bash
# Stop Redis (event bus)
docker-compose stop redis

# Create pledge - should still work
curl -X POST http://localhost:3000/api/pledges \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: outbox-test" \
  -d '{"campaignId":"CID","amount":1000,"donorInfo":{"name":"Test","email":"test@test.com"}}'

# Restart Redis
docker-compose start redis

# Check outbox worker publishes events
docker logs pledge-service | grep "Event published"
```

**Verify**: Pledge created, event queued, published after Redis restart

### 3. State Machine (Prevents Invalid Transitions)
```bash
# View pledge state machine tests
docker exec pledge-service npm test tests/stateMachine.test.js
```

**Verify**: 
- ✅ PENDING → AUTHORIZED allowed
- ❌ CAPTURED → AUTHORIZED blocked

### 4. Read Models (Campaign Totals Optimization)
```bash
# Get campaign with totals (uses read model, not aggregation)
curl http://localhost:3000/api/campaigns/CAMPAIGN_ID
```

**Verify**: `currentAmount` and `totalPledges` returned instantly

### 5. Admin Approval Flow
1. Open frontend: http://localhost:5173/admin
2. Login as admin
3. View pending pledges
4. Click "Approve" on a pledge
5. Check Jaeger for `pledge.authorized` event
6. Verify payment processes automatically

---

## 📊 Monitor Performance

### View Metrics (Grafana)
1. http://localhost:3100 (admin/admin)
2. Select dashboard
3. View:
   - Request rates
   - Response times
   - Error rates
   - Resource usage

### View Logs (Kibana)
1. http://localhost:5601
2. Create index: `careforall-logs-*`
3. Search by:
   - Service name
   - Error level
   - Correlation ID

### Query Metrics (Prometheus)
http://localhost:9090

**Request Rate:**
```promql
rate(http_requests_total[1m])
```

**Error Rate:**
```promql
rate(http_requests_total{status=~"5.."}[1m])
```

---

## 🔧 Troubleshooting

### Services Not Starting
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart services
docker-compose restart
```

### Can't Access UI
```bash
# Check if frontend is running
docker ps | grep frontend

# Check logs
docker logs frontend
```

### Traces Not Appearing
```bash
# Check Jaeger is running
docker ps | grep jaeger

# Check service logs for tracing initialization
docker logs user-service | grep "OpenTelemetry"

# Expected: "OpenTelemetry tracing initialized with Jaeger"
```

### k6 Not Found
```powershell
# Windows
winget install k6 --source winget

# Or download from https://k6.io/docs/getting-started/installation/
```

---

## 📖 Full Documentation

| Document | Purpose |
|----------|---------|
| [README.md](readme.md) | Main project overview |
| [TRACING_GUIDE.md](docs/TRACING_GUIDE.md) | Complete OpenTelemetry guide |
| [STRESS_TESTING_GUIDE.md](docs/STRESS_TESTING_GUIDE.md) | Load testing details |
| [HACKATHON_REQUIREMENTS_CHECKLIST.md](HACKATHON_REQUIREMENTS_CHECKLIST.md) | Requirements compliance |
| [architecture.md](docs/architecture.md) | System architecture |
| [api-contracts.md](docs/api-contracts.md) | API documentation |

---

## ✅ Quick Verification Checklist

- [ ] All services running (`docker-compose ps`)
- [ ] Frontend accessible (http://localhost:5173)
- [ ] API Gateway responding (http://localhost:3000)
- [ ] Jaeger UI accessible (http://localhost:16686)
- [ ] Can create donation via API
- [ ] Trace visible in Jaeger showing full flow
- [ ] k6 installed
- [ ] Stress test runs successfully
- [ ] System handles 1000+ concurrent users
- [ ] Error rate < 5%
- [ ] Idempotency prevents duplicates
- [ ] Redis failure doesn't break system

---

## 🏆 What This Demonstrates

✅ **Event-Driven Architecture**: Traces show async communication  
✅ **Fault Tolerance**: Outbox pattern, state machine, retries  
✅ **Idempotency**: Prevents duplicate charges  
✅ **Scalability**: Handles 1000+ RPS  
✅ **Observability**: Complete OpenTelemetry instrumentation  
✅ **Production-Ready**: Stress tested and validated  

---

**Need Help?**
- Check logs: `docker-compose logs -f [service]`
- View documentation: See links above
- Restart system: `docker-compose restart`

**Time to Demo**: ~5 minutes to show all key features! 🚀
