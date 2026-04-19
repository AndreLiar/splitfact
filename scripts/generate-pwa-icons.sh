#!/bin/bash

# PWA Icon Generator Script for Splitfact
# This script creates PWA icons in various sizes from the base favicon

BASE_ICON="../public/favicon.png"
ICONS_DIR="../public/icons"

# Icon sizes needed for PWA
SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons for Splitfact..."

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Copying base icon to all sizes (you should replace with proper icons later)"
    for size in "${SIZES[@]}"; do
        cp "$BASE_ICON" "$ICONS_DIR/icon-${size}x${size}.png"
        echo "Created icon-${size}x${size}.png (placeholder)"
    done
else
    echo "ImageMagick found. Generating properly sized icons..."
    for size in "${SIZES[@]}"; do
        convert "$BASE_ICON" -resize "${size}x${size}" "$ICONS_DIR/icon-${size}x${size}.png"
        echo "Generated icon-${size}x${size}.png"
    done
fi

# Create shortcut icons (placeholders)
cp "$BASE_ICON" "$ICONS_DIR/shortcut-invoice.png"
cp "$BASE_ICON" "$ICONS_DIR/shortcut-clients.png"
cp "$BASE_ICON" "$ICONS_DIR/shortcut-ai.png"
cp "$BASE_ICON" "$ICONS_DIR/shortcut-urssaf.png"

echo "PWA icons generated successfully!"
echo "Note: These are placeholder icons. Replace with properly designed icons for production."