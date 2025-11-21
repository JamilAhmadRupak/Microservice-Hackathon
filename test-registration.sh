#!/bin/sh
curl -s -X POST http://api-gateway:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"finaltest@example.com","password":"Password123","name":"Final Test User","role":"user"}' \
  | jq
