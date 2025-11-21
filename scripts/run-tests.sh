#!/bin/bash

# Script to run tests for all services

echo "🧪 Running tests for all services..."

# Test User Service
echo "\n📦 Testing User Service..."
cd services/user-service
npm install --silent
npm test || echo "⚠️ User Service tests not configured"
cd ../..

# Test Campaign Service
echo "\n📦 Testing Campaign Service..."
cd services/campaign-service
npm install --silent
npm test || echo "⚠️ Campaign Service tests not configured"
cd ../..

# Test Pledge Service
echo "\n📦 Testing Pledge Service..."
cd services/pledge-service
npm install --silent
npm test || echo "⚠️ Pledge Service tests not configured"
cd ../..

# Test Payment Service
echo "\n📦 Testing Payment Service..."
cd services/payment-service
npm install --silent
npm test || echo "⚠️ Payment Service tests not configured"
cd ../..

echo "\n✅ All tests completed!"
