# Troubleshooting Guide: Old Data Not Showing

## Issues Fixed

### 1. ✅ Frontend JWT Token Not Being Sent
**Problem**: The `authFetch()` function was not including the Authorization header with JWT token.

**Solution Applied**: Updated `frontend/src/lib/auth.ts` to use `getAuthHeaders()` which properly constructs the Authorization bearer token.

```typescript
// Before (BROKEN)
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
};

// After (FIXED)
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...getAuthHeaders(),  // ← Now includes Authorization: Bearer token
      ...options.headers,
    },
  });
  return response;
};
```

### 2. ✅ Backend Routes Missing Authentication
**Problem**: All backend routes had `authenticateToken` middleware commented out with TODOs.

**Solution Applied**: Uncommented and enabled JWT authentication in:
- `Backend/src/routes/customers.ts`
- `Backend/src/routes/suppliers.ts`
- `Backend/src/routes/parts.ts`
- `Backend/src/routes/invoices.ts`
- `Backend/src/routes/reports.ts`
- `Backend/src/routes/stock.ts`
- `Backend/src/routes/invoices-bulk.ts`

All routes now require valid JWT token in `Authorization: Bearer <token>` header.

---

## Setup and Verification Checklist

### 1. Database Connection
```bash
# Verify DATABASE_URL is set correctly in .env
# Should point to PostgreSQL database
echo $DATABASE_URL

# Test connection
cd Backend
npx prisma db push  # Apply migrations
npx prisma db seed  # Run seed script
```

### 2. Seed Data
The seed script (`Backend/prisma/seed.ts`) creates:

- **Users**: 1 admin user
  - Email: `admin@jcbparts.com`
  - Password: `Admin@123`

- **Parts**: 8 sample JCB parts with MRP/RTL pricing

- **Suppliers**: 4 sample suppliers with GSTIN and contact info

- **Customers**: 5 sample customers with GSTIN and contact info

- **Invoices**: 2 sample invoices (1 purchase + 1 sales) with payment data

To run seed manually:
```bash
cd Backend
npx prisma db seed
```

### 3. Frontend Environment Variables
```bash
# .env.local or .env.production.local (frontend)

# Backend API URL - must be accessible from the frontend
NEXT_PUBLIC_API_URL=http://backend-url:4001

# Or leave empty if using reverse proxy that routes /api/* to backend
NEXT_PUBLIC_API_URL=
```

### 4. Backend Environment Variables
```bash
# .env (backend)

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Secret - MUST be at least 32 characters!
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long

# API Port
PORT=4001

# Frontend URL for CORS
FRONTEND_URL=http://frontend-url:3000

# Email (optional, for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
FROM_EMAIL=noreply@example.com

# Environment
NODE_ENV=production
```

### 5. API Response Testing
Test endpoints manually to verify they return JSON:

```bash
# 1. Login to get token
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jcbparts.com",
    "password": "Admin@123"
  }'

# Response should have: { token, user }
# Copy the token

# 2. Get users (requires token)
curl -X GET http://localhost:4001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return: { users: [...] }

# 3. Get customers
curl -X GET http://localhost:4001/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return: [ { id, name, email, ... }, ... ]

# 4. Get reports
curl -X GET http://localhost:4001/api/reports/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return: { totalParts, activeParts, sales, purchases, ... }
```

### 6. Common Issues and Solutions

#### Issue: "Failed to load users" or 401 Unauthorized
**Cause**: JWT token not being sent or invalid

**Solution**:
1. Check localStorage has `auth_token` after login
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Check server logs for "Access token required" or "Invalid token"

#### Issue: 0 values in all reports/dashboards
**Cause**: Database is empty or seed hasn't run

**Solution**:
1. Connect to database and check record counts:
   ```sql
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Part";
   SELECT COUNT(*) FROM "Customer";
   SELECT COUNT(*) FROM "Supplier";
   SELECT COUNT(*) FROM "Invoice";
   ```
2. If counts are 0, run seed:
   ```bash
   cd Backend
   npx prisma db seed
   ```

#### Issue: API returns HTML instead of JSON ("Unexpected token '<'")
**Cause**: 
- Request hitting wrong endpoint (404)
- Error page being returned instead of JSON
- Reverse proxy misconfigured

**Solution**:
1. Check request URL is correct
2. Look for 404 status in network tab
3. Verify reverse proxy routes `/api/*` to backend server
4. Check backend is actually running on correct port

#### Issue: Empty lists (Customers, Suppliers, Items all showing "No entries")
**Cause**: Either database is empty or queries are failing silently

**Solution**:
1. Verify seed data was created: Run seed command
2. Check database password/connection
3. Look at backend console for query errors
4. Verify no soft-delete flags are hiding data (check `isDeleted` in database)

---

## Database Reset (PRODUCTION DANGER ⚠️)

**Only run this on development/staging database, NEVER on production!**

```bash
cd Backend

# Option 1: Reset everything (deletes all data)
npx prisma migrate reset --force

# Option 2: Just drop and recreate schema
npx prisma db push --force-reset

# Then reseed:
npx prisma db seed
```

---

## Logs to Check

### Backend Console
Look for these patterns:
```
✓ Request: GET /api/users (should show on production only for non-GET)
[Prisma] Slow query detected (3000ms): ... (dev only)
[SECURITY] Blocked CORS request from ...
[Performance] Slow request: POST /api/invoices took 15000ms
Authentication error: ... (if JWT issues)
```

### Frontend Network Tab (Browser DevTools)
1. Open DevTools → Network tab
2. Login and try to load a page
3. Look for requests to `/api/*`
4. Check response status:
   - 401 = No/invalid token
   - 403 = Token valid but permission denied
   - 404 = Endpoint not found
   - 500 = Server error

### Docker Logs
```bash
# Backend logs
docker logs jcb_backend

# Database logs
docker logs jcb_postgres

# Frontend logs (if Docker)
docker logs jcb_frontend
```

---

## Rebuild and Restart

### Full Clean Rebuild

```bash
# 1. Backend
cd Backend
npm install
npx prisma generate
npm run build
npx prisma db push
npx prisma db seed
npm start  # or pm2 start dist/index.js

# 2. Frontend
cd frontend
rm -rf .next node_modules
npm install
npm run build

# With Docker
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

---

## Expected Results After Fixes

✅ All pages should show data:
- Dashboard: Sales/Purchase totals, part counts, etc.
- Customers: 5 sample customers (ABC Construction Ltd, XYZ Enterprises, etc.)
- Suppliers: 4 sample suppliers
- Items: 8 JCB parts with pricing
- Sales Payments: 1 sample sale invoice
- Purchase Payments: 1 sample purchase invoice
- Profit & Loss: Shows financial data
- Balance Sheet: Shows assets/liabilities
- User Management: Shows admin@jcbparts.com

✅ No console errors related to:
- 401 Unauthorized
- Failed to load users
- JSON parse errors

---

## Performance Optimization

After fixing issues, optimize with:

```bash
# Database indexes (already applied)
npx prisma db push

# Enable caching headers (already configured)
# Routes use 30-60 second cache for reports/dashboards

# Monitor slow queries (dev only)
NODE_ENV=development npm start
```

---

## Support

If issues persist:
1. Check all .env variables are set
2. Verify database connection with `npx prisma db execute --stdin < query.sql`
3. Look at backend container logs
4. Ensure frontend can reach backend (check CORS headers)
5. Test with curl before testing in browser
