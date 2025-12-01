# Next Steps: Django Admin Access

## Current Status ✅

Your tests show that **Nginx routing is working correctly**:
- `curl -I https://hotel.nntc.io/django-admin/` returns HTTP/2 302 redirect
- Redirect location: `/django-admin/login/?next=/django-admin/`
- This is the **correct behavior** - Django admin redirects unauthenticated users to login

## Immediate Next Steps

### Step 1: Test the Login Page HTML

Run these commands to verify the login page is returning HTML:

```bash
# Test login page HTML (follow redirects)
curl -L https://hotel.nntc.io/django-admin/ | head -30

# Or test login page directly
curl https://hotel.nntc.io/django-admin/login/ | head -30
```

**Expected:** Should see HTML with Django admin login form (contains `<form`, `<input`, username/password fields)

**If empty or error:** Check backend service status and logs.

### Step 2: Check Backend Service

```bash
# Check if backend is running
sudo systemctl status hotel-backend

# Check backend logs for errors
sudo journalctl -u hotel-backend -n 50 --no-pager
```

### Step 3: Test Direct Backend Access

```bash
# Follow redirects to see full response
curl -L http://127.0.0.1:6000/django-admin/ | head -30

# Test login page directly
curl http://127.0.0.1:6000/django-admin/login/ | head -30
```

### Step 4: Access in Browser

1. **Clear browser cache and cookies** for `hotel.nntc.io`
2. **Try incognito/private browsing mode**
3. Navigate to: `https://hotel.nntc.io/django-admin/`
4. **Expected:** Django admin login page with username and password fields

**If you still see 404:**
- Check browser console (F12) for errors
- Try accessing directly: `https://hotel.nntc.io/django-admin/login/`
- Check if frontend SPA is intercepting the route

### Step 5: Verify Django Admin Static Files

Django admin needs static files (CSS, JS) to display correctly:

```bash
# Check if static files are collected
ls -la /opt/hotel/Back-end/staticfiles/admin/

# Should see CSS and JS files
```

If missing, collect static files:
```bash
sudo su - hotel
cd /opt/hotel/Back-end
source ../venv/bin/activate
export $(cat .env | xargs)
python manage.py collectstatic --noinput
```

### Step 6: Check Nginx Static File Configuration

Verify Nginx is serving Django admin static files:

```bash
# Test static file access
curl -I https://hotel.nntc.io/static/admin/css/base.css

# Should return 200 OK
```

## Troubleshooting

### If Browser Shows 404 But Curl Shows 302

This means Nginx is working, but browser is seeing a 404. Possible causes:

1. **Browser Cache:** Clear cache and cookies
2. **Frontend SPA Interference:** Check browser console, see if frontend is catching route
3. **CDN/Proxy Cache:** You're behind ArvanCloud (based on headers). Check CDN cache:
   ```bash
   # Add cache-busting parameter
   https://hotel.nntc.io/django-admin/?nocache=1
   ```

### If Backend Curl Returns Empty

Check:
```bash
# Backend service status
sudo systemctl status hotel-backend

# Backend logs
sudo journalctl -u hotel-backend -n 50 --no-pager

# Check if port 6000 is listening
sudo netstat -tlnp | grep 6000
# or
sudo ss -tlnp | grep 6000
```

### If Login Page Loads But Looks Broken

1. **Static files not loading:**
   ```bash
   # Check static files
   ls -la /opt/hotel/Back-end/staticfiles/admin/
   
   # Recollect if needed
   cd /opt/hotel/Back-end
   source ../venv/bin/activate
   export $(cat .env | xargs)
   python manage.py collectstatic --noinput
   ```

2. **Nginx not serving static files correctly:**
   ```bash
   # Check Nginx static location
   sudo nginx -T | grep -A 5 "location /static/"
   ```

## Quick Diagnostic Commands

Run these to get a complete picture:

```bash
# 1. Backend service status
sudo systemctl status hotel-backend | head -10

# 2. Nginx routing test
curl -I https://hotel.nntc.io/django-admin/ 2>&1 | head -5

# 3. Login page HTML test
curl -L https://hotel.nntc.io/django-admin/ 2>&1 | head -20

# 4. Backend direct test
curl -L http://127.0.0.1:6000/django-admin/login/ 2>&1 | head -20

# 5. Static files test
curl -I https://hotel.nntc.io/static/admin/css/base.css 2>&1 | head -3

# 6. Recent backend errors
sudo journalctl -u hotel-backend -n 20 --no-pager | grep -i error
```

## Summary

Since you're getting a 302 redirect, the routing is correct. The next step is to:

1. ✅ Verify login page HTML is returned
2. ✅ Test in browser (clear cache first)
3. ✅ Ensure static files are collected and accessible
4. ✅ Check backend logs for any errors

If the login page HTML loads correctly but browser shows 404, it's likely a browser cache or CDN cache issue.



