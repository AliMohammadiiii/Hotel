# Fix Production Network Errors

## Problem
The frontend is showing network errors because:
1. **Frontend is using wrong API URL** - defaults to `localhost:6000` instead of `https://hotel.nntc.io`
2. **CORS not configured** - backend may not allow requests from the production domain

## Complete Fix

### Step 1: Fix Frontend API URL

```bash
cd /opt/hotel/Front-end

# Create production environment file
cat > .env.production << EOF
VITE_API_BASE_URL=https://hotel.nntc.io
EOF

# Verify it was created
cat .env.production

# Rebuild frontend (IMPORTANT: this bakes the URL into the build)
pnpm build

# Verify the build contains the correct URL
grep -r "hotel.nntc.io" dist/spa/ | head -3
```

### Step 2: Fix Backend CORS Configuration

```bash
cd /opt/hotel/Back-end

# Check if .env file exists
ls -la .env

# Add/Update CORS settings in .env file
# If .env doesn't exist, create it:
cat >> .env << EOF

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io
CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io
ALLOWED_HOSTS=hotel.nntc.io,www.hotel.nntc.io,localhost,127.0.0.1
EOF

# If .env exists, edit it manually:
# sudo nano .env
# Add the lines above

# Restart Django backend
sudo systemctl restart hotel-backend

# Check if it's running
sudo systemctl status hotel-backend
```

### Step 3: Reload Nginx

```bash
# Reload nginx to serve the new frontend build
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

### Step 4: Verify Everything Works

1. **Check backend is running:**
   ```bash
   curl http://localhost:6000/api/accommodations/ | head -20
   ```

2. **Check CORS headers:**
   ```bash
   curl -I -H "Origin: https://hotel.nntc.io" http://localhost:6000/api/accommodations/
   ```
   Should see `Access-Control-Allow-Origin: https://hotel.nntc.io`

3. **Check frontend build:**
   ```bash
   cd /opt/hotel/Front-end
   grep -o "hotel.nntc.io" dist/spa/assets/*.js | head -1
   ```
   Should find the URL in the built files

4. **Clear browser cache and test:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Check that API calls go to `https://hotel.nntc.io` not `localhost:6000`

## Quick One-Liner Fix

If you want to fix everything at once:

```bash
# Frontend
cd /opt/hotel/Front-end && \
echo "VITE_API_BASE_URL=https://hotel.nntc.io" > .env.production && \
pnpm build

# Backend - Add to .env (adjust path if needed)
cd /opt/hotel/Back-end && \
echo "" >> .env && \
echo "CORS_ALLOWED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io" >> .env && \
echo "CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io" >> .env && \
echo "ALLOWED_HOSTS=hotel.nntc.io,www.hotel.nntc.io,localhost,127.0.0.1" >> .env

# Restart services
sudo systemctl restart hotel-backend && \
sudo systemctl reload nginx
```

## Troubleshooting

### If API calls still fail:

1. **Check backend logs:**
   ```bash
   sudo journalctl -u hotel-backend -n 50 --no-pager
   ```

2. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Test API directly:**
   ```bash
   curl https://hotel.nntc.io/api/accommodations/
   ```

4. **Check environment variables are loaded:**
   ```bash
   cd /opt/hotel/Back-end
   python manage.py shell -c "from django.conf import settings; print(settings.CORS_ALLOWED_ORIGINS)"
   ```

### If CORS errors persist:

Make sure the `.env` file in Back-end has the correct values and Django was restarted:

```bash
cd /opt/hotel/Back-end
cat .env | grep CORS
sudo systemctl restart hotel-backend
```

## Why This Happens

1. **Vite environment variables** are baked into the build at **build time**
   - If you build without `.env.production`, it uses the default `localhost:6000`
   - You MUST rebuild after changing `.env.production`

2. **Django CORS** needs to explicitly allow your frontend domain
   - Default is only localhost for security
   - Production domain must be added to `CORS_ALLOWED_ORIGINS`

## Prevention

Always set environment variables **before building**:

```bash
# Frontend - ALWAYS set before building
cd /opt/hotel/Front-end
echo "VITE_API_BASE_URL=https://hotel.nntc.io" > .env.production
pnpm build

# Backend - Set in .env before starting
cd /opt/hotel/Back-end
# Edit .env with correct CORS settings
sudo systemctl restart hotel-backend
```

