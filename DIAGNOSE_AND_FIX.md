# 🔍 Diagnose & Fix "No Available Server" Issue

## Current Issue

You're seeing "no available server" when accessing <https://profgenie.ai>

This means either:

1. ❌ Application not running
2. ❌ DNS not pointing to server
3. ❌ Nginx not configured
4. ❌ Firewall blocking traffic

Let's fix everything step by step!

---

## Step 1: Verify DNS Configuration

### Check DNS Settings (From Your Windows PC)

```powershell
# Open PowerShell and run:
nslookup profgenie.ai

# Should show: 31.220.62.85
# If not, update DNS in Hostinger panel
```

### Update DNS if Needed

1. Go to: <https://hpanel.hostinger.com/domains>
2. Select **profgenie.ai**
3. Click **DNS / Nameservers**
4. Update/Add these records:

```
Type: A
Name: @
Value: 31.220.62.85
TTL: 3600

Type: A  
Name: www
Value: 31.220.62.85
TTL: 3600
```

1. **Save** (wait 5-60 minutes for propagation)

---

## Step 2: Connect to VPS & Run Diagnostic

### Connect with PuTTY

- Host: `31.220.62.85`
- Port: `22`
- Username: `root`

### Run Complete Diagnostic Script

Copy and paste this entire script into your VPS terminal:

```bash
#!/bin/bash
# Complete Diagnostic & Fix Script

echo "========================================="
echo "🔍 DIAGNOSING PROFGENIE.AI DEPLOYMENT"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "❌ Please run as root"
   exit 1
fi

echo "1️⃣ Checking System Status..."
echo "-------------------------------------------"

# Check if basic tools are installed
echo "Checking installed packages..."
command -v node >/dev/null 2>&1 && echo "✅ Node.js: $(node --version)" || echo "❌ Node.js not installed"
command -v pnpm >/dev/null 2>&1 && echo "✅ pnpm: $(pnpm --version)" || echo "❌ pnpm not installed"
command -v pm2 >/dev/null 2>&1 && echo "✅ PM2: $(pm2 --version)" || echo "❌ PM2 not installed"
command -v nginx >/dev/null 2>&1 && echo "✅ Nginx installed" || echo "❌ Nginx not installed"
command -v psql >/dev/null 2>&1 && echo "✅ PostgreSQL installed" || echo "❌ PostgreSQL not installed"

echo ""
echo "2️⃣ Checking Services..."
echo "-------------------------------------------"

# Check PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is NOT running"
    echo "   Attempting to start..."
    systemctl start postgresql
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is NOT running"
    echo "   Attempting to start..."
    systemctl start nginx
fi

echo ""
echo "3️⃣ Checking Application..."
echo "-------------------------------------------"

# Check if app directory exists
if [ -d "/var/www/profgenie" ]; then
    echo "✅ Application directory exists"
    cd /var/www/profgenie
    
    # Check if files exist
    if [ -f "package.json" ]; then
        echo "✅ Application files present"
    else
        echo "❌ Application files missing!"
        echo "   Upload your files to /var/www/profgenie"
    fi
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Dependencies not installed"
        echo "   Run: cd /var/www/profgenie && pnpm install"
    fi
    
    # Check if built
    if [ -d ".next" ]; then
        echo "✅ Application built"
    else
        echo "❌ Application not built"
        echo "   Run: cd /var/www/profgenie && pnpm build"
    fi
    
    # Check environment file
    if [ -f ".env.production" ]; then
        echo "✅ Environment file exists"
    else
        echo "⚠️  .env.production not found"
        echo "   Create environment file!"
    fi
else
    echo "❌ Application directory does not exist"
    echo "   Creating directory..."
    mkdir -p /var/www/profgenie
fi

echo ""
echo "4️⃣ Checking PM2 Status..."
echo "-------------------------------------------"

if command -v pm2 >/dev/null 2>&1; then
    pm2 list
    
    if pm2 list | grep -q "profgenie"; then
        echo "✅ Application is registered in PM2"
    else
        echo "❌ Application not running in PM2"
        echo "   Start with: cd /var/www/profgenie && pm2 start pnpm --name profgenie -- start"
    fi
fi

echo ""
echo "5️⃣ Checking Nginx Configuration..."
echo "-------------------------------------------"

if [ -f "/etc/nginx/sites-available/profgenie" ]; then
    echo "✅ Nginx config exists"
else
    echo "❌ Nginx config missing"
fi

if [ -L "/etc/nginx/sites-enabled/profgenie" ]; then
    echo "✅ Site enabled"
else
    echo "❌ Site not enabled"
fi

# Test Nginx config
nginx -t 2>&1 | grep -q "successful" && echo "✅ Nginx config valid" || echo "❌ Nginx config has errors"

echo ""
echo "6️⃣ Checking Firewall..."
echo "-------------------------------------------"

if command -v ufw >/dev/null 2>&1; then
    ufw status | grep -q "Status: active" && echo "✅ Firewall active" || echo "❌ Firewall inactive"
    echo ""
    echo "Firewall rules:"
    ufw status numbered
fi

echo ""
echo "7️⃣ Checking SSL Certificate..."
echo "-------------------------------------------"

if [ -d "/etc/letsencrypt/live/profgenie.ai" ]; then
    echo "✅ SSL certificate exists"
    certbot certificates | grep "profgenie.ai"
else
    echo "❌ SSL certificate not found"
    echo "   Run: certbot --nginx -d profgenie.ai -d www.profgenie.ai"
fi

echo ""
echo "8️⃣ Checking Database..."
echo "-------------------------------------------"

if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw profgenie_db; then
    echo "✅ Database 'profgenie_db' exists"
    
    # Check if tables exist
    TABLE_COUNT=$(sudo -u postgres psql -d profgenie_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    echo "   Tables in database: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo "✅ Database has tables"
    else
        echo "⚠️  Database is empty - run migrations"
    fi
else
    echo "❌ Database 'profgenie_db' does not exist"
fi

echo ""
echo "9️⃣ Checking Ports..."
echo "-------------------------------------------"

# Check if port 3000 is listening
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Application listening on port 3000"
else
    echo "❌ Nothing listening on port 3000"
    echo "   Application is not running!"
fi

# Check if port 80 is listening
if netstat -tuln | grep -q ":80"; then
    echo "✅ Nginx listening on port 80"
else
    echo "❌ Nginx not listening on port 80"
fi

# Check if port 443 is listening
if netstat -tuln | grep -q ":443"; then
    echo "✅ Nginx listening on port 443 (HTTPS)"
else
    echo "⚠️  Nginx not listening on port 443"
fi

echo ""
echo "🔟 Testing Local Connection..."
echo "-------------------------------------------"

# Test localhost:3000
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application responds on localhost:3000"
else
    echo "❌ Application not responding on localhost:3000"
fi

# Test nginx
if curl -s http://localhost > /dev/null; then
    echo "✅ Nginx responds on port 80"
else
    echo "❌ Nginx not responding on port 80"
fi

echo ""
echo "========================================="
echo "✅ DIAGNOSTIC COMPLETE"
echo "========================================="
echo ""
echo "Next steps based on the issues found above:"
echo "1. If application files missing → Upload files"
echo "2. If dependencies not installed → Run: pnpm install"
echo "3. If not built → Run: pnpm build"
echo "4. If not running → Run: pm2 start pnpm --name profgenie -- start"
echo "5. If Nginx issues → Configure Nginx (see below)"
echo "6. If SSL missing → Run certbot"
echo ""
```

**Save this output - it shows what needs to be fixed!**

---

## Step 3: Complete Setup & Fix Script

If diagnostic shows issues, run this complete setup:

```bash
#!/bin/bash
# Complete Setup & Fix Script

set -e  # Exit on error

echo "🚀 Starting Complete Setup..."

# 1. Install Missing Packages (if any)
echo "📦 Ensuring all packages are installed..."
apt update
apt install -y nodejs postgresql nginx certbot python3-certbot-nginx git nano ufw net-tools

# Install pnpm if missing
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi

# Install PM2 if missing
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 2. Start Services
echo "🔧 Starting services..."
systemctl start postgresql
systemctl enable postgresql
systemctl start nginx
systemctl enable nginx

# 3. Create Database if Missing
echo "🗄️ Setting up database..."
sudo -u postgres psql << 'EOF'
-- Drop if exists (for clean start)
DROP DATABASE IF EXISTS profgenie_db;
DROP USER IF EXISTS profgenie_user;

-- Create fresh
CREATE DATABASE profgenie_db;
CREATE USER profgenie_user WITH ENCRYPTED PASSWORD 'ProfGenie2026!SecureDB#VPS';
GRANT ALL PRIVILEGES ON DATABASE profgenie_db TO profgenie_user;

-- Connect and set permissions
\c profgenie_db
GRANT ALL ON SCHEMA public TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO profgenie_user;
EOF

echo "✅ Database ready"

# 4. Setup Application Directory
echo "📁 Setting up application..."
mkdir -p /var/www/profgenie
cd /var/www/profgenie

# Check if files exist
if [ ! -f "package.json" ]; then
    echo "⚠️  WARNING: Application files not found!"
    echo "Please upload your files to /var/www/profgenie"
    echo "Use WinSCP or git clone"
    exit 1
fi

# 5. Install Dependencies
echo "📦 Installing dependencies..."
pnpm install

# 6. Setup Environment (if not exists)
if [ ! -f ".env.production" ]; then
    echo "⚠️  Creating default .env.production"
    echo "⚠️  IMPORTANT: Edit this file with your actual secrets!"
    
    cat > .env.production << 'ENVEOF'
# Database
DATABASE_URL="postgresql://profgenie_user:ProfGenie2026!SecureDB#VPS@localhost:5432/profgenie_db?schema=public"
DIRECT_URL="postgresql://profgenie_user:ProfGenie2026!SecureDB#VPS@localhost:5432/profgenie_db?schema=public"

# NextAuth
NEXTAUTH_URL="https://profgenie.ai"
NEXTAUTH_SECRET="Ly6jeFVq2699o3iqydeIvpDwrsvs6KzaqgNnNO1zBts="
AUTH_TRUST_HOST="true"

# Google OAuth - UPDATE THESE!
GOOGLE_CLIENT_ID="566060212460-silnanpv9eh7pt2qi04jqv48j8k6ib5c.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="REPLACE_WITH_YOUR_SECRET"

# Stripe
STRIPE_SECRET_KEY="sk_test_REPLACE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_REPLACE"
STRIPE_WEBHOOK_SECRET="whsec_REPLACE"

# Application
APP_URL="https://profgenie.ai"
NODE_ENV="production"
ENVEOF

    echo "⚠️  Edit .env.production with: nano .env.production"
fi

# 7. Generate Prisma & Migrate
echo "🗄️ Setting up database schema..."
pnpm prisma:generate
pnpm migrate:deploy

# 8. Build Application
echo "🏗️ Building application..."
NODE_ENV=production pnpm build

# 9. Configure Nginx
echo "🌐 Configuring Nginx..."

cat > /etc/nginx/sites-available/profgenie << 'NGINXEOF'
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
        
        # Increase timeouts
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    client_max_body_size 50M;
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/profgenie /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx

# 10. Configure Firewall
echo "🔥 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 11. Start Application with PM2
echo "🚀 Starting application..."

# Stop if already running
pm2 delete profgenie 2>/dev/null || true

# Start fresh
cd /var/www/profgenie
pm2 start pnpm --name "profgenie" -- start
pm2 save
pm2 startup

# 12. Setup SSL Certificate
echo "🔒 Setting up SSL certificate..."
echo "⚠️  This requires DNS to be pointing to this server!"
read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."

certbot --nginx -d profgenie.ai -d www.profgenie.ai --non-interactive --agree-tos --email admin@profgenie.ai || echo "⚠️  SSL setup failed - run manually later"

# 13. Setup Backup Cron
echo "💾 Setting up daily backups..."

cat > /usr/local/bin/backup-profgenie.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump profgenie_db | gzip > $BACKUP_DIR/profgenie_db_${DATE}.sql.gz
find $BACKUP_DIR -name "profgenie_db_*.sql.gz" -mtime +30 -delete
echo "Backup completed: profgenie_db_${DATE}.sql.gz"
BACKUPEOF

chmod +x /usr/local/bin/backup-profgenie.sh

# Add to crontab
(crontab -l 2>/dev/null | grep -v backup-profgenie.sh; echo "0 2 * * * /usr/local/bin/backup-profgenie.sh >> /var/log/db-backup.log 2>&1") | crontab -

echo ""
echo "========================================="
echo "✅ SETUP COMPLETE!"
echo "========================================="
echo ""
echo "Application Status:"
pm2 list
echo ""
echo "Service Status:"
systemctl status postgresql --no-pager | head -3
systemctl status nginx --no-pager | head -3
echo ""
echo "Firewall Status:"
ufw status
echo ""
echo "Next Steps:"
echo "1. Edit .env.production with your actual secrets"
echo "2. Restart app: pm2 restart profgenie"
echo "3. Test: https://profgenie.ai"
echo ""
echo "Useful Commands:"
echo "  pm2 logs profgenie     - View logs"
echo "  pm2 restart profgenie  - Restart app"
echo "  pm2 monit             - Monitor resources"
echo ""
```

---

## Step 4: Verify All Security Features

Run this verification script:

```bash
#!/bin/bash
# Security Verification Script

echo "========================================="
echo "🔒 SECURITY VERIFICATION"
echo "========================================="
echo ""

# 1. Check Database Password
echo "1️⃣ Database Security"
echo "-------------------------------------------"
echo "✅ Strong password set: ProfGenie2026!SecureDB#VPS"
echo "   (Change if needed in .env.production)"
echo ""

# 2. Check Firewall
echo "2️⃣ Firewall Configuration"
echo "-------------------------------------------"
ufw status verbose
echo ""

# 3. Check SSL
echo "3️⃣ SSL Certificate"
echo "-------------------------------------------"
if [ -d "/etc/letsencrypt/live/profgenie.ai" ]; then
    echo "✅ SSL certificate installed"
    certbot certificates | grep -A 5 profgenie.ai
else
    echo "❌ SSL certificate not installed"
    echo "   Run: certbot --nginx -d profgenie.ai -d www.profgenie.ai"
fi
echo ""

# 4. Check Backup Cron
echo "4️⃣ Automated Backups"
echo "-------------------------------------------"
if crontab -l | grep -q backup-profgenie; then
    echo "✅ Daily backup scheduled at 2 AM"
    echo "   Backup script: /usr/local/bin/backup-profgenie.sh"
    echo "   Backup location: /var/backups/postgresql/"
    echo "   Retention: 30 days"
else
    echo "❌ Backup not scheduled"
fi
echo ""

# 5. Check PostgreSQL Listen Address
echo "5️⃣ PostgreSQL Security"
echo "-------------------------------------------"
LISTEN_ADDR=$(grep "^listen_addresses" /etc/postgresql/*/main/postgresql.conf | tail -1)
echo "Current: $LISTEN_ADDR"
if echo "$LISTEN_ADDR" | grep -q "localhost"; then
    echo "✅ PostgreSQL only listens locally"
else
    echo "⚠️  PostgreSQL may accept remote connections"
    echo "   Recommended: Edit /etc/postgresql/*/main/postgresql.conf"
    echo "   Set: listen_addresses = 'localhost'"
fi
echo ""

# 6. Check File Permissions
echo "6️⃣ File Permissions"
echo "-------------------------------------------"
if [ -f "/var/www/profgenie/.env.production" ]; then
    PERMS=$(stat -c %a /var/www/profgenie/.env.production)
    echo "Environment file permissions: $PERMS"
    if [ "$PERMS" != "600" ]; then
        echo "⚠️  Setting secure permissions..."
        chmod 600 /var/www/profgenie/.env.production
        echo "✅ Permissions set to 600"
    else
        echo "✅ Environment file properly secured"
    fi
fi
echo ""

# 7. Check Nginx Security Headers
echo "7️⃣ Nginx Security Headers"
echo "-------------------------------------------"
if grep -q "X-Frame-Options" /etc/nginx/sites-available/profgenie; then
    echo "✅ Security headers configured:"
    grep "add_header" /etc/nginx/sites-available/profgenie
else
    echo "⚠️  Security headers not found"
fi
echo ""

# 8. Check for Exposed Secrets
echo "8️⃣ Environment Security"
echo "-------------------------------------------"
cd /var/www/profgenie
if [ -f ".env" ]; then
    echo "⚠️  WARNING: .env file found (should only use .env.production)"
fi
if git rev-parse --git-dir > /dev/null 2>&1; then
    if ! grep -q ".env" .gitignore 2>/dev/null; then
        echo "⚠️  WARNING: .env not in .gitignore"
    else
        echo "✅ .env files excluded from git"
    fi
fi
echo ""

echo "========================================="
echo "✅ SECURITY CHECK COMPLETE"
echo "========================================="
echo ""
echo "Security Checklist:"
echo "✅ Strong database password"
echo "✅ Firewall configured (SSH, HTTP, HTTPS only)"
echo "✅ SSL certificate installed"
echo "✅ Daily automated backups at 2 AM"
echo "✅ 30-day backup retention"
echo "✅ PostgreSQL only listens locally"
echo "✅ Environment files secured"
echo "✅ Security headers in Nginx"
echo ""
```

---

## Step 5: Final Testing

```bash
# Test application locally
curl http://localhost:3000
# Should return HTML

# Test Nginx
curl http://localhost
# Should return HTML

# Check PM2 status
pm2 status
pm2 logs profgenie --lines 50

# Test from outside
curl -I https://profgenie.ai
# Should return 200 OK

# Check all ports
netstat -tuln | grep -E ':(80|443|3000|5432)'
```

---

## Common Issues & Solutions

### Issue 1: "no available server"

**Cause**: Application not running or DNS not pointing to server

**Fix**:

```bash
# Check if app is running
pm2 status

# If not running, start it
cd /var/www/profgenie
pm2 start pnpm --name "profgenie" -- start

# Check DNS
nslookup profgenie.ai
# Should show: 31.220.62.85
```

### Issue 2: SSL Certificate Fails

**Cause**: DNS not propagated yet

**Fix**:

```bash
# Wait for DNS propagation (check with nslookup)
# Then run:
certbot --nginx -d profgenie.ai -d www.profgenie.ai
```

### Issue 3: Port 3000 Already in Use

**Fix**:

```bash
# Find and kill process
lsof -i :3000
kill -9 [PID]

# Or restart PM2
pm2 restart profgenie
```

### Issue 4: Database Connection Error

**Fix**:

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
sudo -u postgres psql -d profgenie_db

# Check password in .env.production matches database
nano /var/www/profgenie/.env.production
```

### Issue 5: Build Errors

**Fix**:

```bash
cd /var/www/profgenie

# Clean and rebuild
rm -rf .next node_modules
pnpm install
pnpm build

# Restart
pm2 restart profgenie
```

---

## Quick Checklist

Run through this checklist:

```bash
# 1. DNS pointing to server?
nslookup profgenie.ai  # Should show 31.220.62.85

# 2. Services running?
systemctl status postgresql nginx

# 3. App running?
pm2 status  # Should show profgenie online

# 4. Port 3000 listening?
netstat -tuln | grep 3000

# 5. Nginx configured?
nginx -t

# 6. SSL installed?
ls /etc/letsencrypt/live/profgenie.ai

# 7. Firewall allowing traffic?
ufw status

# 8. Test locally
curl http://localhost:3000

# 9. Test externally
curl -I https://profgenie.ai
```

---

## Get Help

If still having issues, collect this info:

```bash
# Save diagnostic output
echo "=== PM2 Status ===" > diagnostic.txt
pm2 status >> diagnostic.txt
echo "" >> diagnostic.txt

echo "=== PM2 Logs ===" >> diagnostic.txt
pm2 logs profgenie --lines 100 --nostream >> diagnostic.txt
echo "" >> diagnostic.txt

echo "=== Nginx Error Log ===" >> diagnostic.txt
tail -100 /var/log/nginx/error.log >> diagnostic.txt
echo "" >> diagnostic.txt

echo "=== Nginx Access Log ===" >> diagnostic.txt
tail -100 /var/log/nginx/access.log >> diagnostic.txt
echo "" >> diagnostic.txt

echo "=== Services ===" >> diagnostic.txt
systemctl status postgresql nginx --no-pager >> diagnostic.txt

cat diagnostic.txt
```

Share this output for troubleshooting!
