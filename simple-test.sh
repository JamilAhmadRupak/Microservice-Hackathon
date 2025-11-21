#!/bin/sh

echo "Testing User Registration..."

curl -v -X POST http://user-service:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"password123","name":"New User"}' \
  --max-time 30

echo ""
echo "Done"
