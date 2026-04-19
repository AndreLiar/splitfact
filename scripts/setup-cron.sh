#!/bin/bash

# Setup free automated backups using cron
# Run this once to set up daily backups at 3 AM

echo "🚀 Setting up automated database backups..."

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Make backup script executable
chmod +x "$SCRIPT_DIR/backup-db.sh"
chmod +x "$SCRIPT_DIR/restore-db.sh"

# Create cron job entry
CRON_JOB="0 3 * * * cd $PROJECT_DIR && ./scripts/backup-db.sh >> ./logs/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
    echo "⚠️  Cron job already exists. Current crontab:"
    crontab -l | grep "backup-db.sh"
else
    # Add cron job
    echo "📅 Adding daily backup cron job (3 AM)..."
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added successfully!"
fi

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

echo ""
echo "📋 Setup completed!"
echo "📅 Daily backups will run at 3:00 AM"
echo "📁 Backups stored in: $PROJECT_DIR/backups"
echo "📝 Logs stored in: $PROJECT_DIR/logs/backup.log"
echo ""
echo "🔧 Useful commands:"
echo "  View cron jobs: crontab -l"
echo "  View backup logs: tail -f ./logs/backup.log"
echo "  Manual backup: ./scripts/backup-db.sh"
echo "  Restore backup: ./scripts/restore-db.sh [backup_file]"