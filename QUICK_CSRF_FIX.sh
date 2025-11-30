#!/bin/bash
# Quick CSRF Fix Script for Django Admin 403 Error
# Run this script on your server to fix CSRF verification failed error

echo "=== Fixing CSRF 403 Error ==="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo bash QUICK_CSRF_FIX.sh"
    exit 1
fi

# Backup .env file
ENV_FILE="/opt/hotel/Back-end/.env"
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo "✓ Backed up .env to: $BACKUP_FILE"
else
    echo "⚠ Warning: .env file not found at $ENV_FILE"
    echo "Creating new .env file..."
    touch "$ENV_FILE"
    chown hotel:hotel "$ENV_FILE"
fi

# Add or update CSRF_TRUSTED_ORIGINS
echo ""
echo "Updating CSRF_TRUSTED_ORIGINS in .env..."

# Remove existing CSRF_TRUSTED_ORIGINS line if present
sed -i '/^CSRF_TRUSTED_ORIGINS=/d' "$ENV_FILE"

# Add new CSRF_TRUSTED_ORIGINS
echo "" >> "$ENV_FILE"
echo "# CSRF Trusted Origins (added by fix script)" >> "$ENV_FILE"
echo "CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io,https://www.hotel.nntc.io,http://www.hotel.nntc.io" >> "$ENV_FILE"

echo "✓ Updated CSRF_TRUSTED_ORIGINS"

# Restart backend service
echo ""
echo "Restarting hotel-backend service..."
systemctl restart hotel-backend

# Wait a moment for service to start
sleep 2

# Check status
echo ""
echo "Checking service status..."
if systemctl is-active --quiet hotel-backend; then
    echo "✓ Backend service is running"
else
    echo "⚠ Warning: Backend service might not be running. Check with: sudo systemctl status hotel-backend"
fi

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Clear browser cookies for hotel.nntc.io"
echo "2. Try accessing: https://hotel.nntc.io/django-admin/"
echo "3. If still getting 403, check backend logs: sudo journalctl -u hotel-backend -n 50"
echo ""
echo "To verify CSRF settings were loaded:"
echo "  sudo su - hotel -c \"cd /opt/hotel/Back-end && source ../venv/bin/activate && export \\\$(cat .env | xargs) && python -c 'from django.conf import settings; print(\"CSRF_TRUSTED_ORIGINS:\", settings.CSRF_TRUSTED_ORIGINS)'\""
echo ""

