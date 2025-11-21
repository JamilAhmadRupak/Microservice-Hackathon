#!/bin/bash

# CareForAll API Testing Script
# Run this inside the Docker network to test all endpoints

echo "==================================="
echo "CareForAll API Testing Suite"
echo "==================================="
echo ""

API_GATEWAY="http://api-gateway:3000"

# Test 1: API Gateway Health
echo "1. Testing API Gateway Health..."
curl -s "$API_GATEWAY/health" | jq .
echo ""

# Test 2: User Registration
echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"donor1@careforall.com","password":"SecurePass123","name":"John Donor"}' \
  --max-time 30)
echo "$REGISTER_RESPONSE" | jq .
USER_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token // .token // empty')
echo "User Token: $USER_TOKEN"
echo ""

# Test 3: User Login
echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"donor1@careforall.com","password":"SecurePass123"}' \
  --max-time 30)
echo "$LOGIN_RESPONSE" | jq .
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .token // empty')
echo "Login Token: $LOGIN_TOKEN"
echo ""

# Use login token for subsequent requests
if [ -n "$LOGIN_TOKEN" ]; then
  TOKEN="$LOGIN_TOKEN"
else
  TOKEN="$USER_TOKEN"
fi

# Test 4: Get User Profile
echo "4. Testing Get User Profile..."
curl -s -X GET "$API_GATEWAY/api/users/profile" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test 5: Create Campaign
echo "5. Testing Create Campaign..."
CAMPAIGN_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Help Build School in Rural Area","description":"We are raising funds to build a school for underprivileged children","goal":50000,"category":"education","endDate":"2025-12-31","images":["https://example.com/school.jpg"]}' \
  --max-time 30)
echo "$CAMPAIGN_RESPONSE" | jq .
CAMPAIGN_ID=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.data._id // .data.id // empty')
echo "Campaign ID: $CAMPAIGN_ID"
echo ""

# Test 6: Get All Campaigns
echo "6. Testing Get All Campaigns..."
curl -s -X GET "$API_GATEWAY/api/campaigns" | jq .
echo ""

# Test 7: Get Campaign by ID
if [ -n "$CAMPAIGN_ID" ]; then
  echo "7. Testing Get Campaign by ID..."
  curl -s -X GET "$API_GATEWAY/api/campaigns/$CAMPAIGN_ID" | jq .
  echo ""
fi

# Test 8: Create Pledge
if [ -n "$CAMPAIGN_ID" ]; then
  echo "8. Testing Create Pledge..."
  PLEDGE_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/pledges" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"campaignId\":\"$CAMPAIGN_ID\",\"amount\":1000,\"isAnonymous\":false}" \
    --max-time 30)
  echo "$PLEDGE_RESPONSE" | jq .
  PLEDGE_ID=$(echo "$PLEDGE_RESPONSE" | jq -r '.data._id // .data.id // empty')
  echo "Pledge ID: $PLEDGE_ID"
  echo ""
fi

# Test 9: Get User's Pledges
echo "9. Testing Get User Pledges..."
curl -s -X GET "$API_GATEWAY/api/pledges/my-pledges" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Test 10: Process Payment
if [ -n "$PLEDGE_ID" ]; then
  echo "10. Testing Process Payment..."
  PAYMENT_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/payments/process" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"pledgeId\":\"$PLEDGE_ID\",\"paymentMethod\":\"card\",\"paymentDetails\":{\"cardNumber\":\"4111111111111111\",\"expiryMonth\":\"12\",\"expiryYear\":\"2026\",\"cvv\":\"123\"}}" \
    --max-time 30)
  echo "$PAYMENT_RESPONSE" | jq .
  PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | jq -r '.data._id // .data.id // empty')
  echo "Payment ID: $PAYMENT_ID"
  echo ""
fi

# Test 11: Get Payment Status
if [ -n "$PAYMENT_ID" ]; then
  echo "11. Testing Get Payment Status..."
  curl -s -X GET "$API_GATEWAY/api/payments/$PAYMENT_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

# Test 12: Admin Login
echo "12. Testing Admin Registration..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@careforall.com","password":"AdminPass123","name":"Admin User","role":"admin"}' \
  --max-time 30)
echo "$ADMIN_RESPONSE" | jq .
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.data.token // .token // empty')
echo ""

# Test 13: Admin Stats
if [ -n "$ADMIN_TOKEN" ]; then
  echo "13. Testing Admin Dashboard Stats..."
  curl -s -X GET "$API_GATEWAY/api/admin/dashboard/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
  echo ""
fi

echo "==================================="
echo "Testing Complete!"
echo "==================================="
