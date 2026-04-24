@echo off
REM JCB Parts Shop - Setup Verification Script for Windows
REM Run this to verify everything is configured correctly

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   JCB Parts Shop - Data Loading Verification (Windows)     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set BACKEND_URL=http://localhost:4001
set PASSED=0
set FAILED=0

echo Step 1: Checking Environment Variables
echo ─────────────────────────────────────────

if "!DATABASE_URL!"=="" (
    echo [X] DATABASE_URL not set
    set /a FAILED+=1
    goto :check_jwt
) else (
    echo [✓] DATABASE_URL is set
    set /a PASSED+=1
)

:check_jwt
if "!JWT_SECRET!"=="" (
    echo [X] JWT_SECRET not set
    set /a FAILED+=1
) else (
    for /F "delims=" %%A in ('echo !JWT_SECRET! ^| find /c ""') do (
        set len=%%A
    )
    if !len! geq 32 (
        echo [✓] JWT_SECRET is set ^(!len! chars^)
        set /a PASSED+=1
    ) else (
        echo [X] JWT_SECRET too short (needs 32+)
        set /a FAILED+=1
    )
)

echo.
echo Step 2: Checking Backend API
echo ─────────────────────────────────────────

for /f %%A in ('powershell -Command "(Invoke-WebRequest -Uri %BACKEND_URL%/api/ready -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode" 2^>nul') do (
    if "%%A"=="200" (
        echo [✓] Backend is running and healthy
        set /a PASSED+=1
    ) else (
        echo [X] Backend status: %%A
        set /a FAILED+=1
    )
)

if !FAILED! equ 1 if !PASSED! equ 1 (
    echo [X] Cannot connect to backend at %BACKEND_URL%
    echo     Make sure backend is running: npm start
    echo     In Backend\ directory
    set /a FAILED+=1
)

echo.
echo Step 3: Testing Authentication
echo ─────────────────────────────────────────

echo Testing login with admin@jcbparts.com...

for /f "delims=" %%A in ('powershell -Command "& { $json = @{ email='admin@jcbparts.com'; password='Admin@123' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri %BACKEND_URL%/api/auth/login -Method POST -ContentType 'application/json' -Body $json -UseBasicParsing -ErrorAction SilentlyContinue; if ($response.StatusCode -eq 200) { $response.Content } }" 2^>nul') do (
    if "%%A" neq "" (
        if "!output!"=="" (
            set output=%%A
        ) else (
            set output=!output! %%A
        )
    )
)

if "!output:token=!" neq "!output!" (
    echo [✓] Login successful - JWT token obtained
    set /a PASSED+=1
    REM Extract token for further tests
    for /f "delims=" %%B in ('echo !output! ^| find /L "token"') do (
        set TOKEN_LINE=%%B
    )
) else (
    echo [X] Login failed - possible causes:
    echo     - Admin user not created (run seed)
    echo     - Database empty
    echo     - Wrong backend URL
    set /a FAILED+=1
)

echo.
echo Step 4: Checking Database Data
echo ─────────────────────────────────────────

echo To manually check database:
echo 1. Connect to PostgreSQL with your credentials
echo 2. Run these queries:
echo    SELECT COUNT(*) FROM "User";
echo    SELECT COUNT(*) FROM "Part";
echo    SELECT COUNT(*) FROM "Customer";
echo    SELECT COUNT(*) FROM "Supplier";
echo    SELECT COUNT(*) FROM "Invoice";
echo.
echo If all return 0, run: cd Backend ^&^& npx prisma db seed
echo.

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║ SUMMARY
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Checks Passed: !PASSED!
echo Checks Failed: !FAILED!
echo.

if !FAILED! equ 0 (
    echo [✓] All checks passed!
    echo.
    echo Your system is ready. Data should be visible on all pages.
) else (
    echo [X] Some issues detected. Please fix them:
    echo.
    echo Common fixes:
    echo 1. Seed database:   cd Backend ^&^& npx prisma db seed
    echo 2. Start backend:   cd Backend ^&^& npm start
    echo 3. Build frontend:  cd frontend ^&^& npm run build
    echo 4. Check logs:      See Backend console output
    echo.
)

echo For detailed help, see: TROUBLESHOOTING.md
echo.
pause
