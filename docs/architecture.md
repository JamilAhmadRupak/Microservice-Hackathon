# CareForAll Platform - System Architecture

## Overview
CareForAll is a robust, fault-tolerant microservices-based donation platform designed to handle high traffic (1000+ RPS) with proper event-driven architecture, idempotency, and observability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                              │
│                    (Rate Limiting, Routing)                      │
│                    Load Balancer (nginx)                         │
└──────┬──────────┬────────────┬─────────┬────────────┬──────────┘
       │          │            │         │            │
       ▼          ▼            ▼         ▼            ▼
   ┌──────┐  ┌──────────┐  ┌───────┐  ┌────────┐  ┌────────┐
   │ User │  │ Campaign │  │Pledge │  │Payment │  │ Admin  │
   │Service│ │ Service  │  │Service│  │Gateway │  │Service │
   └───┬──┘  └────┬─────┘  └───┬───┘  └───┬────┘  └───┬────┘
       │          │            │          │           │
       └──────────┴────────────┴──────────┴───────────┘
                            │
                    ┌───────┴────────┐
                    │  Event Bus     │
                    │  (Redis Pub/Sub│
                    │   + Outbox)    │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Notification  │
                    │    Service     │
                    └────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  MongoDB     │  MongoDB     │  MongoDB     │    Redis           │
│  (Users)     │  (Campaigns) │  (Pledges)   │  (Cache, Sessions) │
└──────────────┴──────────────┴──────────────┴────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    Observability Stack                           │
├─────────────┬──────────────┬──────────────┬────────────────────┤
│ Prometheus  │   Grafana    │   Jaeger     │    ELK Stack       │
│ (Metrics)   │ (Dashboard)  │  (Tracing)   │  (Logs)            │
└─────────────┴──────────────┴──────────────┴────────────────────┘
```

## Core Services

### 1. API Gateway
- **Responsibility**: Single entry point, routing, rate limiting, authentication middleware
- **Port**: 3000
- **Technology**: Express.js, nginx for load balancing
- **Features**:
  - Request routing to appropriate services
  - JWT validation
  - Rate limiting (prevent abuse)
  - Request logging and tracing
  - CORS handling

### 2. User Service
- **Responsibility**: User authentication, registration, profile management
- **Port**: 3001
- **Database**: MongoDB (users collection)
- **Features**:
  - User registration (email/password)
  - Login with JWT generation
  - Password hashing (bcryptjs)
  - Profile management
  - Support for both registered and guest donors
  - Donation history per user

### 3. Campaign Service
- **Responsibility**: Campaign CRUD operations, campaign discovery
- **Port**: 3002
- **Database**: MongoDB (campaigns collection, campaign_totals read model)
- **Features**:
  - Create, read, update, delete campaigns
  - Campaign search and filtering
  - Campaign totals (read model updated by events)
  - Goal tracking
  - Campaign status management
  - **Read Model**: Separate collection for campaign totals (optimized queries)

### 4. Pledge Service
- **Responsibility**: Pledge creation, event publishing, idempotency
- **Port**: 3003
- **Database**: MongoDB (pledges collection, outbox collection)
- **Features**:
  - Create pledges with idempotency keys
  - **Outbox Pattern**: Reliable event publishing
  - State machine for pledge states (PENDING → AUTHORIZED → CAPTURED → COMPLETED)
  - Prevent backward state transitions
  - Event publishing for payment and notification services
  - Donation history tracking

### 5. Payment Gateway Service
- **Responsibility**: Payment processing, webhook handling, idempotency
- **Port**: 3004
- **Database**: MongoDB (transactions collection)
- **Features**:
  - Idempotent payment processing
  - Webhook handling with signature verification
  - Prevent duplicate charges
  - Retry mechanism with exponential backoff
  - Payment state management
  - Mock payment provider integration

### 6. Notification Service
- **Responsibility**: Send notifications to users and admins
- **Port**: 3005
- **Database**: MongoDB (notifications collection)
- **Features**:
  - Email notifications (stub/mock)
  - SMS notifications (stub/mock)
  - Event-driven notifications
  - Notification history
  - Admin alerts for critical events

### 7. Admin Service
- **Responsibility**: Admin panel operations, monitoring
- **Port**: 3006
- **Database**: MongoDB (shared access to all collections)
- **Features**:
  - Campaign management (approve, reject, feature)
  - User management
  - Transaction monitoring
  - System health dashboard
  - Reports and analytics

## Key Architectural Decisions

### 1. Idempotency
- All critical operations use idempotency keys
- Duplicate requests return cached responses
- Prevent double charges and duplicate records

### 2. Outbox Pattern
- Reliable event publishing from Pledge Service
- Events stored in outbox collection before publishing
- Background worker publishes events to Redis
- Ensures at-least-once delivery

### 3. State Machine
- Pledge states strictly enforced
- Prevent backward transitions (CAPTURED → AUTHORIZED)
- Validate state transitions before updates

### 4. Read Models
- Campaign totals stored separately
- Updated via events (eventual consistency)
- Prevents expensive aggregations on read

### 5. Event-Driven Architecture
- Services communicate via events (Redis Pub/Sub)
- Loose coupling between services
- Scalable and resilient

### 6. Observability
- OpenTelemetry for distributed tracing
- Prometheus for metrics collection
- ELK stack for centralized logging
- Grafana for visualization

## Scalability Strategy

### Horizontal Scaling
- All services are stateless (can scale horizontally)
- Docker Compose replica scaling: `docker-compose up --scale pledge-service=3`
- API Gateway uses nginx for load balancing
- Redis for shared session and cache

### Performance Optimizations
- Read models for expensive queries
- Database indexing on frequently queried fields
- Caching with Redis (campaign details, user sessions)
- Connection pooling for MongoDB

### Traffic Handling (1000+ RPS)
- Rate limiting at API Gateway
- Circuit breaker pattern for service failures
- Request queuing with Redis
- Asynchronous event processing

## Fault Tolerance

### Retry Mechanisms
- Payment webhook retries with exponential backoff
- Event publishing retries
- HTTP client retries with circuit breaker

### Error Handling
- Graceful degradation
- Proper error responses with correlation IDs
- Dead letter queues for failed events

### Data Consistency
- Outbox pattern ensures eventual consistency
- Idempotency prevents duplicate data
- State machine prevents invalid state transitions

## Security

- JWT-based authentication
- Password hashing with bcryptjs
- Environment-based secrets
- CORS configuration
- Input validation and sanitization
- Rate limiting to prevent abuse

## Technology Stack

- **Runtime**: Node.js (Express.js with CommonJS)
- **Database**: MongoDB Atlas
- **Cache/Queue**: Redis
- **Tracing**: OpenTelemetry + Jaeger
- **Metrics**: Prometheus + Grafana
- **Logging**: Elasticsearch + Logstash + Kibana
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
