#!/bin/sh

echo "=== Register New User ==="
curl -v -X POST http://api-gateway:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"quicktest@test.com","password":"Password123","name":"Quick Test"}'

echo -e "\n\n=== Login ==="
curl -v -X POST http://api-gateway:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"password123"}'
