# 🚀 Complete Deployment: Transfer Database & Deploy to profgenie.ai

## Overview

This guide will:

1. ✅ Export your current Neon PostgreSQL database
2. ✅ Setup new PostgreSQL on VPS
3. ✅ Safely transfer all data
4. ✅ Deploy application with new database
5. ✅ Verify everything works

---

## Part 1: Export Current Database from Neon

### Option A: From Your Local Machine (Recommended)

```bash
# Install PostgreSQL client tools on Windows
# Download from: https://www.postgresql.org/download/windows/
# OR use WSL (Windows Subsystem for Linux)

# After installing pg_dump, run:
cd C:\Users\Allot\OneDrive\Desktop\profhelp-main

# Export current database
pg_dump "postgresql://neondb_owner:npg_vD5SIjQb4cTA@ep-wild-bird-aao97x8x-pooler.westus3.azure.neon.tech/neondb?sslmode=require" > neon_backup.sql

# This creates neon_backup.sql with all your data
```

### Option B: Using Node.js Script (Easier)

Create this script to export data:

```bash
# Save this as export-neon-data.js
const { exec } = require('child_process');
const fs = require('fs');

const connectionString = "postgresql://neondb_owner:npg_vD5SIjQb4cTA@ep-wild-bird-aao97x8x-pooler.westus3.azure.neon.tech/neondb?sslmode=require";

console.log('Connecting to Neon database...');

// Run pg_dump if available
exec(`pg_dump "${connectionString}" > neon_backup.sql`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    console.log('\nAlternatively, use Prisma to export data...');
    return;
  }
  console.log('✅ Database exported to neon_backup.sql');
});
```

### Option C: Using Prisma Studio (Manual but Safe)

```bash
# On your local machine
cd C:\Users\Allot\OneDrive\Desktop\profhelp-main

# Open Prisma Studio
npx prisma studio

# This opens a web interface where you can view all data
# Keep this open for reference during migration
```

---

## Part 2: Connect to VPS & Setup Everything

### 2.1 Connect to Your VPS

**Using PuTTY** (Download from <https://www.putty.org/>):

- Host: `31.220.62.85`
- Port: `22`
- Username: `root`
- Password: (from Hostinger)

### 2.2 Complete Server Setup Script

Once connected, run this **COMPLETE SCRIPT**:

```bash
#!/bin/bash
# Complete Professor GENIE Deployment Script
# Run this on your VPS after connecting

set -e  # Exit on any error

echo "========================================="
echo "🚀 Professor GENIE Deployment"
echo "========================================="

# 1. Update System
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install Essential Tools
echo "🔧 Installing essential tools..."
apt install -y curl wget git nano ufw unzip

# 3. Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js
node --version
npm --version

# 4. Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm
pnpm --version

# 5. Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# 6. Install PostgreSQL 15
echo "🗄️ Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

echo "✅ PostgreSQL installed and running"

# 7. Create Database and User
echo "🗄️ Creating database and user..."
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE profgenie_db;

-- Create user with strong password
CREATE USER profgenie_user WITH ENCRYPTED PASSWORD 'ProfGenie2026!SecureDB#VPS';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE profgenie_db TO profgenie_user;

-- Connect to database and grant schema privileges
\c profgenie_db

GRANT ALL ON SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO profgenie_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO profgenie_user;

-- Exit
\q
EOF

echo "✅ Database 'profgenie_db' created successfully"

# 8. Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 9. Install Certbot
echo "🔒 Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx

# 10. Configure Firewall
echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ Firewall configured"

# 11. Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/profgenie
cd /var/www/profgenie

echo ""
echo "========================================="
echo "✅ Server Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Upload your application files to /var/www/profgenie"
echo "2. Upload your database backup (neon_backup.sql)"
echo "3. Run the import script"
echo ""
echo "Current directory: $(pwd)"
echo "PostgreSQL Status: $(systemctl is-active postgresql)"
echo "Nginx Status: $(systemctl is-active nginx)"
echo ""
```

**Copy this entire script and paste it into PuTTY terminal, then press Enter.**

---

## Part 3: Upload Application Files & Database Backup

### 3.1 Using WinSCP (Recommended)

1. **Download WinSCP**: <https://winscp.net/>
2. **Connect**:
   - Host: `31.220.62.85`
   - Port: `22`
   - Username: `root`
   - Password: (from Hostinger)
3. **Upload**:
   - Navigate to: `/var/www/profgenie`
   - Upload ALL files from: `C:\Users\Allot\OneDrive\Desktop\profhelp-main`
   - Also upload: `neon_backup.sql` (if you created it)

### 3.2 Using Git (Alternative)

```bash
# On VPS, in /var/www/profgenie
cd /var/www/profgenie

# If you have GitHub repository
git clone YOUR_GITHUB_REPO_URL .

# Or initialize and push from local machine first
```

---

## Part 4: Import Database Data

### 4.1 If You Have neon_backup.sql

```bash
# On VPS
cd /var/www/profgenie

# Import the backup
sudo -u postgres psql -d profgenie_db < neon_backup.sql

echo "✅ Database imported successfully"

# Verify import
sudo -u postgres psql -d profgenie_db -c "\dt"
sudo -u postgres psql -d profgenie_db -c "SELECT COUNT(*) FROM \"User\";"
```

### 4.2 If Using Prisma Migrate (Alternative - Clean Start)

```bash
# On VPS
cd /var/www/profgenie

# Create environment file first (see Part 5)
# Then run migrations
pnpm prisma:generate
pnpm migrate:deploy

echo "✅ Database schema created"
```

### 4.3 Manual Data Transfer Using Prisma (If No Backup File)

Create this script locally and run it:

```javascript
// save as migrate-data.js on local machine
const { PrismaClient: OldPrisma } = require('@prisma/client');
const { PrismaClient: NewPrisma } = require('@prisma/client');

// Old Neon database
const oldDb = new OldPrisma({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_vD5SIjQb4cTA@ep-wild-bird-aao97x8x-pooler.westus3.azure.neon.tech/neondb?sslmode=require"
    }
  }
});

// New VPS database
const newDb = new NewPrisma({
  datasources: {
    db: {
      url: "postgresql://profgenie_user:ProfGenie2026!SecureDB#VPS@31.220.62.85:5432/profgenie_db"
    }
  }
});

async function migrateData() {
  try {
    console.log('🔄 Starting data migration...');
    
    // Get all users
    const users = await oldDb.user.findMany();
    console.log(`Found ${users.length} users`);
    
    // Copy users
    for (const user of users) {
      await newDb.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    
    console.log('✅ Users migrated');
    
    // Repeat for other tables: courses, assignments, etc.
    // Add more tables as needed
    
    console.log('✅ Data migration complete!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrateData();
```

---

## Part 5: Configure Environment & Deploy

### 5.1 Create Production Environment File

```bash
# On VPS
cd /var/www/profgenie

# Create environment file
nano .env.production
```

**Paste this configuration** (update the secrets!):

```bash
# Database (Local VPS PostgreSQL)
DATABASE_URL="postgresql://profgenie_user:ProfGenie2026!SecureDB#VPS@localhost:5432/profgenie_db?schema=public"
DIRECT_URL="postgresql://profgenie_user:ProfGenie2026!SecureDB#VPS@localhost:5432/profgenie_db?schema=public"

# NextAuth
NEXTAUTH_URL="https://profgenie.ai"
NEXTAUTH_SECRET="Ly6jeFVq2699o3iqydeIvpDwrsvs6KzaqgNnNO1zBts="
AUTH_TRUST_HOST="true"

# Google OAuth - UPDATE THESE!
GOOGLE_CLIENT_ID="566060212460-silnanpv9eh7pt2qi04jqv48j8k6ib5c.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_NEW_SECRET_FROM_GOOGLE_CLOUD"

# Stripe (Start with test, switch to live later)
STRIPE_SECRET_KEY="sk_test_YOUR_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET"

# Stripe Price IDs (after creating products)
STRIPE_PRICE_BASIC="price_YOUR_BASIC_ID"
STRIPE_PRICE_PREMIUM="price_YOUR_PREMIUM_ID"
STRIPE_PRICE_ENTERPRISE="price_YOUR_ENTERPRISE_ID"

# Application
APP_URL="https://profgenie.ai"
NODE_ENV="production"

# AI Providers (Optional)
OPENAI_API_KEY="sk-proj-YOUR_KEY"
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY"
```

**Save**: `Ctrl+X`, `Y`, `Enter`

### 5.2 Install Dependencies & Build

```bash
cd /var/www/profgenie

# Set NODE_ENV
export NODE_ENV=production

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
pnpm prisma:generate

# Run migrations (if not imported backup)
echo "🗄️ Running database migrations..."
pnpm migrate:deploy

# Build application
echo "🏗️ Building application..."
pnpm build

echo "✅ Build complete!"
```

### 5.3 Create Admin User

```bash
cd /var/www/profgenie

# Run admin setup
node scripts/setup-admin.js

# Or make existing user admin
# node scripts/make-admin.js
```

---

## Part 6: Configure Nginx for profgenie.ai

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/profgenie
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name profgenie.ai www.profgenie.ai;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for AI processing
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Increase body size for file uploads
    client_max_body_size 50M;
}
```

**Save**: `Ctrl+X`, `Y`, `Enter`

```bash
# Enable site
ln -s /etc/nginx/sites-available/profgenie /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx

echo "✅ Nginx configured"
```

---

## Part 7: Start Application with PM2

```bash
cd /var/www/profgenie

# Start application
pm2 start pnpm --name "profgenie" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs

# Check status
pm2 status

# View logs
pm2 logs profgenie --lines 50
```

---

## Part 8: Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
certbot --nginx -d profgenie.ai -d www.profgenie.ai

# Follow prompts:
# 1. Enter your email
# 2. Agree to terms (Y)
# 3. Share email with EFF (optional)
# 4. Choose redirect HTTP to HTTPS (option 2)

echo "✅ SSL certificate installed"

# Test auto-renewal
certbot renew --dry-run
```

---

## Part 9: Verify Deployment

### 9.1 Check All Services

```bash
# Check PostgreSQL
systemctl status postgresql

# Check Nginx
systemctl status nginx

# Check application
pm2 status

# Check logs
pm2 logs profgenie --lines 100

# Test database connection
sudo -u postgres psql -d profgenie_db -c "SELECT COUNT(*) FROM \"User\";"
```

### 9.2 Test Website

1. **Open browser**: <https://profgenie.ai>
2. **Test login** with Google OAuth
3. **Check dashboard**
4. **Test AI features**
5. **Verify data** (courses, users, etc.)

---

## Part 10: Database Backup Setup

### 10.1 Create Backup Script

```bash
# Create backup script
nano /usr/local/bin/backup-profgenie-db.sh
```

**Paste this:**

```bash
#!/bin/bash
# Daily PostgreSQL Backup Script

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="profgenie_db"
DB_USER="profgenie_user"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup of $DB_NAME..."
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup completed: ${DB_NAME}_${DATE}.sql.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Delete old backups (older than RETENTION_DAYS)
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned (kept last $RETENTION_DAYS days)"

# List current backups
echo "Current backups:"
ls -lh $BACKUP_DIR
```

**Save**: `Ctrl+X`, `Y`, `Enter`

```bash
# Make executable
chmod +x /usr/local/bin/backup-profgenie-db.sh

# Test backup
/usr/local/bin/backup-profgenie-db.sh

# Setup daily cron job
crontab -e

# Add this line (daily backup at 2 AM):
0 2 * * * /usr/local/bin/backup-profgenie-db.sh >> /var/log/db-backup.log 2>&1
```

### 10.2 Manual Backup/Restore Commands

```bash
# Create backup
sudo -u postgres pg_dump profgenie_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip -c backup_20260130.sql.gz | sudo -u postgres psql profgenie_db

# Copy backup to local machine (from local machine):
scp root@31.220.62.85:/var/backups/postgresql/profgenie_db_*.sql.gz C:\Users\Allot\Desktop\
```

---

## Part 11: Security Hardening

```bash
# Update PostgreSQL to only listen locally
nano /etc/postgresql/15/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

# Restart PostgreSQL
systemctl restart postgresql

# Setup fail2ban for SSH protection
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Check firewall status
ufw status verbose

echo "✅ Security hardened"
```

---

## Part 12: Monitoring & Maintenance

### Useful Commands

```bash
# View application logs
pm2 logs profgenie

# Monitor resource usage
pm2 monit

# Restart application
pm2 restart profgenie

# Check disk space
df -h

# Check memory usage
free -h

# Check database size
sudo -u postgres psql -d profgenie_db -c "SELECT pg_size_pretty(pg_database_size('profgenie_db'));"

# View active connections
sudo -u postgres psql -d profgenie_db -c "SELECT count(*) FROM pg_stat_activity WHERE datname='profgenie_db';"

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🎉 Deployment Complete Checklist

- [ ] VPS setup complete
- [ ] PostgreSQL installed and configured
- [ ] Database migrated from Neon successfully
- [ ] Application files uploaded
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Application built successfully
- [ ] PM2 running application
- [ ] Nginx configured and running
- [ ] SSL certificate installed
- [ ] DNS pointing to VPS (profgenie.ai → 31.220.62.85)
- [ ] Website accessible via HTTPS
- [ ] Google OAuth configured for new domain
- [ ] Stripe webhooks configured
- [ ] Daily backups scheduled
- [ ] Security hardening applied
- [ ] Monitoring setup

---

## Quick Reference

**Server Details:**

- IP: `31.220.62.85`
- Domain: `profgenie.ai`
- Application: `/var/www/profgenie`
- Database: `profgenie_db` (user: `profgenie_user`)
- Process Manager: PM2
- Web Server: Nginx
- SSL: Let's Encrypt

**Important Commands:**

```bash
pm2 restart profgenie          # Restart app
pm2 logs profgenie             # View logs
systemctl restart nginx         # Restart web server
systemctl restart postgresql    # Restart database
```

---

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
sudo -u postgres psql -d profgenie_db

# Check user permissions
sudo -u postgres psql -c "\du"
```

### Application Won't Start

```bash
# Check logs
pm2 logs profgenie --lines 200

# Verify environment variables
cat /var/www/profgenie/.env.production

# Rebuild if needed
cd /var/www/profgenie
pnpm build
pm2 restart profgenie
```

### SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew --nginx

# Check Nginx configuration
nginx -t
```

**Need more help?** Check the logs first - they usually show the issue!
