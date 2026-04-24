#!/bin/bash
# JCB Parts Shop - Setup Verification and Troubleshooting Script

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   JCB Parts Shop - Data Loading Verification Script        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
DB_CHECK_TIMEOUT=5

# Counters
PASSED=0
FAILED=0

# Helper functions
success() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

failure() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

section() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║ $1"
  echo "╚════════════════════════════════════════════════════════════╝"
}

# Check 1: Environment Variables
section "1. Checking Environment Variables"

if [ -z "$DATABASE_URL" ]; then
  failure "DATABASE_URL not set"
else
  success "DATABASE_URL is set"
fi

if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
  failure "JWT_SECRET not set or less than 32 characters"
else
  success "JWT_SECRET is set (${#JWT_SECRET} chars)"
fi

if [ -z "$FRONTEND_URL" ]; then
  warning "FRONTEND_URL not set, using default: $FRONTEND_URL"
else
  success "FRONTEND_URL is set: $FRONTEND_URL"
fi

# Check 2: Backend API Health
section "2. Checking Backend API"

# Health check (no auth required)
if response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/ready" 2>/dev/null); then
  if [ "$response" = "200" ]; then
    success "Backend is running and healthy"
  else
    warning "Backend returned status $response (expected 200)"
  fi
else
  failure "Cannot connect to backend at $BACKEND_URL"
  echo "   Make sure backend is running on port 4001"
  echo "   Try: cd Backend && npm start"
fi

# Check 3: Database Connection (via Prisma)
section "3. Checking Database Data"

echo "Running database checks..."

# Try to connect via psql if available
if command -v psql &> /dev/null; then
  echo ""
  info "Checking PostgreSQL tables..."
  
  # Parse DATABASE_URL to extract connection details
  if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    PGUSER="${BASH_REMATCH[1]}"
    PGPASSWORD="${BASH_REMATCH[2]}"
    PGHOST="${BASH_REMATCH[3]}"
    PGPORT="${BASH_REMATCH[4]}"
    PGDATABASE="${BASH_REMATCH[5]}"
    
    export PGPASSWORD
    
    if psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -c "SELECT 1" &>/dev/null; then
      success "PostgreSQL database is accessible"
      
      # Check record counts
      USERS=$(psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM \"User\"" 2>/dev/null)
      PARTS=$(psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM \"Part\"" 2>/dev/null)
      CUSTOMERS=$(psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM \"Customer\"" 2>/dev/null)
      SUPPLIERS=$(psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM \"Supplier\"" 2>/dev/null)
      INVOICES=$(psql -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM \"Invoice\"" 2>/dev/null)
      
      echo ""
      info "Database Record Counts:"
      echo "   Users:     $USERS"
      echo "   Parts:     $PARTS"
      echo "   Customers: $CUSTOMERS"
      echo "   Suppliers: $SUPPLIERS"
      echo "   Invoices:  $INVOICES"
      
      TOTAL=$((USERS + PARTS + CUSTOMERS + SUPPLIERS + INVOICES))
      if [ "$TOTAL" -gt 0 ]; then
        success "Database contains data"
      else
        failure "Database is empty! Run: npx prisma db seed"
      fi
    else
      failure "Cannot connect to PostgreSQL database"
      echo "   DATABASE_URL: $DATABASE_URL"
    fi
  else
    warning "Could not parse DATABASE_URL format"
  fi
else
  warning "psql not available, skipping direct database check"
fi

# Check 4: API Authentication
section "4. Testing API Authentication"

echo ""
info "Testing login endpoint..."

# Attempt login
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jcbparts.com",
    "password": "Admin@123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
  success "Login successful"
  
  # Extract token
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  success "JWT token obtained: ${TOKEN:0:20}..."
  
  # Check 5: API Endpoints with Auth
  section "5. Testing Authenticated API Endpoints"
  
  echo ""
  
  # Test Users endpoint
  USERS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/users" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  
  if echo "$USERS_RESPONSE" | grep -q '"users"'; then
    success "GET /api/users returns valid JSON"
  else
    failure "GET /api/users failed"
  fi
  
  # Test Customers endpoint
  CUSTOMERS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/customers" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  
  if echo "$CUSTOMERS_RESPONSE" | grep -q '\[' || echo "$CUSTOMERS_RESPONSE" | grep -q 'name'; then
    success "GET /api/customers returns valid JSON"
  else
    failure "GET /api/customers failed"
  fi
  
  # Test Parts endpoint
  PARTS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/parts" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  
  if echo "$PARTS_RESPONSE" | grep -q '"data"'; then
    success "GET /api/parts returns valid JSON"
  else
    failure "GET /api/parts failed"
  fi
  
  # Test Reports endpoint
  REPORTS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/reports/dashboard" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  
  if echo "$REPORTS_RESPONSE" | grep -q '"totalParts"'; then
    success "GET /api/reports/dashboard returns valid JSON"
  else
    failure "GET /api/reports/dashboard failed"
  fi
  
else
  failure "Login failed"
  echo "   Response: $LOGIN_RESPONSE"
  echo ""
  warning "Seed data may not be loaded. Run:"
  echo "   cd Backend && npx prisma db seed"
fi

# Check 6: Frontend Configuration
section "6. Checking Frontend Configuration"

if [ -f "frontend/.env.local" ] || [ -f "frontend/.env.production.local" ]; then
  success "Frontend .env file exists"
  
  if [ -f "frontend/.env.local" ]; then
    if grep -q "NEXT_PUBLIC_API_URL" frontend/.env.local; then
      API_URL=$(grep "NEXT_PUBLIC_API_URL" frontend/.env.local | cut -d'=' -f2)
      success "NEXT_PUBLIC_API_URL is set: $API_URL"
    else
      warning "NEXT_PUBLIC_API_URL not in .env.local (may use default empty string for proxy)"
    fi
  fi
else
  warning "No frontend .env file found - will use defaults"
fi

# Final Summary
section "Summary"

echo ""
echo "Total Checks Passed: $PASSED"
echo "Total Checks Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  success "All checks passed! ✓"
  echo ""
  echo "Your JCB Parts Shop is ready to use. Data should now be visible on all pages."
else
  failure "Some checks failed. Please review the items marked with ✗ above."
  echo ""
  echo "Common fixes:"
  echo "1. Run seed: cd Backend && npx prisma db seed"
  echo "2. Check backend is running: ps aux | grep node"
  echo "3. Check database connection: echo \$DATABASE_URL"
  echo "4. Rebuild frontend: cd frontend && npm run build"
  echo ""
fi

echo ""
echo "For detailed troubleshooting, see: TROUBLESHOOTING.md"
echo "For setup help, see: README.md"
