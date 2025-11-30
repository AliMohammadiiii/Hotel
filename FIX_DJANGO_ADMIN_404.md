# Fix Django Admin 404 Error

## Problem
Accessing `https://hotel.nntc.io/django-admin/` returns a 404 error in the browser. However, Nginx routing is working correctly (returns 302 redirect to login page).

**Status Update:** The curl test shows that Nginx routing is working correctly:
- `curl -I https://hotel.nntc.io/django-admin/` returns HTTP/2 302 redirect to `/django-admin/login/?next=/django-admin/`
- This means Django admin is responding correctly through Nginx

The issue is likely:
1. Browser showing a 404 page instead of following the redirect
2. The login page HTML not rendering correctly
3. Frontend SPA interfering with the redirect in browser (but not in curl)

## Root Cause
The Nginx location block for `/django-admin` is either:
1. Not configured correctly
2. In the wrong order (must come before `location /`)
3. Missing proper trailing slash handling

## Solution

### Step 1: Verify Current Nginx Configuration

SSH into your server and check the current Nginx configuration:

```bash
sudo nginx -T | grep -A 10 "location /django-admin"
```

### Step 2: Fix Nginx Configuration

Edit the Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/hotel
```

**Important:** The `/django-admin` location block must:
1. Come **BEFORE** the `location /` block
2. Handle both `/django-admin` and `/django-admin/` (with trailing slash)
3. Proxy to the backend with proper headers

Replace or update the `/django-admin` location block with this configuration:

```nginx
# Django admin - must be before location / to ensure it's matched first
location ~ ^/django-admin(/.*)?$ {
    proxy_pass http://hotel_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_redirect off;
    
    # Important for Django admin static files
    proxy_set_header SCRIPT_NAME /django-admin;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Alternative simpler approach** (if regex doesn't work):

```nginx
# Django admin - handle with and without trailing slash
location /django-admin {
    proxy_pass http://hotel_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_redirect off;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

location /django-admin/ {
    proxy_pass http://hotel_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_redirect off;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Step 3: Verify Location Block Order

The location blocks must be in this order (from most specific to least specific):

```nginx
# 1. Static files (most specific)
location /static/ {
    ...
}

# 2. Media files
location /media/ {
    ...
}

# 3. API endpoints
location /api/ {
    ...
}

# 4. Django admin (BEFORE location /)
location /django-admin {
    ...
}

location /django-admin/ {
    ...
}

# 5. Custom admin panel
location /admin {
    ...
}

# 6. Health check
location /health {
    ...
}

# 7. Frontend SPA (catch-all, must be LAST)
location / {
    ...
}
```

### Step 4: Test and Reload Nginx

1. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```
   Should output: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

2. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

### Step 5: Test Backend Directly

Test if Django admin is accessible directly from the backend:

```bash
# Test with full response (follow redirects)
curl -L http://127.0.0.1:6000/django-admin/

# Or test the login page directly
curl http://127.0.0.1:6000/django-admin/login/
```

**Note:** If direct backend curl returns empty, check if the backend service is running:
```bash
sudo systemctl status hotel-backend
```

If the backend is running but curl returns empty, check backend logs:
```bash
sudo journalctl -u hotel-backend -n 50
```

### Step 6: Verify Django URL Configuration

Verify that Django is configured correctly:

```bash
sudo su - hotel
cd /opt/hotel/Back-end
source ../venv/bin/activate
export $(cat .env | xargs)
python manage.py show_urls | grep admin
```

Should show: `django-admin/`

### Step 7: Check Nginx Error Logs

If it still doesn't work, check the error logs:

```bash
sudo tail -f /var/log/nginx/error.log
```

Then try accessing `/django-admin/` and watch for errors.

## Quick Fix Script

Run this script on your server to automatically fix the Nginx configuration:

```bash
#!/bin/bash
# Fix Django Admin 404 - Update Nginx Configuration

NGINX_CONFIG="/etc/nginx/sites-available/hotel"
BACKUP_FILE="/etc/nginx/sites-available/hotel.backup.$(date +%Y%m%d_%H%M%S)"

# Backup current config
sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Test if configuration needs updating
if ! sudo nginx -t 2>/dev/null; then
    echo "ERROR: Current Nginx configuration has errors. Please fix manually."
    exit 1
fi

echo "Configuration backup created. Please manually update the Nginx config as shown above."
echo "After updating, run: sudo nginx -t && sudo systemctl reload nginx"
```

## Verification Checklist

- [ ] Nginx configuration tested successfully (`sudo nginx -t`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)
- [ ] Backend is running (`sudo systemctl status hotel-backend`)
- [ ] Direct backend test works (`curl http://127.0.0.1:6000/django-admin/` returns HTML)
- [ ] Django URLs include `django-admin/`
- [ ] Location block order is correct (specific before general)
- [ ] No errors in Nginx error log
- [ ] Can access `https://hotel.nntc.io/django-admin/` in browser

## Common Issues

### Issue 1: Frontend SPA Catching Route
**Symptom:** You see "Oops! Page not found" page
**Solution:** Ensure `/django-admin` location block comes **before** `location /` block

### Issue 2: Trailing Slash Issues
**Symptom:** Works with trailing slash but not without (or vice versa)
**Solution:** Add both `location /django-admin` and `location /django-admin/` blocks, or use regex pattern

### Issue 3: Static Files Not Loading
**Symptom:** Admin page loads but CSS/JS files return 404
**Solution:** Ensure static files are collected and Nginx `/static/` location is configured correctly

### Issue 4: CSRF Token Errors
**Symptom:** Can access login page but can't log in
**Solution:** Check `CSRF_TRUSTED_ORIGINS` in `.env` includes `https://hotel.nntc.io`

### Issue 5: Browser Shows 404 But Curl Shows 302
**Symptom:** `curl -I` returns 302 redirect, but browser shows 404 page
**Solution:** 
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Check if frontend SPA is intercepting in browser (check browser console)
4. Try accessing `/django-admin/login/` directly in browser
5. Verify the login page HTML is returned: `curl -L https://hotel.nntc.io/django-admin/ | head -20`

### Issue 6: Empty Response from Backend
**Symptom:** Direct backend curl returns empty response
**Possible Causes:**
1. Backend service not fully started - check: `sudo systemctl status hotel-backend`
2. Backend crashed - check logs: `sudo journalctl -u hotel-backend -n 50`
3. Port 6000 not accessible - check: `sudo netstat -tlnp | grep 6000`
4. Need to follow redirects - use: `curl -L http://127.0.0.1:6000/django-admin/`

## Testing

### Test 1: Verify Nginx Routing (Should return 302)
```bash
curl -I https://hotel.nntc.io/django-admin/
```
**Expected:** HTTP/2 302 with `location: /django-admin/login/?next=/django-admin/`

### Test 2: Test Login Page HTML (Should return login form)
```bash
curl -L https://hotel.nntc.io/django-admin/
# Or directly
curl https://hotel.nntc.io/django-admin/login/
```
**Expected:** HTML content with Django admin login form

### Test 3: Test in Browser
1. Open `https://hotel.nntc.io/django-admin/` in a browser
2. **Expected:** Django admin login page with username/password fields
3. **If you see 404:** Check browser console for errors and ensure you're not being redirected to frontend SPA

### Test 4: Verify Backend is Responding
```bash
# Check backend service status
sudo systemctl status hotel-backend

# Test direct backend access (if allowed)
curl -L http://127.0.0.1:6000/django-admin/login/

# Check backend logs for errors
sudo journalctl -u hotel-backend -n 50 --no-pager
```

## Additional Notes

- Django admin is at `/django-admin/` (changed from `/admin/` to avoid conflict with custom admin)
- Custom admin panel is at `/admin`
- Both should work simultaneously with proper Nginx configuration
- Location block order is critical in Nginx - more specific matches come first

