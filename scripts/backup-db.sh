#!/bin/bash

# Free Database Backup Script for Splitfact
# Runs daily via cron, stores locally with rotation

set -e

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_NAME="splitfact"
KEEP_DAYS=7  # Keep 7 days of backups (free storage)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup filename
BACKUP_FILE="$BACKUP_DIR/splitfact_backup_$DATE.sql"

echo "🚀 Starting Splitfact database backup..."
echo "📅 Date: $(date)"
echo "📁 Backup file: $BACKUP_FILE"

# Create database dump (works with local PostgreSQL)
if command -v pg_dump &> /dev/null; then
    echo "📊 Creating PostgreSQL dump..."
    pg_dump $DATABASE_URL --clean --create > $BACKUP_FILE
    
    # Compress to save space
    gzip $BACKUP_FILE
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "📏 Backup size: $(du -h $BACKUP_FILE | cut -f1)"
    
    # Cleanup old backups (keep only last 7 days)
    echo "🧹 Cleaning up old backups..."
    find $BACKUP_DIR -name "splitfact_backup_*.sql.gz" -mtime +$KEEP_DAYS -delete
    
    echo "📊 Current backups:"
    ls -lh $BACKUP_DIR/splitfact_backup_*.sql.gz 2>/dev/null || echo "No previous backups found"
    
    echo "✅ Backup completed successfully!"
    
else
    echo "❌ Error: pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi