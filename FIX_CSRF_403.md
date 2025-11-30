# Fix CSRF Verification Failed (403 Forbidden)

## Problem
Accessing Django admin shows:
```
Forbidden (403)
CSRF verification failed. Request aborted.
```

This happens when Django admin is accessed through a reverse proxy (Nginx) and CSRF protection doesn't recognize the trusted origin.

## Root Cause
1. `CSRF_TRUSTED_ORIGINS` doesn't include your domain
2. Django needs to trust the `X-Forwarded-Proto` and `X-Forwarded-Host` headers from Nginx
3. CSRF cookie settings may need adjustment for reverse proxy setup

## Solution

### Step 1: Update .env File

SSH into your server and edit the `.env` file:

```bash
sudo su - hotel
cd /opt/hotel/Back-end
nano .env
```

Add or update these lines:

```bash
# CSRF Trusted Origins (must include protocol and no trailing slash)
CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io,https://www.hotel.nntc.io,http://www.hotel.nntc.io

# Optional: If using a different port or subdomain, add those too
# CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io,https://www.hotel.nntc.io,http://www.hotel.nntc.io,http://localhost:8000
```

**Important:** 
- Must include `http://` or `https://` protocol
- NO trailing slash after domain
- Separate multiple origins with commas

### Step 2: Update Django Settings

We need to ensure Django trusts the forwarded headers from Nginx. Update your `settings.py`:

**File:** `/opt/hotel/Back-end/hotel_backend/settings.py`

Add this setting after the `CSRF_TRUSTED_ORIGINS` line (around line 163):

```python
# Trust X-Forwarded headers from reverse proxy (Nginx)
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

**However**, since you're behind ArvanCloud CDN, you might need to check what headers are being passed. Let's make a safer configuration that works in both scenarios.

### Step 3: Verify Nginx Headers

Check your Nginx configuration is passing the correct headers:

```bash
sudo nano /etc/nginx/sites-available/hotel
```

Ensure your `/django-admin` location block includes these headers:

```nginx
location ~ ^/django-admin(/.*)?$ {
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

**Key headers for CSRF:**
- `X-Forwarded-Proto`: Tells Django if request was HTTPS
- `X-Forwarded-Host`: Tells Django the original hostname
- `Host`: The current host header

### Step 4: Update Settings for Reverse Proxy

Since you're using a reverse proxy, we need to update Django settings. However, we should check what's already in your settings first. The settings might need these additions:

**If using HTTPS through CDN/reverse proxy:**

Add to `settings.py` (in the production security section, around line 221):

```python
# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Trust reverse proxy headers (if behind Nginx/CDN)
    USE_X_FORWARDED_HOST = config('USE_X_FORWARDED_HOST', default=True, cast=bool)
    USE_X_FORWARDED_PORT = config('USE_X_FORWARDED_PORT', default=True, cast=bool)
    
    # If your CDN/proxy sets X-Forwarded-Proto, use it
    # Otherwise, Django will infer from request.is_secure()
    SECURE_PROXY_SSL_HEADER = config(
        'SECURE_PROXY_SSL_HEADER',
        default=None
    )
    
    # If set, should be: ('HTTP_X_FORWARDED_PROTO', 'https')
    if SECURE_PROXY_SSL_HEADER:
        SECURE_PROXY_SSL_HEADER = tuple(SECURE_PROXY_SSL_HEADER.split(','))
    
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
```

**Simpler approach** - Add these settings after line 163:

```python
# Trust reverse proxy headers (needed when behind Nginx/CDN)
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
# Only set this if your proxy sets X-Forwarded-Proto header correctly
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

### Step 5: Restart Backend Service

After updating `.env` and settings:

```bash
# Exit from hotel user if you're in it
exit

# Restart the backend service
sudo systemctl restart hotel-backend

# Check status
sudo systemctl status hotel-backend
```

### Step 6: Verify CSRF Settings

Verify that the settings are loaded correctly:

```bash
sudo su - hotel
cd /opt/hotel/Back-end
source ../venv/bin/activate
export $(cat .env | xargs)
python manage.py shell
```

In the Django shell:

```python
from django.conf import settings

# Check CSRF trusted origins
print("CSRF_TRUSTED_ORIGINS:", settings.CSRF_TRUSTED_ORIGINS)

# Check forwarded headers settings
print("USE_X_FORWARDED_HOST:", getattr(settings, 'USE_X_FORWARDED_HOST', False))
print("USE_X_FORWARDED_PORT:", getattr(settings, 'USE_X_FORWARDED_PORT', False))

# Check CSRF cookie settings
print("CSRF_COOKIE_SECURE:", settings.CSRF_COOKIE_SECURE)
print("CSRF_COOKIE_SAMESITE:", getattr(settings, 'CSRF_COOKIE_SAMESITE', 'Lax'))
```

Exit the shell:
```python
exit()
```

### Step 7: Clear Browser Cookies

CSRF errors can be cached in browser cookies. Clear them:

1. **Clear cookies for `hotel.nntc.io`** in your browser
2. Or use **incognito/private browsing mode**
3. Try accessing `/django-admin/` again

## Quick Fix Script

Run this on your server to quickly fix the CSRF issue:

```bash
#!/bin/bash
# Fix CSRF 403 Error

echo "=== Fixing CSRF Configuration ==="

# Backup .env file
sudo su - hotel -c "cd /opt/hotel/Back-end && cp .env .env.backup.$(date +%Y%m%d_%H%M%S)"

# Add CSRF_TRUSTED_ORIGINS to .env if not present
sudo su - hotel -c "cd /opt/hotel/Back-end && \
  if ! grep -q '^CSRF_TRUSTED_ORIGINS=' .env; then
    echo '' >> .env
    echo '# CSRF Trusted Origins' >> .env
    echo 'CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io,https://www.hotel.nntc.io,http://www.hotel.nntc.io' >> .env
    echo 'Added CSRF_TRUSTED_ORIGINS to .env'
  else
    echo 'CSRF_TRUSTED_ORIGINS already exists in .env'
    echo 'Please manually update it to include: https://hotel.nntc.io,http://hotel.nntc.io'
  fi"

# Restart backend
echo "Restarting backend service..."
sudo systemctl restart hotel-backend

# Wait a moment
sleep 2

# Check status
echo "Checking backend status..."
sudo systemctl status hotel-backend --no-pager | head -5

echo ""
echo "=== Fix Complete ==="
echo "1. Please verify CSRF_TRUSTED_ORIGINS in .env file"
echo "2. Clear browser cookies for hotel.nntc.io"
echo "3. Try accessing https://hotel.nntc.io/django-admin/ again"
```

## Alternative: Temporarily Disable CSRF for Testing

**⚠️ WARNING: Only for testing, NOT for production!**

If you need to quickly test if CSRF is the issue, you can temporarily exempt the admin from CSRF (development only):

In `settings.py`, add this middleware configuration:

```python
# TEMPORARY: Only for testing CSRF issue
CSRF_COOKIE_HTTPONLY = False  # Allow JS access (not recommended for production)

# Or completely disable CSRF for admin (NOT RECOMMENDED)
# Comment out CsrfViewMiddleware or add @csrf_exempt decorator
```

**Do NOT use this in production!** This is only to confirm CSRF is the issue.

## Verification Checklist

- [ ] `CSRF_TRUSTED_ORIGINS` includes `https://hotel.nntc.io` in `.env`
- [ ] `.env` file has correct format (protocol included, no trailing slash)
- [ ] Backend service restarted after changes
- [ ] Nginx passes `X-Forwarded-Proto` and `X-Forwarded-Host` headers
- [ ] `USE_X_FORWARDED_HOST = True` in settings (if using reverse proxy)
- [ ] Browser cookies cleared for the domain
- [ ] Can access login page without 403 error
- [ ] Can log in to Django admin successfully

## Common Issues

### Issue 1: Still Getting 403 After Adding to CSRF_TRUSTED_ORIGINS

**Possible causes:**
1. Backend not restarted - must restart after changing `.env`
2. Wrong format in `.env` - check for typos, missing protocol, or trailing slashes
3. CDN/Cache - Clear CDN cache if using one (ArvanCloud)
4. Browser cookies - Clear browser cookies and cache

**Solution:**
```bash
# Verify settings are loaded
sudo su - hotel -c "cd /opt/hotel/Back-end && source ../venv/bin/activate && export \$(cat .env | xargs) && python -c \"from django.conf import settings; print(settings.CSRF_TRUSTED_ORIGINS)\""

# Check backend logs for CSRF errors
sudo journalctl -u hotel-backend -n 50 | grep -i csrf
```

### Issue 2: Works in HTTP but Not HTTPS

**Cause:** `CSRF_COOKIE_SECURE = True` requires HTTPS, but cookies aren't being set correctly.

**Solution:**
1. Ensure `CSRF_TRUSTED_ORIGINS` includes both `http://` and `https://` versions
2. Check that `X-Forwarded-Proto` header is being passed correctly
3. Verify SSL certificate is valid

### Issue 3: CSRF Token Mismatch After Login

**Cause:** Session cookies not being shared between requests.

**Solution:**
```python
# In settings.py, ensure:
SESSION_COOKIE_SAMESITE = 'Lax'  # or 'None' if cross-origin
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = True  # for HTTPS
CSRF_COOKIE_SECURE = True
```

### Issue 4: Behind CDN (ArvanCloud)

If you're behind ArvanCloud or another CDN:

1. **CDN may be modifying headers** - Check what headers are actually reaching Django
2. **CDN cache** - Purge cache after making changes
3. **CDN SSL termination** - Ensure CDN is passing `X-Forwarded-Proto: https`

To debug what headers Django is seeing, temporarily enable DEBUG and check the error page details, or add logging:

```python
# Temporary debug logging
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.middleware.csrf': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Testing

After fixing, test with:

```bash
# Test login page loads
curl -L https://hotel.nntc.io/django-admin/login/

# Should return HTML with login form (no 403 error)
```

Then test in browser:
1. Clear cookies
2. Go to `https://hotel.nntc.io/django-admin/`
3. Should see login page (no 403)
4. Try logging in

## Additional Notes

- CSRF protection is important for security - don't disable it permanently
- Always restart backend after changing `.env` file
- `CSRF_TRUSTED_ORIGINS` format is strict - must include protocol, no trailing slash
- When behind a reverse proxy, Django needs `USE_X_FORWARDED_HOST = True`
- If using HTTPS through CDN, ensure `X-Forwarded-Proto` header is set correctly

