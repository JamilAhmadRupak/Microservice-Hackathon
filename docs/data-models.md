# Data Models

## User Service

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  phone: String (optional),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isEmailVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- email (unique)
- createdAt
```

### Guest Donor (embedded in pledge)
```javascript
{
  email: String (required),
  name: String (required),
  phone: String (optional)
}
```

## Campaign Service

### Campaign Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  story: String (optional),
  goalAmount: Number (required, min: 1),
  currentAmount: Number (default: 0),
  currency: String (default: 'BDT'),
  organizerId: ObjectId (ref: User, required),
  organizerName: String (required),
  category: String (enum: ['medical', 'education', 'disaster', 'other']),
  status: String (enum: ['draft', 'active', 'paused', 'completed', 'cancelled'], default: 'draft'),
  startDate: Date (required),
  endDate: Date (required),
  imageUrl: String (optional),
  beneficiaryName: String (required),
  beneficiaryRelation: String (optional),
  documents: [String] (optional - URLs to supporting documents),
  isVerified: Boolean (default: false),
  verifiedBy: ObjectId (ref: User, optional),
  verifiedAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- status
- category
- organizerId
- startDate, endDate
- createdAt
```

### Campaign Totals (Read Model)
```javascript
{
  _id: ObjectId,
  campaignId: ObjectId (unique, ref: Campaign),
  totalAmount: Number (default: 0),
  totalPledges: Number (default: 0),
  lastUpdated: Date
}

// Indexes
- campaignId (unique)
```

## Pledge Service

### Pledge Collection
```javascript
{
  _id: ObjectId,
  idempotencyKey: String (unique, required),
  campaignId: ObjectId (ref: Campaign, required),
  campaignTitle: String (denormalized),
  donorUserId: ObjectId (ref: User, optional - null for guest),
  donorInfo: {
    name: String (required),
    email: String (required),
    phone: String (optional),
    isAnonymous: Boolean (default: false)
  },
  amount: Number (required, min: 1),
  currency: String (default: 'BDT'),
  state: String (enum: ['PENDING', 'AUTHORIZED', 'CAPTURED', 'COMPLETED', 'FAILED', 'REFUNDED'], default: 'PENDING'),
  paymentIntentId: String (optional),
  message: String (optional - message to beneficiary),
  metadata: Object (optional),
  createdAt: Date,
  updatedAt: Date,
  stateHistory: [{
    state: String,
    timestamp: Date,
    metadata: Object
  }]
}

// Indexes
- idempotencyKey (unique)
- campaignId
- donorUserId
- state
- createdAt
```

### Outbox Collection
```javascript
{
  _id: ObjectId,
  eventType: String (required, e.g., 'pledge.created', 'pledge.completed'),
  aggregateId: ObjectId (required, ref: Pledge),
  payload: Object (required - event data),
  status: String (enum: ['pending', 'published', 'failed'], default: 'pending'),
  retryCount: Number (default: 0),
  maxRetries: Number (default: 5),
  createdAt: Date,
  publishedAt: Date (optional),
  error: String (optional)
}

// Indexes
- status, createdAt (compound for processing order)
- aggregateId
```

## Payment Service

### Transaction Collection
```javascript
{
  _id: ObjectId,
  idempotencyKey: String (unique, required),
  pledgeId: ObjectId (ref: Pledge, required),
  campaignId: ObjectId (ref: Campaign, required),
  amount: Number (required),
  currency: String (default: 'BDT'),
  status: String (enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'], default: 'pending'),
  paymentMethod: String (optional, e.g., 'card', 'bkash', 'nagad'),
  paymentProvider: String (default: 'mock'),
  paymentIntentId: String (unique, required),
  providerTransactionId: String (optional),
  providerResponse: Object (optional),
  webhookReceived: Boolean (default: false),
  webhookData: Object (optional),
  failureReason: String (optional),
  createdAt: Date,
  updatedAt: Date,
  capturedAt: Date (optional),
  refundedAt: Date (optional)
}

// Indexes
- idempotencyKey (unique)
- paymentIntentId (unique)
- pledgeId
- status
- createdAt
```

## Notification Service

### Notification Collection
```javascript
{
  _id: ObjectId,
  recipientId: ObjectId (ref: User, optional),
  recipientEmail: String (required),
  type: String (enum: ['email', 'sms', 'push'], default: 'email'),
  category: String (enum: ['pledge_confirmation', 'payment_success', 'campaign_update', 'admin_alert']),
  subject: String (required),
  body: String (required),
  status: String (enum: ['pending', 'sent', 'failed'], default: 'pending'),
  sentAt: Date (optional),
  failureReason: String (optional),
  metadata: Object (optional),
  createdAt: Date
}

// Indexes
- recipientId
- status
- createdAt
```

## Common Patterns

### Timestamps
All collections include:
```javascript
{
  createdAt: Date,
  updatedAt: Date
}
```

### Soft Delete (if needed)
```javascript
{
  isDeleted: Boolean (default: false),
  deletedAt: Date (optional)
}
```

### Idempotency
Critical operations use:
```javascript
{
  idempotencyKey: String (unique, required)
}
```

## Data Relationships

### Denormalization Strategy
- Store `campaignTitle` in Pledge (avoid joins)
- Store `organizerName` in Campaign (avoid joins)
- Store `donorInfo` in Pledge (support guest donors)

### Eventual Consistency
- Campaign totals updated via events
- Notification triggers asynchronous
- Outbox ensures reliable event delivery

## Database Configuration

### MongoDB Atlas Connection
```javascript
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/careforall';
```

### Connection Options
```javascript
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
}
```

## Data Validation

### Mongoose Schema Validation
- Required fields enforced at schema level
- Enum values validated
- Custom validators for email, phone
- Min/max constraints on amounts

### Application-Level Validation
- Input sanitization
- Business rule validation
- Idempotency key format validation
- State transition validation
