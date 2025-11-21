# Quick Setup Guide - CareForAll Platform

## 🚀 5-Minute Setup

### Prerequisites Check
```powershell
# Check Docker
docker --version

# Check Docker Compose
docker-compose --version

# Check Git
git --version
```

### Step 1: Clone Repository
```powershell
git clone https://github.com/JamilAhmadRupak/Microservice-Hackathon.git
cd "Microservice Hackathon"
```

### Step 2: Start All Services
```powershell
docker-compose up -d
```

This single command will start:
- 7 microservices
- MongoDB database
- Redis event bus
- Prometheus (metrics)
- Grafana (dashboards)
- Jaeger (tracing)
- ELK Stack (logging)

### Step 3: Verify Services
```powershell
# Check all containers are running
docker-compose ps

# You should see 17 containers running
```

### Step 4: Test the Platform

#### Access Points:
- 🌐 **API Gateway**: http://localhost:3000
- 📊 **Grafana**: http://localhost:3100 (admin/admin)
- 📈 **Prometheus**: http://localhost:9090
- 🔍 **Jaeger**: http://localhost:16686
- 📋 **Kibana**: http://localhost:5601

#### Quick API Test:
```powershell
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/users/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test123","name":"Test User"}'
```

### Step 5: View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f pledge-service
```

## 🧪 Testing

### Run Tests
```powershell
# Test user service
cd services\user-service
npm install
npm test
cd ..\..

# Test pledge state machine
cd services\pledge-service
npm install
npm test
cd ..\..
```

## 📊 Observability

### 1. Grafana Dashboards
1. Open http://localhost:3100
2. Login: admin/admin
3. View service metrics

### 2. Jaeger Tracing
1. Open http://localhost:16686
2. Select service: api-gateway
3. Click "Find Traces"
4. View end-to-end request flow

### 3. Kibana Logs
1. Open http://localhost:5601
2. Create index pattern: `careforall-logs-*`
3. View logs from all services

## 🔧 Scaling Services

```powershell
# Scale campaign service to 3 replicas
docker-compose up -d --scale campaign-service=3

# Verify
docker-compose ps | Select-String campaign-service
```

## 🛠️ Troubleshooting

### Services Not Starting
```powershell
# Remove all containers and volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

### Port Already in Use
```powershell
# Stop conflicting services
# Or edit docker-compose.yml to change ports
```

### Check Service Health
```powershell
# Individual service logs
docker-compose logs user-service

# MongoDB connection
docker-compose exec mongodb mongosh --eval "db.runCommand({ ping: 1 })"

# Redis connection
docker-compose exec redis redis-cli ping
```

### Memory Issues
```powershell
# Reduce Elasticsearch memory
# Edit docker-compose.yml:
# ES_JAVA_OPTS=-Xms256m -Xmx256m
```

## 🎯 Demo Workflow

### Complete Donation Flow:

1. **Register User**
```powershell
curl -X POST http://localhost:3000/api/users/register `
  -H "Content-Type: application/json" `
  -d '{"email":"donor@example.com","password":"Pass123","name":"John Doe"}'
```

2. **Save the token** from response

3. **Create Campaign**
```powershell
curl -X POST http://localhost:3000/api/campaigns `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{
    "title":"Help Baby Aisha",
    "description":"Medical campaign",
    "goalAmount":500000,
    "category":"medical",
    "startDate":"2025-01-20",
    "endDate":"2025-03-20",
    "beneficiaryName":"Baby Aisha"
  }'
```

4. **Save the campaignId** from response

5. **Create Pledge (Donation)**
```powershell
curl -X POST http://localhost:3000/api/pledges `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "X-Idempotency-Key: unique-key-123" `
  -d '{
    "campaignId":"YOUR_CAMPAIGN_ID",
    "amount":5000,
    "message":"Best wishes!"
  }'
```

6. **Watch the magic happen:**
   - Pledge created (Pledge Service)
   - Payment processed automatically (Payment Service)
   - Campaign totals updated (Campaign Service)
   - Notification sent (Notification Service)

7. **View in Observability Tools:**
   - Grafana: See metrics spike
   - Jaeger: Trace request across services
   - Kibana: View logs from all services

## 🎓 Development Mode

### Run Services Locally (Without Docker)

1. **Install MongoDB & Redis locally** or keep them in Docker:
```powershell
docker-compose up -d mongodb redis
```

2. **Install dependencies**:
```powershell
cd shared
npm install

cd ..\services\user-service
npm install
cd ..\..

# Repeat for other services
```

3. **Start services**:
```powershell
# Terminal 1 - User Service
cd services\user-service
npm run dev

# Terminal 2 - Campaign Service
cd services\campaign-service
npm run dev

# Terminal 3 - Pledge Service
cd services\pledge-service
npm run dev

# ... and so on
```

## 📚 Additional Resources

- **Architecture**: See `docs/architecture.md`
- **API Docs**: See `docs/api-contracts.md`
- **Data Models**: See `docs/data-models.md`
- **Complete Summary**: See `COMPLETE_SUMMARY.md`

## ❓ Common Questions

**Q: How do I add my MongoDB Atlas connection?**
```powershell
# Edit docker-compose.yml
# Replace: mongodb://mongodb:27017/careforall
# With: your-atlas-connection-string
```

**Q: How do I stop everything?**
```powershell
docker-compose down
```

**Q: How do I remove all data?**
```powershell
docker-compose down -v
```

**Q: How do I rebuild after code changes?**
```powershell
docker-compose up -d --build
```

## 🎉 You're Ready!

The platform is now running and ready for:
- ✅ API testing
- ✅ Load testing
- ✅ Observability demo
- ✅ CI/CD demo
- ✅ Presentation

**Need help?** Check the main README.md or COMPLETE_SUMMARY.md

---

**Built by Api Avengers for Microservice Hackathon 2025** 🚀
