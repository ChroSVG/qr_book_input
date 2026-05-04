# Authentication & Download Tracking Setup

## Overview

This document explains the new **User Authentication** and **Server-Side Download Tracking** features.

### Problem Solved

Previously, download status was stored only in `localStorage`, which meant:
- ❌ Status was lost when users cleared browser data
- ❌ Status didn't sync across devices
- ❌ No server-side tracking for admins
- ❌ No persistent download history

### Solution

We implemented:
- ✅ **User Registration & Login** with JWT tokens
- ✅ **Server-Side Download Tracking** in database
- ✅ **Persistent Download History** that survives refresh/browser close
- ✅ **Download History Page** to view all tracked downloads

---

## Features

### 1. User Authentication

**Routes:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

**Flow:**
1. User registers with username, email, and password
2. User logs in and receives JWT token
3. JWT token is stored in `localStorage`
4. Token is automatically sent with all API requests

### 2. Download Tracking

**Tracked Downloads:**
- CSV exports
- Excel exports
- (Future: PDF downloads)

**Routes:**
- `GET /api/downloads/history` - Get download history (paginated)
- `DELETE /api/downloads/history/{id}` - Delete download log entry

**Database Table:**
```sql
download_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES user(id),
    file_type VARCHAR(20),  -- 'csv', 'excel', 'pdf'
    filename VARCHAR(255),
    ip_address VARCHAR(45),
    downloaded_at TIMESTAMP
)
```

### 3. Frontend Pages

**Auth Page** (`/auth`):
- Login/Register forms
- Redirects to home after successful login

**Downloads History Page** (`/downloads/history`):
- Shows all tracked downloads
- Pagination support
- Delete individual entries
- File type badges (CSV, Excel, PDF)

---

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   
   Create `.env` file in `backend/` directory:
   ```env
   DATABASE_URL=sqlite+aiosqlite:///data/data.db
   API_KEY=your-api-key-here
   JWT_SECRET=your-jwt-secret-here
   ```
   
   Generate a secure JWT secret:
   ```python
   import secrets
   print(secrets.token_urlsafe(64))
   ```

3. **Database tables are auto-created:**
   - `user` table for user accounts
   - `download_log` table for download tracking
   - Tables are created automatically on app startup

4. **Start the backend:**
   ```bash
   cd backend
   python main.py
   ```

### Frontend Setup

1. **Install dependencies (if not already done):**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

---

## Usage

### 1. Register a New User

1. Navigate to `/auth`
2. Click "Register here"
3. Enter username, email, and password (min 6 characters)
4. Click "Register"
5. You'll be redirected to login

### 2. Login

1. Enter username and password
2. Click "Login"
3. You'll be redirected to home page
4. Your username appears in the header

### 3. Download Files

1. Go to **Inventory** page (`/table`)
2. Click "Export CSV" or "Export Excel"
3. Download is tracked automatically

### 4. View Download History

1. Click **"History"** in the navigation
2. See all your tracked downloads
3. Delete entries if needed
4. History persists across sessions!

---

## API Examples

### Register User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "is_active": true,
    "created_at": "2026-04-13T10:00:00Z"
  }
}
```

### Get Download History

```bash
curl -X GET "http://localhost:8000/api/downloads/history?page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Download CSV (with JWT auth)

```bash
curl -X GET http://localhost:8000/api/data/export/csv \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  --output data_export.csv
```

---

## Architecture

### Backend Components

```
backend/
├── models.py              # User & DownloadLog SQLModel tables
├── schemas.py             # Pydantic request/response schemas
├── auth.py                # JWT utilities, password hashing
├── routers/
│   ├── auth.py            # Register, login, profile endpoints
│   ├── downloads.py       # Download history endpoints
│   └── export.py          # Updated to track downloads
└── main.py                # App entry, includes all routers
```

### Frontend Components

```
frontend/src/
├── lib/
│   └── api.js             # Auth & download history API functions
├── pages/
│   ├── AuthPage.jsx                 # Login/Register form
│   └── DownloadsHistoryPage.jsx     # Download history viewer
├── layouts/
│   └── Layout.jsx       # Header with user menu & logout
└── App.jsx              # Protected routes setup
```

---

## Security Notes

### Password Hashing
- Uses **bcrypt** algorithm via `passlib`
- Passwords are never stored in plain text
- Hashing is automatic on registration

### JWT Tokens
- Tokens expire after **7 days**
- Secret key should be at least 32 characters
- Use different secrets for development/production

### API Key vs JWT
- **API Key**: Legacy auth, no download tracking
- **JWT**: Modern auth, full download tracking
- Both work simultaneously for backward compatibility

---

## Troubleshooting

### Issue: "Could not validate credentials"
**Solution:** Make sure JWT token is in localStorage and valid. Try logging in again.

### Issue: Download history is empty after downloading
**Solution:** Ensure you're logged in before downloading. API key downloads are not tracked.

### Issue: Database tables not created
**Solution:** Check that `create_db_and_tables()` is called in `main.py` lifespan.

### Issue: CORS errors
**Solution:** Update `CORS_ORIGINS` in `.env` to include your frontend URL.

---

## Future Enhancements

- [ ] PDF download tracking (currently external service)
- [ ] Download analytics dashboard
- [ ] Export download history as CSV
- [ ] User profile management (change password, email)
- [ ] Password reset via email
- [ ] Admin panel to view all users' downloads
- [ ] Download notifications

---

## Migration from localStorage

The old `localStorage` download tracking (`downloaded_pdfs`) is still present for backward compatibility. To fully migrate:

1. Remove `downloaded_pdfs` from `DownloadsPage.jsx`
2. Use only server-side download history
3. Update all download buttons to require JWT auth

---

## Support

For issues or questions:
- Check backend logs for error messages
- Verify JWT_SECRET is set in `.env`
- Ensure database file exists and is writable
- Check browser console for frontend errors
