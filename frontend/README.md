# CareForAll Frontend

React + Vite frontend application for the CareForAll donation platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icons

## Features

- 🔐 **Authentication** - Login, Register, JWT token management
- 🎯 **Campaign Management** - Browse, create, and donate to campaigns
- 💰 **Donation Flow** - Complete donation flow with payment integration
- 📊 **User Dashboard** - View donation history and profile
- 👑 **Admin Panel** - Campaign verification and transaction monitoring
- 🎨 **Responsive Design** - Mobile-first responsive design
- 🔒 **Protected Routes** - Role-based access control

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Loader.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/         # React Context
│   │   └── AuthContext.jsx
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Profile.jsx
│   │   ├── CampaignList.jsx
│   │   ├── CampaignDetails.jsx
│   │   ├── CreateCampaign.jsx
│   │   └── AdminDashboard.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── Dockerfile           # Production Dockerfile
├── nginx.conf           # Nginx configuration
└── package.json         # Dependencies
```

## API Integration

The frontend connects to the backend API Gateway at `http://localhost:3000/api`.

### API Endpoints Used

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `GET /api/users/donations` - Get user donations (renamed from /pledges/user/donations)
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign
- `POST /api/pledges` - Create pledge/donation
- `GET /api/pledges/campaign/:id` - Get campaign pledges
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/campaigns` - Get all campaigns (admin)
- `PUT /api/admin/campaigns/:id/verify` - Verify campaign
- `GET /api/admin/transactions` - Get all transactions

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
cd frontend
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

### Build for Production

```bash
npm run build
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t careforall-frontend .
```

### Run Container

```bash
docker run -p 5173:80 careforall-frontend
```

### Docker Compose

The frontend is included in the main `docker-compose.yml`:

```bash
# From project root
docker-compose up -d frontend
```

Access at `http://localhost:5173`

## Pages

### Public Pages

- **Home (/)** - Landing page with stats and features
- **Campaigns (/campaigns)** - Browse active campaigns
- **Campaign Details (/campaigns/:id)** - View campaign and donate
- **Login (/login)** - User login
- **Register (/register)** - User registration

### Protected Pages (Require Login)

- **Profile (/profile)** - User profile and donation history
- **Create Campaign (/campaigns/create)** - Create new campaign
- **My Donations (/my-donations)** - User donation history

### Admin Pages (Require Admin Role)

- **Admin Dashboard (/admin)** - Campaign approval and transaction monitoring

## Features Walkthrough

### Authentication Flow

1. User registers with email, password, name
2. JWT token stored in localStorage
3. Token automatically included in API requests
4. Auto-redirect to login on 401 errors

### Campaign Creation

1. Login required
2. Fill campaign form (title, description, goal, beneficiary, etc.)
3. Campaign created with status 'active' or 'draft'
4. Admin can verify/approve campaigns

### Donation Flow

1. Browse campaigns
2. Click "Donate Now" on campaign details
3. Enter donation amount and optional message
4. Pledge created with unique idempotency key
5. Payment automatically processed via backend
6. User can view donation status in profile

### Admin Dashboard

1. View platform statistics
2. Approve/reject pending campaigns
3. Monitor recent transactions
4. Verify campaigns before they go live

## Styling

### Tailwind CSS Classes

Custom utility classes defined in `index.css`:

- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.input-field` - Form input style
- `.card` - Card container style

### Color Scheme

- Primary: Green (#22c55e, #16a34a)
- Secondary: Gray
- Success: Green
- Error: Red

## Best Practices

- ✅ JWT token management with auto-refresh logic
- ✅ Protected routes with role-based access
- ✅ API error handling with toast notifications
- ✅ Loading states for async operations
- ✅ Form validation
- ✅ Responsive design (mobile-first)
- ✅ SEO-friendly page titles
- ✅ Accessibility considerations

## Contributing

1. Follow React best practices
2. Use functional components with hooks
3. Keep components small and focused
4. Add PropTypes for type checking
5. Write meaningful commit messages

## License

MIT License - See LICENSE file for details
