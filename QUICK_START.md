# Quick Start Guide - Fix Old Data Not Showing

## TL;DR - Quick Fix

```bash
# 1. Backend: Create/seed database
cd Backend
npx prisma db push          # Apply migrations
npx prisma db seed          # Load sample data
npm start                   # Start backend (runs on port 4001)

# 2. Frontend: Rebuild with correct API URL
cd frontend
npm run build               # Production build
npm start                   # Start frontend (runs on port 3000)

# 3. Verify
# Open browser: http://localhost:3000
# Login: admin@jcbparts.com / Admin@123
# All data should now be visible
```

---

## What Was Fixed

### Critical Bug #1: JWT Token Not Being Sent ✅
**File**: `frontend/src/lib/auth.ts`

The `authFetch()` function wasn't including the Authorization header with JWT token. This caused all authenticated API requests to fail with 401 errors.

**Fix Applied**: Updated to use `getAuthHeaders()` which properly constructs `Authorization: Bearer <token>`

### Critical Bug #2: Backend Routes Disabled ✅
**Files**: All `Backend/src/routes/*.ts`

All routes had `authenticateToken` middleware commented out. This disabled authentication verification.

**Fix Applied**: Uncommented and enabled authentication in:
- customers.ts
- suppliers.ts
- parts.ts
- invoices.ts
- reports.ts
- stock.ts
- invoices-bulk.ts

---

## Step-by-Step Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL running
- `.env` files configured with:
  - `DATABASE_URL` pointing to your PostgreSQL
  - `JWT_SECRET` (min 32 characters)

### Step 1: Backend Setup

```bash
cd Backend

# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Apply database migrations
npx prisma db push

# 4. Load sample data
npx prisma db seed

# 5. Start backend
npm start
# You should see: 🚀 JCB Parts Shop Backend
# 📍 Environment: production/development
# 📡 Listening on http://0.0.0.0:4001
```

### Step 2: Verify Backend is Working

```bash
# Test API health
curl http://localhost:4001/api/ready

# Test login
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jcbparts.com",
    "password": "Admin@123"
  }'

# Response should have: { "token": "...", "user": {...} }
```

### Step 3: Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Set environment variables (if needed)
# .env.local or .env.production.local
# NEXT_PUBLIC_API_URL=http://localhost:4001
# OR leave empty if using reverse proxy for /api routing

# 3. Build production version
npm run build

# 4. Start frontend (as production)
npm start
# You should see: ▲ Next.js
# ready - started server on 0.0.0.0:3000
```

### Step 4: Test in Browser

1. Open: http://localhost:3000
2. Login with:
   - Email: `admin@jcbparts.com`
   - Password: `Admin@123`
3. You should see:
   - ✅ Dashboard with data
   - ✅ Customers list (5 entries)
   - ✅ Suppliers list (4 entries)
   - ✅ Items list (8 parts)
   - ✅ Sales Invoices (1 sample)
   - ✅ Purchase Invoices (1 sample)
   - ✅ Profit & Loss report
   - ✅ Balance Sheet report

---

## Docker Setup (Production)

```bash
# Using docker-compose
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker logs jcb_backend
docker logs jcb_postgres
docker logs jcb_frontend

# Seed database (if needed)
docker exec jcb_backend npx prisma db seed

# Stop everything
docker-compose -f docker-compose.production.yml down
```

---

## Environment Variables Required

### Backend (.env)
```
# Database - REQUIRED
DATABASE_URL=postgresql://user:password@localhost:5432/jcbdb

# Security - REQUIRED (must be 32+ characters)
JWT_SECRET=your-very-long-secret-key-at-least-32-characters

# Server
PORT=4001
NODE_ENV=production

# Frontend for CORS
FRONTEND_URL=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
FROM_EMAIL=noreply@yoursite.com
```

### Frontend (.env.local or .env.production.local)
```
# API base URL - leave empty if using reverse proxy
NEXT_PUBLIC_API_URL=

# Or specify backend URL
NEXT_PUBLIC_API_URL=http://localhost:4001
```

---

## Sample Data Created by Seed

### Admin User
- Email: `admin@jcbparts.com`
- Password: `Admin@123`
- Role: ADMIN

### Sample Parts (8)
- JCB-001: Hydraulic Cylinder (₹15,000)
- JCB-002: Engine Oil Filter (₹800)
- JCB-003: Air Filter (₹1,200)
- JCB-004: Transmission Fluid (₹450)
- JCB-005: Brake Pad Set (₹5,000)
- JCB-006: Battery (₹8,000)
- JCB-007: Spark Plug (₹250)
- JCB-008: Fuel Injector (₹3,500)

### Sample Suppliers (4)
- JCB Parts International (Delhi)
- Hindustan Motors Parts (Mumbai)
- Eastern Automotive Solutions (Kolkata)
- South India Parts Trading (Bangalore)

### Sample Customers (5)
- ABC Construction Ltd (Delhi)
- XYZ Enterprises Pvt Ltd (Mumbai)
- PQR Industrial Traders (Kolkata)
- DEF Manufacturing Co (Bangalore)
- GHI Equipment Rentals (Hyderabad)

### Sample Invoices (2)
- 1 Purchase Invoice (PUR-2026-001) - ₹47,960
- 1 Sales Invoice (SAL-2026-001) - ₹40,680

---

## Troubleshooting

### Problem: "Failed to load users" error

**Solution 1**: Check JWT token is being sent
```bash
# In browser DevTools → Network tab
# Login and check requests
# Should see: Authorization: Bearer <token>
```

**Solution 2**: Verify backend authentication is enabled
```bash
# Check Backend/src/routes/users.ts
# Should have: router.use(authenticateToken);
# (Already fixed in this version)
```

**Solution 3**: Check database connection
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin << EOF
SELECT 1;
EOF
```

### Problem: 0 values in all reports

**Solution**: Database is empty, run seed
```bash
cd Backend
npx prisma db seed
```

### Problem: "Cannot GET /api/users"

**Solution**: API endpoint not found

Check:
1. Backend is running on port 4001
2. URL is correct: http://localhost:4001/api/users
3. No typos in route names

### Problem: "Unexpected token '<'" in console

**Solution**: API returning HTML instead of JSON

Causes:
- 404 error page returned instead of JSON
- Wrong API endpoint
- Reverse proxy misconfigured

Fix:
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/customers

# Should return: [...] not HTML
```

---

## Verification Script

### Linux/Mac
```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

### Windows
```cmd
verify-setup.bat
```

This script will:
- ✅ Check environment variables
- ✅ Verify backend is running
- ✅ Test database connection
- ✅ Check JWT authentication
- ✅ Test API endpoints
- ✅ Count database records

---

## Common Commands

```bash
# Seed database (run sample data)
cd Backend && npx prisma db seed

# Check database migrations status
cd Backend && npx prisma migrate status

# Reset database (⚠️ DELETES ALL DATA)
cd Backend && npx prisma migrate reset --force

# View database with Prisma Studio
cd Backend && npx prisma studio

# Build frontend
cd frontend && npm run build

# Start frontend in development
cd frontend && npm run dev

# Start backend in development (auto-reload)
cd Backend && npm run dev

# Check backend logs
docker logs jcb_backend

# SSH into backend container
docker exec -it jcb_backend /bin/sh
```

---

## Next Steps

1. ✅ Apply the code fixes (already done)
2. ✅ Setup environment variables
3. ✅ Run database migrations and seed
4. ✅ Start backend and frontend
5. ✅ Verify data appears in UI
6. ✅ Create backups

---

## Support Resources

- **Full Troubleshooting Guide**: See `TROUBLESHOOTING.md`
- **Architecture**: See `README.md`
- **Database Schema**: `Backend/prisma/schema.prisma`
- **API Routes**: `Backend/src/routes/`
- **Frontend Components**: `frontend/src/`

---

## Health Check URLs

Bookmark these for quick status checks:

```
Backend Health:     http://localhost:4001/api/ready
Frontend:           http://localhost:3000
Login:              http://localhost:3000/login
Dashboard:          http://localhost:3000/dashboard
Users:              http://localhost:3000/dashboard/common/users
Customers:          http://localhost:3000/dashboard/common/customers
Suppliers:          http://localhost:3000/dashboard/common/suppliers
Items:              http://localhost:3000/dashboard/common/items
Reports:            http://localhost:3000/dashboard/reports
```

---

## Performance Tips

1. **Caching**: Enabled by default (30-60s)
2. **Database Indexes**: Applied via migrations
3. **Connection Pool**: Configured in docker-compose
4. **Pagination**: Parts use limit/offset
5. **Soft Deletes**: Queries exclude deleted records

---

## Security Checklist

- ✅ JWT authentication enabled on all routes
- ✅ Role-based access control (ADMIN/USER)
- ✅ Password hashing with bcrypt
- ✅ CORS configured properly
- ✅ Rate limiting enabled
- ✅ SQL injection prevention via Prisma
- ✅ XSS protection headers
- ✅ CSRF tokens (if needed)

---

## Need Help?

1. Check logs: `docker logs jcb_backend`
2. Run verification: `./verify-setup.sh` or `verify-setup.bat`
3. Read: `TROUBLESHOOTING.md`
4. Check network tab in browser DevTools
5. Test API with curl/Postman

---

**Last Updated**: 2026-04-24
**Status**: All critical issues fixed ✅
