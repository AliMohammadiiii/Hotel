# Fix Front-end Build Directory Permissions Error

If you encounter a `EACCES: permission denied, rmdir` error when running `pnpm build`, it means the build process doesn't have write permissions to the `dist` directory.

## Quick Fix

Run the provided script on your production server:

```bash
sudo bash /opt/hotel/Front-end/fix_build_permissions.sh
```

## Manual Fix

If you prefer to fix it manually:

```bash
# 1. Remove the problematic dist directory (if it exists)
sudo rm -rf /opt/hotel/Front-end/dist

# 2. Recreate it with correct permissions
sudo mkdir -p /opt/hotel/Front-end/dist

# 3. Set ownership to the ubuntu user
sudo chown -R ubuntu:ubuntu /opt/hotel/Front-end/dist

# 4. Set permissions
sudo chmod -R 755 /opt/hotel/Front-end/dist

# 5. Now you can build
cd /opt/hotel/Front-end
pnpm build
```

## Alternative: Fix Without Removing

If you want to keep existing build files and just fix permissions:

```bash
# 1. Fix ownership
sudo chown -R ubuntu:ubuntu /opt/hotel/Front-end/dist

# 2. Fix directory permissions
sudo find /opt/hotel/Front-end/dist -type d -exec chmod 755 {} \;

# 3. Fix file permissions
sudo find /opt/hotel/Front-end/dist -type f -exec chmod 644 {} \;

# 4. Now try building again
cd /opt/hotel/Front-end
pnpm build
```

## Verify the Fix

After running the fix, verify permissions:

```bash
ls -la /opt/hotel/Front-end/dist
```

You should see:
- Owner: `ubuntu:ubuntu` (or your build user)
- Permissions: `755` for directories, `644` for files

## Troubleshooting

1. **Check what user you're running as:**
   ```bash
   whoami
   ```

2. **Check current permissions:**
   ```bash
   stat /opt/hotel/Front-end/dist
   ls -la /opt/hotel/Front-end/dist/spa/Font 2>/dev/null || echo "Directory doesn't exist"
   ```

3. **If the Font directory is causing issues specifically:**
   ```bash
   sudo rm -rf /opt/hotel/Front-end/dist/spa/Font
   sudo chown -R ubuntu:ubuntu /opt/hotel/Front-end/dist
   ```

4. **Ensure you have write access:**
   - The user running `pnpm build` needs write access to the dist directory
   - They should own it or have group write permissions

## Common Causes

- Files were created by a different user (e.g., root or another service)
- Directory was created with incorrect permissions
- Build process was interrupted, leaving locked files

