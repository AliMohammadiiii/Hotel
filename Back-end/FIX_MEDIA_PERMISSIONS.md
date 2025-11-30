# Fix Media Directory Permissions Error

If you encounter a `Permission denied: [Errno 13]` error when uploading files, it means the Django application doesn't have write permissions to the media directory.

## Quick Fix

Run the provided script on your production server:

```bash
sudo bash /opt/hotel/Back-end/fix_media_permissions.sh
```

## Manual Fix

If you prefer to fix it manually:

```bash
# 1. Create the media directory structure
sudo mkdir -p /opt/hotel/Back-end/media/accommodations/images
sudo mkdir -p /opt/hotel/Back-end/media/amenities/icons

# 2. Set ownership (adjust USER and GROUP as needed)
sudo chown -R hotel:www-data /opt/hotel/Back-end/media

# 3. Set permissions
sudo chmod -R 755 /opt/hotel/Back-end/media

# 4. If using gunicorn/systemd, ensure the service user is in the www-data group
sudo usermod -a -G www-data <your-service-user>

# 5. Restart your Django service
sudo systemctl restart hotel-backend
```

## Verify the Fix

After running the fix, verify permissions:

```bash
ls -la /opt/hotel/Back-end/media
```

You should see:
- Owner: `hotel` (or your Django user)
- Group: `www-data` (or your web server group)
- Permissions: `755` for directories

## Troubleshooting

1. **Check what user runs your Django process:**
   ```bash
   ps aux | grep gunicorn
   ```

2. **Check current permissions:**
   ```bash
   stat /opt/hotel/Back-end/media
   ```

3. **Ensure the service user has write access:**
   - The user running Django/gunicorn needs write access to the media directory
   - They should either own it or be in the group that owns it

## Automatic Directory Creation

The Django settings now automatically create the media directory structure when the application starts. However, this doesn't fix existing permission issues - you still need to set correct permissions as shown above.

