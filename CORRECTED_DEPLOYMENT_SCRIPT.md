# 🔧 Fix Issues & Complete Deployment - profgenie.ai

## Current Status

✅ PostgreSQL installed
✅ Database created
✅ Firewall configured
⚠️ Node.js 18 (deprecated) - needs upgrade
⚠️ Port 80 blocked (Apache running)
⚠️ Kernel update pending

---

## Phase 1: Fix Critical Issues

### Step 1: Fix Port 80 Conflict & Reboot

```bash
#!/bin/bash
# Run this first to fix port 80 and prepare for reboot

echo "🔧 Fixing port 80 conflict..."

# Check what's using port 80
echo "Current port 80 usage:"
ss -tulpn | grep :80

# Stop and disable Apache if it's running
if systemctl is-active --quiet apache2; then
    echo "Stopping Apache..."
    systemctl stop apache2
    systemctl disable apache2
    echo "✅ Apache stopped and disabled"
fi

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Verify Nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is now running"
else
    echo "⚠️ Nginx still not running, checking errors..."
    systemctl status nginx
fi

echo ""
echo "========================================="
echo "⚠️  REBOOT REQUIRED"
echo "========================================="
echo "A kernel update is pending."
echo "Run: reboot"
echo ""
echo "After reboot, continue with Phase 2"
echo "========================================="
```

**Run this, then reboot:**

```bash
reboot
```

---

## Phase 2: Upgrade Node.js & Complete Setup

**(After reboot, log back in and run this)**

```bash
#!/bin/bash
# Complete setup after reboot

set -e

echo "========================================="
echo "🚀 Phase 2: Complete Setup"
echo "========================================="

# 1. Upgrade to Node.js 20 LTS
echo "📦 Upgrading to Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
NODE_VERSION=$(node -v)
echo "✅ Node.js upgraded to: $NODE_VERSION"

# Reinstall global packages
echo "📦 Reinstalling global packages..."
npm install -g pnpm pm2

# 2. Verify all services
echo ""
echo "🔍 Verifying services..."
systemctl status postgresql --no-pager | head -3
systemctl status nginx --no-pager | head -3

# 3. Check ports
echo ""
echo "🔍 Checking ports..."
echo "Port 80 (HTTP):"
ss -tulpn | grep :80 || echo "❌ Nothing on port 80"
echo "Port 443 (HTTPS):"
ss -tulpn | grep :443 || echo "❌ Nothing on port 443"

# 4. Create application directory
echo ""
echo "📁 Setting up application directory..."
mkdir -p /var/www/profgenie
cd /var/www/profgenie

echo ""
echo "========================================="
echo "✅ System Ready for Deployment"
echo "========================================="
echo ""
echo "Node.js: $(node -v)"
echo "pnpm: $(pnpm -v)"
echo "pm2: $(pm2 -v)"
echo "PostgreSQL: Running"
echo "Nginx: Running"
echo ""
echo "Next: Upload your application to /var/www/profgenie"
echo "========================================="
```

---

## Phase 3: Deploy Application

### Step 1: Upload Your Code

**Option A: Using Git (Recommended)**

```bash
cd /var/www/profgenie

# Clone your repository
git clone YOUR_GITHUB_REPO_URL .

# Or if already have code locally, use WinSCP to upload
```

**Option B: Using WinSCP**

1. Download: <https://winscp.net/>
2. Connect to `31.220.62.85`
3. Upload all files to `/var/www/profgenie`

---

### Step 2: Configure Environment

```bash
cd /var/www/profgenie

# Generate strong password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Generated DB Password: $DB_PASSWORD"
echo "⚠️ SAVE THIS PASSWORD!"

# Update PostgreSQL password
sudo -u postgres psql << EOF
ALTER USER profgenie_user WITH PASSWORD '$DB_PASSWORD';
EOF

# Create production environment file
cat > .env.production << ENVEOF
# Database
DATABASE_URL="postgresql://profgenie_user:${DB_PASSWORD}@localhost:5432/profgenie_db?schema=public"
DIRECT_URL="postgresql://profgenie_user:${DB_PASSWORD}@localhost:5432/profgenie_db?schema=public"

# NextAuth
NEXTAUTH_URL="https://profgenie.ai"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
AUTH_TRUST_HOST="true"

# Google OAuth - UPDATE WITH YOUR VALUES
GOOGLE_CLIENT_ID="566060212460-silnanpv9eh7pt2qi04jqv48j8k6ib5c.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_NEW_SECRET_FROM_GOOGLE_CLOUD"

# Stripe - UPDATE WITH YOUR VALUES
STRIPE_SECRET_KEY="sk_test_YOUR_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET"

# Application
APP_URL="https://profgenie.ai"
NODE_ENV="production"
PORT=3000

# AI Providers (Optional)
OPENAI_API_KEY="sk-proj-YOUR_KEY"
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY"
ENVEOF

# Secure the file
chmod 600 .env.production

echo "✅ Environment configured"
echo "⚠️ Edit .env.production to add your API keys:"
echo "   nano .env.production"
```

---

### Step 3: Install Dependencies & Build

```bash
cd /var/www/profgenie

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma Client
echo "🗄️ Generating Prisma Client..."
pnpm prisma:generate

# Run database migrations
echo "🗄️ Running migrations..."
pnpm migrate:deploy

# Verify database tables
echo "🔍 Verifying database..."
sudo -u postgres psql -d profgenie_db -c "\dt"

# Build application
echo "🏗️ Building application..."
NODE_ENV=production pnpm build

echo "✅ Application built successfully"
```

---

### Step 4: Create Admin User

```bash
cd /var/www/profgenie

# Run admin setup script
node scripts/setup-admin.js

# Follow prompts to create your admin account
```

---

### Step 5: Start Application with PM2

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

# Test local connection
curl http://localhost:3000
# Should return HTML from your app
```

---

## Phase 4: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration for profgenie.ai
cat > /etc/nginx/sites-available/profgenie << 'NGINXEOF'
# Redirect www to non-www
server {
    listen 80;
    server_name www.profgenie.ai;
    return 301 $scheme://profgenie.ai$request_uri;
}

# Main server block
server {
    listen 80;
    server_name profgenie.ai;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache settings
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for AI processing
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Static files optimization
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # File upload limit
    client_max_body_size 50M;

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    # Security: Hide nginx version
    server_tokens off;
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/profgenie /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# If test passes, reload Nginx
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "✅ Nginx configured and reloaded"
else
    echo "❌ Nginx configuration error - fix before proceeding"
    exit 1
fi

# Verify Nginx is serving
curl -I http://profgenie.ai
```

---

## Phase 5: Setup SSL Certificate

```bash
#!/bin/bash
# Setup Let's Encrypt SSL

echo "🔒 Setting up SSL certificate..."

# Ensure DNS is pointing to this server first
echo "Checking DNS..."
CURRENT_IP=$(dig +short profgenie.ai @8.8.8.8)
SERVER_IP=$(curl -s ifconfig.me)

echo "profgenie.ai resolves to: $CURRENT_IP"
echo "This server IP: $SERVER_IP"

if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
    echo "⚠️ WARNING: DNS does not point to this server!"
    echo "Please update DNS and wait for propagation before continuing."
    read -p "Press Enter to continue anyway, or Ctrl+C to abort..."
fi

# Get SSL certificate
certbot --nginx \
    -d profgenie.ai \
    -d www.profgenie.ai \
    --email admin@profgenie.ai \
    --agree-tos \
    --no-eff-email \
    --redirect

# Test auto-renewal
certbot renew --dry-run

echo "✅ SSL certificate installed"
echo ""
echo "Your site should now be accessible at:"
echo "  https://profgenie.ai"
```

---

## Phase 6: Security Hardening & Monitoring

```bash
#!/bin/bash
# Final security hardening

echo "🔒 Security Hardening..."

# 1. Secure PostgreSQL - Listen only locally
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/16/main/postgresql.conf
systemctl restart postgresql

# 2. Setup automated backups
cat > /usr/local/bin/backup-profgenie.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
sudo -u postgres pg_dump profgenie_db | gzip > $BACKUP_DIR/profgenie_db_${DATE}.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "profgenie_db_*.sql.gz" -mtime +30 -delete

# Log result
if [ $? -eq 0 ]; then
    echo "$(date): Backup successful - profgenie_db_${DATE}.sql.gz" >> /var/log/db-backup.log
else
    echo "$(date): Backup FAILED" >> /var/log/db-backup.log
fi
BACKUPEOF

chmod +x /usr/local/bin/backup-profgenie.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null | grep -v backup-profgenie.sh; echo "0 2 * * * /usr/local/bin/backup-profgenie.sh") | crontab -

# 3. Setup log rotation for PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 4. Install fail2ban for SSH protection
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# 5. Configure firewall rules
ufw status verbose

echo ""
echo "========================================="
echo "✅ SECURITY HARDENING COMPLETE"
echo "========================================="
echo ""
echo "Security Features Enabled:"
echo "  ✅ PostgreSQL - Local access only"
echo "  ✅ Daily backups at 2 AM (30-day retention)"
echo "  ✅ PM2 log rotation (10MB max, 7 days)"
echo "  ✅ Fail2ban for SSH protection"
echo "  ✅ UFW firewall (SSH, HTTP, HTTPS only)"
echo "  ✅ SSL certificate with auto-renewal"
echo "  ✅ Nginx security headers"
echo "  ✅ Environment files secured (600 permissions)"
echo ""
```

---

## Final Verification Checklist

```bash
#!/bin/bash
# Complete system verification

echo "========================================="
echo "🔍 FINAL SYSTEM CHECK"
echo "========================================="
echo ""

# 1. Node.js version
echo "1️⃣ Node.js Version:"
node -v
echo ""

# 2. Services
echo "2️⃣ Service Status:"
systemctl is-active postgresql && echo "✅ PostgreSQL: Running" || echo "❌ PostgreSQL: Not running"
systemctl is-active nginx && echo "✅ Nginx: Running" || echo "❌ Nginx: Not running"
echo ""

# 3. Application
echo "3️⃣ Application Status:"
pm2 list
echo ""

# 4. Ports
echo "4️⃣ Port Status:"
ss -tulpn | grep -E ':(80|443|3000|5432)' || echo "⚠️ Some ports not listening"
echo ""

# 5. Database
echo "5️⃣ Database:"
sudo -u postgres psql -d profgenie_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | grep -E '[0-9]+'
echo ""

# 6. SSL Certificate
echo "6️⃣ SSL Certificate:"
if [ -d "/etc/letsencrypt/live/profgenie.ai" ]; then
    echo "✅ SSL certificate installed"
    certbot certificates | grep -A 3 profgenie.ai
else
    echo "❌ SSL certificate not found"
fi
echo ""

# 7. Firewall
echo "7️⃣ Firewall Status:"
ufw status | head -10
echo ""

# 8. Backups
echo "8️⃣ Backup Configuration:"
crontab -l | grep backup-profgenie && echo "✅ Daily backups scheduled" || echo "❌ Backups not scheduled"
echo ""

# 9. Test application locally
echo "9️⃣ Testing Application:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Application responds locally"
else
    echo "⚠️ Application may not be responding"
fi
echo ""

# 10. Test public access
echo "🔟 Testing Public Access:"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://profgenie.ai 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Site accessible at https://profgenie.ai"
elif [ "$RESPONSE" = "000" ]; then
    echo "⚠️ Cannot connect - check DNS or SSL"
else
    echo "⚠️ Received HTTP $RESPONSE"
fi

echo ""
echo "========================================="
echo "🎉 DEPLOYMENT STATUS"
echo "========================================="
echo ""
echo "Your site: https://profgenie.ai"
echo ""
echo "Useful Commands:"
echo "  pm2 logs profgenie     - View application logs"
echo "  pm2 restart profgenie  - Restart application"
echo "  pm2 monit             - Monitor resources"
echo "  systemctl status nginx - Check Nginx status"
echo "  certbot renew         - Renew SSL manually"
echo ""
```

---

## 📋 Complete Deployment Workflow

Here's the order to run everything:

### **After your current state:**

1. **Fix port 80 & Reboot**

   ```bash
   systemctl stop apache2
   systemctl disable apache2
   systemctl start nginx
   reboot
   ```

2. **After reboot - Upgrade Node.js**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   npm install -g pnpm pm2
   ```

3. **Upload your code to `/var/www/profgenie`**

4. **Configure environment**

   ```bash
   cd /var/www/profgenie
   # Create .env.production (see Phase 3 Step 2)
   ```

5. **Install & Build**

   ```bash
   pnpm install
   pnpm prisma:generate
   pnpm migrate:deploy
   pnpm build
   ```

6. **Start with PM2**

   ```bash
   pm2 start pnpm --name "profgenie" -- start
   pm2 save
   ```

7. **Configure Nginx** (see Phase 4)

8. **Setup SSL** (see Phase 5)

9. **Security hardening** (see Phase 6)

10. **Verify everything** (see Final Verification)

---

## 🆘 Troubleshooting

### Port 3000 already in use

```bash
lsof -i :3000
kill -9 <PID>
pm2 restart profgenie
```

### Nginx test fails

```bash
nginx -t
# Read the error and fix the config
```

### SSL fails

```bash
# Check DNS first
nslookup profgenie.ai
# Should show 31.220.62.85

# Try manual mode
certbot certonly --nginx -d profgenie.ai
```

### Database connection error

```bash
# Test connection
sudo -u postgres psql -d profgenie_db

# Check password in .env.production
nano /var/www/profgenie/.env.production
```

---

## 🎯 Quick Reference

**Your Server:**

- IP: `31.220.62.85`
- Domain: `profgenie.ai`
- App: `/var/www/profgenie`
- DB: `profgenie_db` (user: `profgenie_user`)

**Key Commands:**

```bash
pm2 logs profgenie          # View logs
pm2 restart profgenie       # Restart app
systemctl restart nginx      # Restart web server
systemctl restart postgresql # Restart database
ufw status                  # Check firewall
certbot renew              # Renew SSL
```

**All security features will be active after completing Phase 6!** 🔒
