# CareForAll Platform - Setup & Test Script
# Run this script to set up and start all services

$ErrorActionPreference = "Stop"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "CareForAll Platform - Setup & Test Script" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Check Docker
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker found" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check Docker Compose
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose found`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

# Build services
Write-Host "`nBuilding services (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose build --parallel
Write-Host "✅ Build complete`n" -ForegroundColor Green

# Start services
Write-Host "Starting all services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services
Write-Host "`nWaiting for services to be healthy (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Service Health Check" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$services = @("api-gateway", "user-service", "campaign-service", "pledge-service", 
              "payment-service", "notification-service", "admin-service")

foreach ($service in $services) {
    $running = docker ps --filter "name=$service" --format "{{.Names}}"
    if ($running) {
        Write-Host "✅ $service is running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service is not running" -ForegroundColor Red
    }
}

# Test API Gateway
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Testing API Gateway" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API Gateway responding (HTTP $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API Gateway not responding" -ForegroundColor Red
}

# Show access URLs
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "🎉 Platform Ready!" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "Frontend:      " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host "API Gateway:   " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "Grafana:       " -NoNewline; Write-Host "http://localhost:3100 (admin/admin)" -ForegroundColor Green
Write-Host "Prometheus:    " -NoNewline; Write-Host "http://localhost:9090" -ForegroundColor Green
Write-Host "Jaeger:        " -NoNewline; Write-Host "http://localhost:16686" -ForegroundColor Green
Write-Host "Kibana:        " -NoNewline; Write-Host "http://localhost:5601" -ForegroundColor Green

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "1. Test the platform:"
Write-Host "   .\quick-test.sh"
Write-Host ""
Write-Host "2. Run stress tests (requires k6):"
Write-Host "   k6 run tests\stress-test.js"
Write-Host ""
Write-Host "3. View traces in Jaeger:"
Write-Host "   Open http://localhost:16686"
Write-Host ""
Write-Host "4. View logs:"
Write-Host "   docker-compose logs -f [service-name]"
Write-Host ""
Write-Host "5. Stop all services:"
Write-Host "   docker-compose down"
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
