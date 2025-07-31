#!/bin/bash

# Free Database Restore Script for Splitfact
# Usage: ./restore-db.sh [backup_file]

set -e

BACKUP_DIR="./backups"

# Check if backup file provided
if [ $# -eq 0 ]; then
    echo "📋 Available backups:"
    ls -lht $BACKUP_DIR/splitfact_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: ./restore-db.sh <backup_file>"
    echo "Example: ./restore-db.sh $BACKUP_DIR/splitfact_backup_20250130_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file '$BACKUP_FILE' not found"
    exit 1
fi

echo "🚀 Starting Splitfact database restore..."
echo "📅 Date: $(date)"
echo "📁 Backup file: $BACKUP_FILE"

# Confirm restore action
read -p "⚠️  This will replace your current database. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Extract if compressed
if [[ $BACKUP_FILE =~ \.gz$ ]]; then
    echo "📦 Extracting compressed backup..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
    CLEANUP_TEMP=true
else
    CLEANUP_TEMP=false
fi

# Restore database
echo "🔄 Restoring database..."
if command -v psql &> /dev/null; then
    psql $DATABASE_URL < "$BACKUP_FILE"
    echo "✅ Database restored successfully!"
    
    # Cleanup temp file if created
    if [ "$CLEANUP_TEMP" = true ]; then
        rm "$TEMP_FILE"
    fi
    
    echo "🔄 Running Prisma migrations to ensure schema consistency..."
    npm run prisma:deploy 2>/dev/null || npx prisma db push
    
    echo "✅ Restore completed successfully!"
    
else
    echo "❌ Error: psql not found. Please install PostgreSQL client tools."
    exit 1
fi