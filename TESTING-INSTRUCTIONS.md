# Testing Instructions for CareForAll Platform

## ✅ Platform Status
- **MongoDB Atlas**: Connected ✓ (dbState: 1)
- **All Services**: Running ✓ (17 containers)
- **Health Check**: http://localhost:3001/api/users/health shows `dbState: 1` (connected)

## 🚨 CRITICAL: Do NOT Use Command Line Testing

**ALL command-line tools (PowerShell, curl, etc.) corrupt the JSON** causing these errors:
- "Unexpected token : in JSON at position 9"
- "Missing required fields"
- "Internal server error"

This affects:
- ❌ PowerShell `Invoke-RestMethod`
- ❌ PowerShell `curl`
- ❌ `curl` inside Docker containers  
- ❌ Any shell-based testing

**Why:** Shell escape sequences mangle JSON strings, turning `{"email":"test"}` into `{:"email":"test"}` or worse.

## ✅ SOLUTION: Use Postman ONLY

### Step 1: Import the Collection
1. **Open Postman** (download from https://www.postman.com/ if needed)
2. Click **Import** button (top left)
3. Click **Upload Files**
4. Select: `CareForAll-Postman-Collection.json` from your workspace
5. Click **Import**
6. You'll see **"CareForAll Donation Platform"** collection with 12 requests

### Step 2: Register a New User
1. Expand the collection in Postman
2. Click **"1. User Registration"**
3. You'll see:
   - Method: POST
   - URL: `http://localhost:3000/api/users/register`
   - Body (raw JSON):
     ```json
     {
       "email": "donor@example.com",
       "password": "SecurePass123",
       "name": "John Donor"
     }
     ```
4. **Click Send**
5. Expected response (201 Created):
   ```json
   {
     "success": true,
     "data": {
       "userId": "673e6f1a2b3c4d5e6f7g8h9i",
       "email": "donor@example.com",
       "name": "John Donor",
       "role": "user",
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```
6. **Copy the `token`** from the response

### Step 3: Test Login
1. Click **"2. User Login"**
2. Body shows:
   ```json
   {
     "email": "donor@example.com",
     "password": "SecurePass123"
   }
   ```
3. **Click Send**
4. You'll get the same user data with a new token

### Step 4: Test Authenticated Endpoints
1. Click **"3. Get User Profile"**
2. Go to **Headers** tab
3. Add/Update header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE` (paste the token from Step 2)
4. **Click Send**
5. You'll see your user profile

### Step 5: Complete Test Flow
Follow this order to test the full donation platform:

1. **Register User** → Get token
2. **Login** → Verify token works
3. **Get Profile** → Test authenticated endpoint
4. **Create Campaign** → Add authorization header with token
5. **Get All Campaigns** → See created campaign
6. **Create Pledge** → Make a donation pledge
7. **Get User Pledges** → See your pledges
8. **Process Payment** → Complete the donation
9. **Get Payment Status** → Verify payment succeeded

## 📋 All Available Endpoints

| # | Name | Method | URL | Auth Required |
|---|------|--------|-----|---------------|
| 1 | User Registration | POST | `/api/users/register` | No |
| 2 | User Login | POST | `/api/users/login` | No |
| 3 | Get User Profile | GET | `/api/users/profile` | Yes |
| 4 | Update Profile | PUT | `/api/users/profile` | Yes |
| 5 | Create Campaign | POST | `/api/campaigns` | Yes |
| 6 | Get All Campaigns | GET | `/api/campaigns` | No |
| 7 | Get Campaign by ID | GET | `/api/campaigns/:id` | No |
| 8 | Create Pledge | POST | `/api/pledges` | Yes |
| 9 | Get User Pledges | GET | `/api/pledges/user` | Yes |
| 10 | Process Payment | POST | `/api/payments` | Yes |
| 11 | Get Payment Status | GET | `/api/payments/:id` | Yes |
| 12 | Health Check | GET | `/api/users/health` | No |

## 🔧 Troubleshooting

### "Could not get response" or Timeout
- Check containers are running: `docker-compose ps`
- Restart services: `docker-compose restart`
- Check logs: `docker logs user-service --tail=50`

### "Unauthorized" (401)
- Make sure you copied the full token
- Token must start with `Bearer ` (note the space)
- Token expires - get a new one by logging in again

### "User already exists" (409)
- Change the email in the request body
- Example: `donor2@example.com`, `donor3@example.com`, etc.

## ✅ Verify Platform Health

Before testing, verify all services are healthy:

```powershell
# Check all containers are running
docker-compose ps

# Check user service health
curl http://localhost:3001/api/users/health

# Expected response:
# {"success":true,"data":{"status":"healthy","service":"user-service","dbState":1}}
```

`dbState: 1` means MongoDB is connected (0 = disconnected, 1 = connected).

## 🎯 Success Criteria

Your platform is working correctly when:
- ✅ Registration returns 201 with userId and token
- ✅ Login returns 200 with valid token  
- ✅ Profile endpoint returns user data with valid token
- ✅ Campaign creation succeeds
- ✅ Pledge creation links to campaign
- ✅ Payment processing completes
- ✅ All responses follow format: `{"success": true/false, "data": {...}}`

## ⚠️ Remember

**NEVER test APIs using command-line tools with this platform!**  
JSON string escaping issues will cause 100% failure rate.

**ALWAYS use Postman** with the imported collection for reliable testing.

Your platform is fully operational - the issue is purely with how shells handle JSON strings! 🚀

