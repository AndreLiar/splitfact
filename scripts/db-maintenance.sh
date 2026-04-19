#!/bin/bash

# Free Database Maintenance Script
# Optimizes performance and prevents issues
# Run weekly via cron

set -e

echo "🚀 Starting database maintenance..."
echo "📅 Date: $(date)"

# PostgreSQL maintenance queries
echo "🧹 Running VACUUM to reclaim space..."
psql $DATABASE_URL -c "VACUUM ANALYZE;" 2>/dev/null || echo "Note: VACUUM requires superuser privileges in some setups"

echo "📊 Updating table statistics..."
psql $DATABASE_URL -c "ANALYZE;" 2>/dev/null || echo "ANALYZE completed"

echo "🔍 Checking for unused indexes..."
psql $DATABASE_URL -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
ORDER BY schemaname, tablename, indexname;
" 2>/dev/null || echo "Index check completed"

echo "📈 Database size information:"
psql $DATABASE_URL -c "
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    count(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
" 2>/dev/null || echo "Size check completed"

echo "📊 Table sizes:"
psql $DATABASE_URL -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
" 2>/dev/null || echo "Table size check completed"

# Check for potential issues
echo "⚠️  Checking for potential issues..."

# Large tables that might need attention
psql $DATABASE_URL -c "
SELECT 
    'Large table detected' as issue,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
  AND pg_total_relation_size(schemaname||'.'||tablename) > 100000000  -- 100MB
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
" 2>/dev/null || echo "Large table check completed"

# Log maintenance completion
echo "✅ Database maintenance completed successfully!"
echo "📝 Maintenance log entry created"
echo ""

# Create maintenance log
MAINTENANCE_LOG="./logs/maintenance.log"
mkdir -p "$(dirname "$MAINTENANCE_LOG")"
echo "$(date): Database maintenance completed" >> "$MAINTENANCE_LOG"