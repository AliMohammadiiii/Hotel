#!/bin/bash
# Script to fix media directory permissions for Hotel application
# Run this script with sudo on your production server

set -e

echo "Fixing media directory permissions..."

# Define paths
BASE_DIR="/opt/hotel/Back-end"
MEDIA_DIR="$BASE_DIR/media"
USER="hotel"
GROUP="www-data"

# Ensure media directory exists
echo "Creating media directory structure..."
mkdir -p "$MEDIA_DIR/accommodations/images"
mkdir -p "$MEDIA_DIR/amenities/icons"

# Set ownership
echo "Setting ownership to $USER:$GROUP..."
sudo chown -R $USER:$GROUP "$MEDIA_DIR"

# Set permissions (755 for directories, 644 for files if any exist)
echo "Setting permissions..."
sudo chmod -R 755 "$MEDIA_DIR"

# If running with gunicorn/systemd, ensure the service user has access
# Check what user runs the Django process
PROCESS_USER=$(ps aux | grep -E '[g]unicorn|[w]sgi' | awk '{print $1}' | head -n 1)
if [ ! -z "$PROCESS_USER" ]; then
    echo "Detected Django process running as: $PROCESS_USER"
    echo "Adding $PROCESS_USER to group $GROUP..."
    sudo usermod -a -G $GROUP $PROCESS_USER || echo "Note: Could not add user to group (may need manual setup)"
fi

echo "Permissions fixed successfully!"
echo ""
echo "Directory: $MEDIA_DIR"
echo "Owner: $(stat -c '%U:%G' $MEDIA_DIR)"
echo "Permissions: $(stat -c '%a' $MEDIA_DIR)"
echo ""
echo "If you're using gunicorn/systemd, you may need to:"
echo "1. Ensure the service user is in the $GROUP group"
echo "2. Restart the Django service: sudo systemctl restart hotel-backend"



