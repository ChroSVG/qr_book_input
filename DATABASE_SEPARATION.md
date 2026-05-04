# Database Separation - Development vs Production

## Overview

Backend sekarang menggunakan **database terpisah** untuk development dan production agar tidak mengganggu data production saat testing.

## Database Files

| Environment | Database File | Purpose |
|-------------|--------------|---------|
| **Production** | `backend/data.db` | Live production data (964+ inventory items) |
| **Development** | `backend/data-dev.db` | Clean database untuk testing & development |

## Configuration

### Development (.env)
```env
DATABASE_URL=sqlite+aiosqlite:///./data-dev.db
PORT=8005
CORS_ORIGINS=["http://localhost:3001","https://localhost:3001","https://input.arraayah.my.id","https://100.109.2.99:3001","https://100.109.2.99:3000","http://localhost:8005","http://localhost:5173","http://localhost:3000"]
```

### Production (.env.production)
```env
DATABASE_URL=sqlite+aiosqlite:///./data.db
PORT=8002
CORS_ORIGINS=["https://input.arraayah.my.id","https://100.109.2.99:3001","https://100.109.2.99:3000"]
```

## Setup Instructions

### For Development

1. **Use `.env` file** (already configured):
   ```bash
   cd backend
   # .env file is already set to data-dev.db
   ```

2. **Start development server**:
   ```bash
   .venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8005
   ```

3. **Access endpoints**:
   - API Docs: http://localhost:8005/docs
   - Auth: http://localhost:8005/api/auth/*
   - All operations use `data-dev.db` (safe for testing)

### For Production

1. **Copy production env**:
   ```bash
   cp .env.production .env
   ```

2. **Start production server**:
   ```bash
   .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8002
   ```

3. **All operations use `data.db` (production data)**

## Verification

### Check Current Database

```bash
# From backend directory
python3 -c "from config import settings; print(settings.database_url)"
```

Expected output for development:
```
DATABASE_URL: sqlite+aiosqlite:///./data-dev.db
```

### Check Database Contents

```bash
# Production inventory count
sqlite3 data.db "SELECT count(*) FROM data;"
# Output: 964 (or more)

# Development inventory count  
sqlite3 data-dev.db "SELECT count(*) FROM data;"
# Output: 0 (clean database)
```

## Git Safety

The following files are **gitignored** to prevent accidental commits:
- `.env` (current environment config)
- `.env.development` (development template)
- `.env.production` (production template)
- `*.db` (all database files EXCEPT data.db)
- `!data.db` (production data is tracked)

**Important**: 
- ✅ Safe to modify `data-dev.db` (development)
- ⚠️ **DO NOT** modify `data.db` directly (production)
- 🔒 Never commit `.env` with real secrets

## Switching Environments

### To Development:
```bash
cd backend
cp .env.development .env
# Restart server
```

### To Production:
```bash
cd backend
cp .env.production .env
# Update JWT_SECRET with secure random value
# Restart server
```

## Current Status

✅ **Development Mode Active**
- Database: `data-dev.db` (clean, 0 inventory items)
- Port: 8005
- CORS: All localhost origins enabled
- Users: Test users only (safe to delete)

✅ **Production Data Safe**
- Database: `data.db` (964+ items, untouched)
- Port: 8002 (when running)
- No test users in production
- Auth features isolated to dev environment

## Testing Authentication

### Register Test User (Development Only)
```bash
curl -X POST http://localhost:8005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Login Test User
```bash
curl -X POST http://localhost:8005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123456"
  }'
```

### Test Download History
```bash
# After login, get your token from login response
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:8005/api/downloads/history \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Issue: Still using production database
**Solution**: 
1. Check `.env` file: `cat .env | grep DATABASE_URL`
2. Kill all backend processes: `pkill -9 -f uvicorn`
3. Restart server: `.venv/bin/uvicorn main:app --reload --port 8005`
4. Verify: `python3 -c "from config import settings; print(settings.database_url)"`

### Issue: Port already in use
**Solution**:
```bash
# Find process on port
ss -tlnp | grep 8005

# Kill it (replace PID)
kill -9 <PID>

# Restart server
```

### Issue: Database tables not created
**Solution**:
Tables are auto-created on startup. Check logs:
```bash
tail -50 /tmp/backend-dev.log
```

Look for: "Application startup complete"

## Environment Files Reference

| File | Purpose | Committed? |
|------|---------|-----------|
| `.env` | Active configuration | ❌ No |
| `.env.development` | Development template | ✅ Yes |
| `.env.production` | Production template | ✅ Yes |
| `data.db` | Production database | ✅ Yes (tracked) |
| `data-dev.db` | Development database | ❌ No |
| `*.db` (other) | Test databases | ❌ No |

## Best Practices

1. **Always test in development first** (`data-dev.db`)
2. **Never test with production data** unless debugging production issues
3. **Backup production database** before deployments
4. **Use different JWT_SECRET** for production
5. **Rotate API_KEY** regularly in production
6. **Monitor CORS origins** - remove unused localhost ports in production

---

**Last Updated**: 2026-04-13
**Status**: ✅ Development database active, production data safe
