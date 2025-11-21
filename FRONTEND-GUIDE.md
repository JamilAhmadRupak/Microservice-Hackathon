# Frontend Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Development Mode (Instant Preview)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### 2. Production Build

```bash
cd frontend
npm run build
npm run preview
```

### 3. Docker Deployment

#### Option A: Build and Run Standalone
```bash
docker build -t careforall-frontend ./frontend
docker run -p 5173:80 careforall-frontend
```

#### Option B: With Docker Compose (Recommended)
```bash
# From project root
docker-compose up -d frontend
```

Access at http://localhost:5173

---

## 📱 User Guide

### For Donors

1. **Register/Login**
   - Go to http://localhost:5173/register
   - Create account with email, name, password
   - Auto-login after registration

2. **Browse Campaigns**
   - Visit /campaigns
   - Filter by category or search
   - Click campaign to view details

3. **Make a Donation**
   - Click "Donate Now" on campaign page
   - Enter amount and optional message
   - Payment processes automatically
   - Check status in /profile

### For Campaign Organizers

1. **Create Campaign**
   - Login required
   - Go to /campaigns/create
   - Fill all required fields:
     - Title, description, story
     - Goal amount (in BDT)
     - Category (medical, education, disaster, other)
     - Start and end dates
     - Beneficiary information
   - Submit for approval

2. **Track Progress**
   - View campaign details page
   - Monitor donations and progress
   - See donor messages

### For Admins

1. **Access Admin Panel**
   - Login with admin account
   - Go to /admin

2. **Approve Campaigns**
   - Review pending campaigns
   - Click "Approve" or "Reject"
   - Approved campaigns become active

3. **Monitor Transactions**
   - Switch to "Recent Transactions" tab
   - View all payment statuses
   - Track platform statistics

---

## 🔑 Test Accounts

### Regular User
```
Email: donor@example.com
Password: SecurePass123
```

### Admin User
```
Email: admin@careforall.com
Password: AdminPass123
```

**Note:** Create these accounts via API or database if not exists.

---

## 🎨 Features

✅ **Responsive Design** - Works on mobile, tablet, desktop  
✅ **Real-time Updates** - Instant donation tracking  
✅ **Secure Authentication** - JWT-based auth  
✅ **Toast Notifications** - User-friendly feedback  
✅ **Protected Routes** - Role-based access control  
✅ **Search & Filter** - Easy campaign discovery  
✅ **Payment Integration** - Seamless donation flow  

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in frontend directory:

```env
VITE_API_URL=http://localhost:3000
```

### For Production

```env
VITE_API_URL=https://api.careforall.com
```

---

## 📊 API Endpoints

All API calls go through: `http://localhost:3000/api`

### Authentication
- POST `/users/register` - Register
- POST `/users/login` - Login
- GET `/users/profile` - Get profile

### Campaigns
- GET `/campaigns` - List campaigns
- GET `/campaigns/:id` - Get details
- POST `/campaigns` - Create (auth required)

### Donations
- POST `/pledges` - Create donation (auth required)
- GET `/pledges/user/donations` - User donations

### Admin
- GET `/admin/dashboard` - Stats
- GET `/admin/campaigns` - All campaigns
- PUT `/admin/campaigns/:id/verify` - Verify

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

### API Connection Failed
- Check backend is running: `docker-compose ps`
- Verify API_URL in `.env`
- Check browser console for CORS errors

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Docker Issues
```bash
# Rebuild without cache
docker build --no-cache -t careforall-frontend ./frontend

# Check container logs
docker logs careforall-frontend
```

---

## 📝 Development Tips

1. **Hot Module Replacement** - Vite provides instant updates in dev mode
2. **Tailwind IntelliSense** - Install VSCode extension for class autocomplete
3. **React DevTools** - Install browser extension for debugging
4. **API Testing** - Use browser DevTools Network tab

---

## 🎯 Next Steps

- [ ] Add image upload functionality
- [ ] Implement real payment gateway (Stripe/bKash)
- [ ] Add email verification
- [ ] Create mobile app version
- [ ] Add social sharing features
- [ ] Implement campaign updates/comments
- [ ] Add advanced analytics dashboard

---

## 📚 Learn More

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)

---

**Need Help?** Check the main README or contact support@careforall.com
