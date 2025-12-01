#!/bin/bash
# Script to fix Front-end build directory permissions
# Run this script with sudo on your production server

set -e

echo "Fixing Front-end build directory permissions..."

# Define paths
BASE_DIR="/opt/hotel/Front-end"
DIST_DIR="$BASE_DIR/dist"
USER="ubuntu"
GROUP="ubuntu"

# Check if dist directory exists, if not create it
if [ ! -d "$DIST_DIR" ]; then
    echo "Creating dist directory..."
    mkdir -p "$DIST_DIR"
fi

# Set ownership
echo "Setting ownership to $USER:$GROUP..."
sudo chown -R $USER:$GROUP "$DIST_DIR"

# Set permissions (755 for directories, 644 for files)
echo "Setting permissions..."
sudo chmod -R 755 "$DIST_DIR"

# If there are files, set them to 644
if [ -d "$DIST_DIR" ]; then
    find "$DIST_DIR" -type f -exec sudo chmod 644 {} \;
    find "$DIST_DIR" -type d -exec sudo chmod 755 {} \;
fi

echo "Permissions fixed successfully!"
echo ""
echo "Directory: $DIST_DIR"
if [ -d "$DIST_DIR" ]; then
    echo "Owner: $(stat -c '%U:%G' $DIST_DIR)"
    echo "Permissions: $(stat -c '%a' $DIST_DIR)"
fi
echo ""
echo "You can now run: pnpm build"



