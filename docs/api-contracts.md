# API Contracts

Base URL: `http://localhost:3000/api` (via API Gateway)

All requests return JSON responses with the following structure:
```javascript
{
  success: Boolean,
  data: Object | Array (on success),
  error: String (on failure),
  correlationId: String (for tracing)
}
```

---

## User Service (`/api/users`)

### POST /api/users/register
Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+8801712345678"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8b1f8e4e1a1",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/users/login
User login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8b1f8e4e1a1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /api/users/profile
Get user profile (authenticated)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8b1f8e4e1a1",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+8801712345678",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### GET /api/users/donations
Get user donation history (authenticated)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "pledgeId": "60d5ec49f1b2c8b1f8e4e1a2",
      "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
      "campaignTitle": "Help Baby Aisha's Surgery",
      "amount": 5000,
      "currency": "BDT",
      "state": "COMPLETED",
      "createdAt": "2025-01-20T14:30:00Z"
    }
  ]
}
```

---

## Campaign Service (`/api/campaigns`)

### POST /api/campaigns
Create a new campaign (authenticated)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Help Baby Aisha's Surgery",
  "description": "Baby Aisha needs urgent heart surgery",
  "story": "Full story details...",
  "goalAmount": 500000,
  "currency": "BDT",
  "category": "medical",
  "startDate": "2025-01-20T00:00:00Z",
  "endDate": "2025-03-20T00:00:00Z",
  "beneficiaryName": "Baby Aisha",
  "beneficiaryRelation": "daughter",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
    "title": "Help Baby Aisha's Surgery",
    "status": "draft",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### GET /api/campaigns
Get all active campaigns

**Query Parameters:**
- `category` (optional): Filter by category
- `status` (optional): Filter by status (default: 'active')
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)
- `search` (optional): Search in title/description

**Response (200):**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
        "title": "Help Baby Aisha's Surgery",
        "description": "Baby Aisha needs urgent heart surgery",
        "goalAmount": 500000,
        "currentAmount": 150000,
        "currency": "BDT",
        "organizerName": "John Doe",
        "category": "medical",
        "status": "active",
        "progress": 30,
        "imageUrl": "https://example.com/image.jpg",
        "startDate": "2025-01-20T00:00:00Z",
        "endDate": "2025-03-20T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

### GET /api/campaigns/:id
Get campaign details

**Response (200):**
```json
{
  "success": true,
  "data": {
    "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
    "title": "Help Baby Aisha's Surgery",
    "description": "Baby Aisha needs urgent heart surgery",
    "story": "Full story details...",
    "goalAmount": 500000,
    "currentAmount": 150000,
    "currency": "BDT",
    "organizerId": "60d5ec49f1b2c8b1f8e4e1a1",
    "organizerName": "John Doe",
    "category": "medical",
    "status": "active",
    "progress": 30,
    "totalPledges": 42,
    "beneficiaryName": "Baby Aisha",
    "beneficiaryRelation": "daughter",
    "imageUrl": "https://example.com/image.jpg",
    "startDate": "2025-01-20T00:00:00Z",
    "endDate": "2025-03-20T00:00:00Z",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### PUT /api/campaigns/:id
Update campaign (authenticated, owner only)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:** (same as create, all fields optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
    "message": "Campaign updated successfully"
  }
}
```

---

## Pledge Service (`/api/pledges`)

### POST /api/pledges
Create a new pledge (authenticated or guest)

**Headers (optional for guest):**
```
Authorization: Bearer <token>
X-Idempotency-Key: <unique-key>
```

**Request (Registered User):**
```json
{
  "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
  "amount": 5000,
  "message": "Praying for Baby Aisha",
  "isAnonymous": false
}
```

**Request (Guest User):**
```json
{
  "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
  "amount": 5000,
  "donorInfo": {
    "name": "Anonymous Donor",
    "email": "donor@example.com",
    "phone": "+8801712345678"
  },
  "message": "Praying for Baby Aisha",
  "isAnonymous": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "pledgeId": "60d5ec49f1b2c8b1f8e4e1a4",
    "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
    "amount": 5000,
    "state": "PENDING",
    "paymentIntentId": "pi_1234567890",
    "paymentUrl": "https://payment.example.com/pay/pi_1234567890"
  }
}
```

### GET /api/pledges/:id
Get pledge details

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pledgeId": "60d5ec49f1b2c8b1f8e4e1a4",
    "campaignId": "60d5ec49f1b2c8b1f8e4e1a3",
    "campaignTitle": "Help Baby Aisha's Surgery",
    "amount": 5000,
    "currency": "BDT",
    "state": "COMPLETED",
    "donorInfo": {
      "name": "John Doe",
      "isAnonymous": false
    },
    "message": "Praying for Baby Aisha",
    "createdAt": "2025-01-20T14:30:00Z"
  }
}
```

### GET /api/pledges/campaign/:campaignId
Get pledges for a campaign

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pledges": [
      {
        "pledgeId": "60d5ec49f1b2c8b1f8e4e1a4",
        "amount": 5000,
        "donorName": "John Doe",
        "message": "Praying for Baby Aisha",
        "createdAt": "2025-01-20T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42
    }
  }
}
```

---

## Payment Service (`/api/payments`)

### POST /api/payments/webhook
Payment provider webhook (internal, signature verified)

**Headers:**
```
X-Webhook-Signature: <signature>
```

**Request:**
```json
{
  "eventType": "payment.captured",
  "paymentIntentId": "pi_1234567890",
  "amount": 5000,
  "status": "captured",
  "timestamp": "2025-01-20T14:35:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "received": true
  }
}
```

### GET /api/payments/transaction/:pledgeId
Get transaction details for a pledge

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionId": "60d5ec49f1b2c8b1f8e4e1a5",
    "pledgeId": "60d5ec49f1b2c8b1f8e4e1a4",
    "amount": 5000,
    "status": "captured",
    "paymentIntentId": "pi_1234567890",
    "createdAt": "2025-01-20T14:30:00Z",
    "capturedAt": "2025-01-20T14:35:00Z"
  }
}
```

---

## Admin Service (`/api/admin`)

### GET /api/admin/campaigns
Get all campaigns (admin only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `status` (optional): Filter by status
- `page`, `limit`: Pagination

**Response (200):**
```json
{
  "success": true,
  "data": {
    "campaigns": [...],
    "pagination": {...}
  }
}
```

### PUT /api/admin/campaigns/:id/verify
Verify/approve a campaign (admin only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request:**
```json
{
  "isVerified": true,
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Campaign verified successfully"
  }
}
```

### GET /api/admin/transactions
Get all transactions (admin only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transactionId": "60d5ec49f1b2c8b1f8e4e1a5",
        "pledgeId": "60d5ec49f1b2c8b1f8e4e1a4",
        "campaignTitle": "Help Baby Aisha's Surgery",
        "amount": 5000,
        "status": "captured",
        "createdAt": "2025-01-20T14:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### GET /api/admin/dashboard
Get dashboard statistics (admin only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 156,
    "activeCampaigns": 89,
    "totalPledges": 3421,
    "totalAmount": 12500000,
    "todayPledges": 47,
    "todayAmount": 185000
  }
}
```

---

## Error Responses

All errors follow this format:

**4xx/5xx Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "correlationId": "trace-id-for-debugging"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Missing or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_REQUEST`: Idempotency key already used
- `PAYMENT_FAILED`: Payment processing failed
- `INTERNAL_ERROR`: Server error

---

## Headers

### Required for Authenticated Requests
```
Authorization: Bearer <jwt-token>
```

### Required for Idempotent Operations
```
X-Idempotency-Key: <unique-uuid>
```

### Tracing (automatically added by gateway)
```
X-Correlation-Id: <trace-id>
```

---

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user
- **Admin**: No limit

Headers on rate limit:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642684800
```
