# Restaurant Reservation System — MEAN Stack

A production-ready full-stack restaurant reservation system built with MongoDB, Express.js, Angular 17, and Node.js.

---

## Features

### Customer
- Register/Login with JWT authentication
- Browse & search restaurants (by cuisine, price, rating, location)
- Check real-time table availability with time slots
- Make reservations with QR code generation
- Email confirmations and reminders
- Cancel or modify reservations
- View reservation history
- Rate & review restaurants
- Profile management

### Admin
- Dashboard with stats and booking trends
- Manage all reservations (confirm, seat, complete)
- Add/edit/delete restaurant tables
- Real-time updates via Socket.IO
- Analytics charts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, NgRx, Angular Material |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + Refresh Tokens |
| Email | Nodemailer |
| Images | Cloudinary |
| Deployment | Docker + NGINX |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and setup

```bash
git clone https://github.com/yourname/restaurant-reservation-system.git
cd restaurant-reservation-system
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other credentials
npm run seed   # Seeds demo data
npm run dev    # Start backend on :5000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
ng serve       # Start frontend on :4200
```

### 4. Access the App

Open: http://localhost:4200

#### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Customer | john@example.com | Password123! |
| Admin | admin@restaurant.com | Password123! |
| Super Admin | superadmin@restaurant.com | Password123! |

---

## Docker Setup

```bash
# Copy and edit environment
cp .env.example .env
# Edit .env with your secrets

# Start everything
docker-compose up --build

# App runs on http://localhost:4200
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `POST /api/auth/refresh` — Refresh token
- `GET /api/auth/me` — Get profile

### Restaurants
- `GET /api/restaurants` — List (with filters)
- `GET /api/restaurants/:id` — Detail
- `GET /api/restaurants/:id/availability?date=&guestCount=` — Availability

### Reservations
- `GET /api/reservations/my` — My reservations
- `POST /api/reservations` — Create
- `GET /api/reservations/:id` — Detail
- `PATCH /api/reservations/:id/cancel` — Cancel

### Admin
- `GET /api/admin/dashboard` — Stats
- `GET /api/admin/reservations` — All reservations
- `PATCH /api/reservations/:id/status` — Update status
- `GET /api/admin/analytics` — Analytics data

### Tables
- `GET /api/tables/:restaurantId` — Get tables
- `POST /api/tables` — Add table (admin)
- `PATCH /api/tables/:id` — Update table (admin)
- `DELETE /api/tables/:id` — Delete table (admin)

---

## Project Structure

```
restaurant-reservation-system/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, error handler, rate limit
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── services/        # Email service
│   ├── sockets/         # Socket.IO handler
│   ├── utils/           # AppError, catchAsync, logger
│   ├── jobs/            # Cron jobs (reminders)
│   ├── scripts/         # Database seeder
│   └── server.js        # Entry point
│
├── frontend/
│   └── src/app/
│       ├── core/
│       │   ├── guards/          # AuthGuard, AdminGuard
│       │   ├── interceptors/    # JWT interceptor
│       │   ├── models/          # TypeScript interfaces
│       │   └── services/        # API services, Socket
│       ├── features/
│       │   ├── auth/            # Login, Register
│       │   ├── restaurants/     # List, Detail
│       │   ├── reservations/    # List, Detail, Create
│       │   ├── admin/           # Dashboard, Tables, Reservations
│       │   └── profile/         # User profile
│       ├── shared/
│       │   └── components/      # Navbar, Footer, NotFound
│       └── store/               # NgRx State (Auth, Restaurant, Reservation)
│
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

```env
# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_EXPIRES_IN=7d

# Email (Gmail)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Frontend
CLIENT_URL=http://localhost:4200
FRONTEND_URL=http://localhost:4200
```

---

## License
MIT
