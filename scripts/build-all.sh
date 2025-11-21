#!/bin/bash

# Script to build all Docker images

echo "🐳 Building all Docker images..."

services=("user-service" "campaign-service" "pledge-service" "payment-service" "notification-service" "admin-service" "api-gateway")

for service in "${services[@]}"
do
    echo "\n📦 Building $service..."
    docker build -t careforall-$service:latest -f services/$service/Dockerfile .
done

echo "\n✅ All images built successfully!"
echo "Run 'docker images | grep careforall' to see built images"
