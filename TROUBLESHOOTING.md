# Troubleshooting Guide

## Backend API Requests Blocked

If you see "Blocked" status for API requests in the browser network tab, follow these steps:

### 1. Check Backend is Running

```bash
# Check if backend is running on port 6000
lsof -ti:6000

# Or test the API directly
curl http://localhost:6000/api/accommodations/
```

### 2. Verify .env File Exists

The backend needs a `.env` file in the `Back-end/` directory:

```bash
cd Back-end
cat .env
```

It should contain:
```env
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:6001,http://127.0.0.1:6001
CORS_ALLOW_CREDENTIALS=True
```

### 3. Restart Backend After .env Changes

After creating or modifying `.env`, **restart the backend server**:

```bash
# Stop the current server (Ctrl+C in the terminal running it)
# Then restart:
cd Back-end
source venv/bin/activate
python manage.py runserver 6000
```

### 4. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for CORS errors
- **Network tab**: Check the actual error message for blocked requests

### 5. Common Issues

#### Issue: "Blocked" requests
**Solution**: 
- Make sure `.env` file exists with correct CORS settings
- Restart backend after creating/modifying `.env`
- Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

#### Issue: CORS errors in console
**Solution**:
- Verify `CORS_ALLOWED_ORIGINS` includes `http://localhost:6001`
- Make sure backend is restarted after .env changes
- Check that frontend `.env` has `VITE_API_BASE_URL=http://localhost:6000`

#### Issue: Backend not responding
**Solution**:
```bash
# Kill any process on port 6000
lsof -ti:6000 | xargs kill -9

# Restart backend
cd Back-end
source venv/bin/activate
python manage.py runserver 6000
```

#### Issue: Port already in use
**Solution**:
```bash
# Find and kill the process
lsof -ti:6000 | xargs kill -9

# Or use a different port
python manage.py runserver 6002
# Then update frontend .env: VITE_API_BASE_URL=http://localhost:6002
```

### 6. Verify Both Services

**Backend should show:**
```
Starting development server at http://127.0.0.1:6000/
Quit the server with CONTROL-C.
```

**Frontend should show:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:6001/
  ➜  Network: use --host to expose
```

### 7. Test API Directly

Test if backend is working:
```bash
# Test accommodations endpoint
curl http://localhost:6000/api/accommodations/

# Should return JSON data, not an error
```

### 8. Quick Fix Script

If requests are blocked, run this:

```bash
cd Back-end

# Create .env if missing
if [ ! -f .env ]; then
  cat > .env << EOF
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:6001,http://127.0.0.1:6001
CORS_ALLOW_CREDENTIALS=True
EOF
fi

# Restart backend (stop current one first with Ctrl+C)
source venv/bin/activate
python manage.py runserver 6000
```

## Still Having Issues?

1. Check backend terminal for error messages
2. Check browser console for detailed error messages
3. Verify both services are running on correct ports
4. Try accessing backend directly: http://localhost:6000/api/accommodations/
5. Clear browser cache and cookies
6. Try incognito/private browsing mode


