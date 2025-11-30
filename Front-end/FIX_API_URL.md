# Fix API URL Configuration Issue

## Problem
The frontend is trying to connect to `localhost:6000` instead of `https://hotel.nntc.io`, causing network errors.

## Quick Fix

Run these commands on your server:

```bash
cd /opt/hotel/Front-end

# 1. Create/Update the production environment file
cat > .env.production << EOF
VITE_API_BASE_URL=https://hotel.nntc.io
EOF

# 2. Verify the file was created correctly
cat .env.production

# 3. Rebuild the frontend (this bakes the API URL into the build)
pnpm build

# 4. Restart nginx to serve the new build
sudo systemctl reload nginx
```

## Verify It's Fixed

1. Check the built files contain the correct URL:
   ```bash
   grep -r "hotel.nntc.io" dist/spa/ | head -5
   ```

2. Clear your browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

3. Check the browser console - API calls should now go to `https://hotel.nntc.io` instead of `localhost:6000`

## Why This Happens

Vite environment variables are **baked into the build at build time**. If you build without `.env.production`, it defaults to `localhost:6000`. You must:
1. Create `.env.production` with the correct API URL
2. Rebuild the frontend
3. The new build will have the correct API URL hardcoded

## Alternative: Check Current Build

If you want to see what URL the current build is using:

```bash
cd /opt/hotel/Front-end
grep -r "localhost:6000" dist/spa/ | head -3
```

If you see `localhost:6000` in the output, you need to rebuild with the correct `.env.production` file.

