#!/bin/bash

echo "================================================"
echo "CareForAll Platform - Setup & Test Script"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Docker
echo -e "${YELLOW}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker found${NC}"

# Check Docker Compose
echo -e "${YELLOW}Checking Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose found${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down
echo ""

# Build services
echo -e "${YELLOW}Building services (this may take a few minutes)...${NC}"
docker-compose build --parallel
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Start services
echo -e "${YELLOW}Starting all services...${NC}"
docker-compose up -d
echo ""

# Wait for services
echo -e "${YELLOW}Waiting for services to be healthy (30 seconds)...${NC}"
sleep 30

# Check service health
echo ""
echo "================================================"
echo "Service Health Check"
echo "================================================"

services=("api-gateway" "user-service" "campaign-service" "pledge-service" "payment-service" "notification-service" "admin-service")

for service in "${services[@]}"; do
    if docker ps | grep -q "$service"; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
    fi
done

echo ""

# Test API Gateway
echo "================================================"
echo "Testing API Gateway"
echo "================================================"

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ API Gateway responding (HTTP $response)${NC}"
else
    echo -e "${RED}❌ API Gateway not responding (HTTP $response)${NC}"
fi

echo ""

# Show access URLs
echo "================================================"
echo "🎉 Platform Ready!"
echo "================================================"
echo ""
echo -e "${GREEN}Frontend:${NC}      http://localhost:5173"
echo -e "${GREEN}API Gateway:${NC}   http://localhost:3000"
echo -e "${GREEN}Grafana:${NC}       http://localhost:3100 (admin/admin)"
echo -e "${GREEN}Prometheus:${NC}    http://localhost:9090"
echo -e "${GREEN}Jaeger:${NC}        http://localhost:16686"
echo -e "${GREEN}Kibana:${NC}        http://localhost:5601"
echo ""
echo "================================================"
echo "Next Steps"
echo "================================================"
echo ""
echo "1. Test the platform:"
echo "   ./quick-test.sh"
echo ""
echo "2. Run stress tests (requires k6):"
echo "   k6 run tests/stress-test.js"
echo ""
echo "3. View traces in Jaeger:"
echo "   Open http://localhost:16686"
echo ""
echo "4. View logs:"
echo "   docker-compose logs -f [service-name]"
echo ""
echo "5. Stop all services:"
echo "   docker-compose down"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
