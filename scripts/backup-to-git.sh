#!/bin/bash

# Free Git-based Schema Backup
# Backs up database schema and migrations to Git repository
# Useful for structure recovery (not data)

set -e

echo "🚀 Creating Git-based schema backup..."

# Create schema backup directory
mkdir -p ./backups/schema
mkdir -p ./backups/data-samples

# Export current database schema
echo "📊 Exporting database schema..."
pg_dump $DATABASE_URL --schema-only --clean > ./backups/schema/schema_$(date +%Y%m%d_%H%M%S).sql

# Export Prisma schema (always current)
cp ./prisma/schema.prisma ./backups/schema/prisma_schema_$(date +%Y%m%d_%H%M%S).prisma

# Create sample data (non-sensitive) for testing
echo "📝 Creating sample data backup..."
pg_dump $DATABASE_URL --data-only --table=public.collective --table=public.collective_member > ./backups/data-samples/sample_data_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo "Note: Sample tables not found (expected for new installations)"

# Add to git (if in git repository)
if [ -d .git ]; then
    echo "📚 Committing schema changes to Git..."
    git add ./backups/schema/ ./backups/data-samples/ 2>/dev/null || true
    git commit -m "📦 Schema backup - $(date)" 2>/dev/null || echo "No schema changes to commit"
    
    # Push to remote (optional - comment out if not needed)
    # git push origin main 2>/dev/null || echo "Could not push to remote (expected if no remote configured)"
else
    echo "⚠️  Not a Git repository - schema files saved locally only"
fi

# Cleanup old schema backups (keep last 10)
echo "🧹 Cleaning up old schema backups..."
ls -t ./backups/schema/schema_*.sql 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
ls -t ./backups/schema/prisma_schema_*.prisma 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "✅ Schema backup completed!"
echo "📁 Schema files: ./backups/schema/"
echo "📝 Sample data: ./backups/data-samples/"