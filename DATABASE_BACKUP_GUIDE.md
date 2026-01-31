# 📦 Database Backup Guide for Server Migration

## Quick Backup (Recommended for Migration)

### Method 1: Using Node.js Script (Easiest)

```powershell
# From project root
cd C:\Users\Allot\OneDrive\Desktop\profhelp-main

# Run backup script
node scripts/backup-database.js
```

**Output**: Creates `backups/database-backup-[timestamp].json`

### Method 2: Using pg_dump (Complete SQL Backup)

#### Option A: Install PostgreSQL Tools on Windows

1. Download PostgreSQL tools: <https://www.postgresql.org/download/windows/>
2. Install only the command-line tools
3. Run backup:

```powershell
cd C:\Users\Allot\OneDrive\Desktop\profhelp-main

# Create SQL backup
pg_dump "postgresql://neondb_owner:npg_vD5SIjQb4cTA@ep-wild-bird-aao97x8x-pooler.westus3.azure.neon.tech/neondb?sslmode=require" > backups/neon_backup.sql

# Create compressed backup (smaller file)
pg_dump "postgresql://neondb_owner:npg_vD5SIjQb4cTA@ep-wild-bird-aao97x8x-pooler.westus3.azure.neon.tech/neondb?sslmode=require" | gzip > backups/neon_backup.sql.gz
```

#### Option B: Using Prisma Studio (Manual Export)

```powershell
# Open Prisma Studio
npx prisma studio

# Then manually export data from each table
# This is slower but works without additional tools
```

## Backup Methods Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Node.js Script** | ✅ Easy<br>✅ No extra tools<br>✅ JSON format | ❌ Larger file size<br>❌ Slower for big DBs | Small to medium databases |
| **pg_dump** | ✅ Complete backup<br>✅ Compressed<br>✅ Fast<br>✅ Industry standard | ❌ Requires PostgreSQL tools | Production migrations |
| **Prisma Studio** | ✅ Visual<br>✅ No tools needed | ❌ Very slow<br>❌ Manual process | Emergency backup |

## Restoring Backup on New Server

### For JSON Backup (from Node.js script)

1. Copy backup file to new server:

```bash
# On new server
scp user@old-server:/path/to/backup.json /var/www/profgenie/backups/
```

1. Use restore script:

```bash
cd /var/www/profgenie
node scripts/restore-database.js backups/database-backup-[timestamp].json
```

### For SQL Backup (from pg_dump)

1. Copy backup file to new server:

```bash
scp backups/neon_backup.sql root@31.220.62.85:/var/www/profgenie/
```

1. Restore to PostgreSQL:

```bash
# On new server
sudo -u postgres psql -d profgenie_db < neon_backup.sql

# Or from compressed backup
gunzip -c neon_backup.sql.gz | sudo -u postgres psql -d profgenie_db
```

## Complete Migration Checklist

- [ ] **Step 1: Backup Current Database**
  - [ ] Run `node scripts/backup-database.js`
  - [ ] Or run `pg_dump` for SQL backup
  - [ ] Verify backup file created successfully
  - [ ] Check file size is reasonable

- [ ] **Step 2: Prepare New Server**
  - [ ] Install PostgreSQL on VPS
  - [ ] Create database and user
  - [ ] Configure firewall and security

- [ ] **Step 3: Transfer Files**
  - [ ] Upload backup file to new server
  - [ ] Upload application files
  - [ ] Copy environment variables

- [ ] **Step 4: Restore Database**
  - [ ] Run migrations on new database
  - [ ] Restore backup data
  - [ ] Verify all data present

- [ ] **Step 5: Test Application**
  - [ ] Test database connection
  - [ ] Login as admin
  - [ ] Check courses, users, presentations
  - [ ] Test AI features

- [ ] **Step 6: Switch DNS**
  - [ ] Point domain to new server
  - [ ] Setup SSL certificate
  - [ ] Monitor for issues

## Backup Locations

All backups are saved to:

```
C:\Users\Allot\OneDrive\Desktop\profhelp-main\backups\
```

Files:

- `database-backup-[timestamp].json` - JSON backup from Node.js script
- `neon_backup.sql` - SQL backup from pg_dump
- `neon_backup.sql.gz` - Compressed SQL backup

## Automating Backups

### Daily Backup Script (PowerShell)

Create `backup-daily.ps1`:

```powershell
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$backupDir = "C:\Users\Allot\OneDrive\Desktop\profhelp-main\backups"
$logFile = "$backupDir\backup-log.txt"

Write-Output "[$timestamp] Starting database backup..." | Tee-Object -FilePath $logFile -Append

node C:\Users\Allot\OneDrive\Desktop\profhelp-main\scripts\backup-database.js 2>&1 | Tee-Object -FilePath $logFile -Append

Write-Output "[$timestamp] Backup completed!" | Tee-Object -FilePath $logFile -Append
```

Schedule with Task Scheduler:

```powershell
# Run Task Scheduler
taskschd.msc

# Create new task:
# - Trigger: Daily at 2:00 AM
# - Action: powershell.exe -File "C:\...\backup-daily.ps1"
```

## Troubleshooting

### "pg_dump not found"

**Solution**: Install PostgreSQL tools or use Node.js backup script

### "Out of memory"

**Solution**: Use pg_dump instead of Node.js script for large databases

### "Connection timeout"

**Solution**: Check Neon database is accessible, firewall allows connection

### Backup file too large

**Solution**: Use compressed backup with gzip or split into chunks

## Security Notes

⚠️ **Important**: Backup files contain sensitive data!

- ✅ Store backups securely
- ✅ Encrypt backup files if transferring over internet
- ✅ Delete old backups after successful migration
- ✅ Never commit backups to Git
- ✅ Backups directory is in .gitignore

## Quick Commands Reference

```powershell
# JSON Backup
node scripts/backup-database.js

# SQL Backup (if pg_dump installed)
pg_dump "postgresql://neondb_owner:npg_vD5SIjQb4cTA@ep-wild-bird-aao97x8x-pooler.westus3.azure.neon.tech/neondb?sslmode=require" > backups/neon_backup.sql

# Check backup file
Get-ChildItem backups | Sort-Object LastWriteTime -Descending

# Copy to new server (from Windows)
scp backups/neon_backup.sql root@31.220.62.85:/var/www/profgenie/

# Restore on new server (run on VPS)
sudo -u postgres psql -d profgenie_db < neon_backup.sql
```

## Need Help?

1. Check backup file exists and is not empty
2. Verify database credentials are correct
3. Ensure network connection to Neon database
4. Check logs for specific error messages
5. Try alternative backup method if one fails
