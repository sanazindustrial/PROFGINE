# 🚀 Deploy Professor GENIE to Hostinger VPS

**Server**: srv1277312.hstgr.cloud  
**Domain**: profgenie.ai  
**Date**: January 31, 2026

---

## Quick Start Deployment

### Step 1: Connect to Your VPS

```powershell
# Using SSH from PowerShell
ssh root@31.220.62.85

# Or download PuTTY: https://www.putty.org/
# Host: 31.220.62.85
# Port: 22
# Username: root
```

### Step 2: Run Complete Server Setup

Once connected to VPS, copy and paste this **entire script**:

```bash
#!/bin/bash
set -e

echo "=================================="
echo "🚀 Professor GENIE Deployment"
echo "=================================="

# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y curl wget git nano ufw unzip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Create database
sudo -u postgres psql << EOF
CREATE DATABASE profgenie_db;
CREATE USER profgenie_user WITH ENCRYPTED PASSWORD 'ProfGenie2026!SecureDB#VPS';
GRANT ALL PRIVILEGES ON DATABASE profgenie_db TO profgenie_user;
\c profgenie_db
GRANT ALL ON SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO profgenie_user;
\q
EOF

# Install Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install Certbot
apt install -y certbot python3-certbot-nginx

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Create app directory
mkdir -p /var/www/profgenie

echo "✅ Server setup complete!"
echo "Next: Upload your files to /var/www/profgenie"
```

### Step 3: Upload Files to VPS

**Option A: Using WinSCP (Recommended)**

1. Download WinSCP: <https://winscp.net/>
2. Connect:
   - Host: `31.220.62.85`
   - Username: `root`
   - Password: (from Hostinger)
3. Upload these folders to `/var/www/profgenie`:
   - `app/`
   - `components/`
   - `lib/`
   - `prisma/`
   - `public/`
   - `scripts/`
   - `adaptors/`
   - All config files (package.json, next.config.mjs, etc.)
   - `backups/` folder with your database backup

#### Option B: Using Git

```bash
# On VPS
cd /var/www/profgenie
git clone https://github.com/sanazindustrial/PROFGINE.git .
```

#### Option C: Using SCP from Windows

```powershell
# From your local machine
scp -r C:\Users\Allot\OneDrive\Desktop\profhelp-main\* root@31.220.62.85:/var/www/profgenie/
```

### Step 4: Setup Environment & Deploy

```bash
# On VPS
cd /var/www/profgenie

# Create production environment file
nano .env.production
```

**Paste this (update the values):**

```bash
# Database
DATABASE_URL="postgresql://profgenie_user:ProfGenie2026!SecureDB#VPS@localhost:5432/profgenie_db?schema=public"
DIRECT_URL="postgresql://profgenie_user:ProfGenie2026!SecureDB#VPS@localhost:5432/profgenie_db?schema=public"

# NextAuth
NEXTAUTH_URL="https://profgenie.ai"
NEXTAUTH_SECRET="Ly6jeFVq2699o3iqydeIvpDwrsvs6KzaqgNnNO1zBts="
AUTH_TRUST_HOST="true"

# Google OAuth (UPDATE THESE!)
GOOGLE_CLIENT_ID="566060212460-silnanpv9eh7pt2qi04jqv48j8k6ib5c.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_SECRET_HERE"

# Stripe (optional - can add later)
STRIPE_SECRET_KEY="sk_test_YOUR_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"

# Application
APP_URL="https://profgenie.ai"
NODE_ENV="production"

# AI Providers (from your .env.local)
OPENAI_API_KEY="your_openai_key_here"
ANTHROPIC_API_KEY="your_anthropic_key_here"
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 5: Install & Build

```bash
cd /var/www/profgenie

# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma migrate deploy

# Build application
pnpm build

echo "✅ Build complete!"
```

### Step 6: Restore Database

```bash
cd /var/www/profgenie

# Restore your backup
sudo -u postgres psql -d profgenie_db < backups/database-backup-2026-01-31T07-14-34-706Z.json

# Or if you have SQL backup
# sudo -u postgres psql -d profgenie_db < backups/neon_backup.sql

# Verify data
sudo -u postgres psql -d profgenie_db -c "SELECT COUNT(*) FROM \"User\";"
```

### Step 7: Configure Nginx

```bash
nano /etc/nginx/sites-available/profgenie
```

**Paste:**

```nginx
server {
    listen 80;
    server_name profgenie.ai www.profgenie.ai srv1277312.hstgr.cloud;

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
        
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    client_max_body_size 50M;
}
```

**Enable site:**

```bash
ln -s /etc/nginx/sites-available/profgenie /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### Step 8: Start Application

```bash
cd /var/www/profgenie

# Start with PM2
pm2 start pnpm --name "profgenie" -- start

# Save PM2 config
pm2 save

# Start on boot
pm2 startup
# Run the command it shows

# Check status
pm2 status
pm2 logs profgenie
```

### Step 9: Setup SSL

```bash
# Get SSL certificate
certbot --nginx -d profgenie.ai -d www.profgenie.ai

# Follow prompts:
# 1. Enter email
# 2. Agree to terms
# 3. Redirect HTTP to HTTPS (option 2)

echo "✅ SSL installed!"
```

### Step 10: Create Admin User

```bash
cd /var/www/profgenie
node scripts/setup-admin.js
```

---

## Quick Commands

```bash
# View logs
pm2 logs profgenie

# Restart app
pm2 restart profgenie

# Check status
pm2 status
systemctl status nginx
systemctl status postgresql

# Database backup
sudo -u postgres pg_dump profgenie_db > backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

### Can't connect to server

```bash
# Check SSH service
systemctl status ssh

# Try with verbose
ssh -v root@31.220.62.85
```

### Build fails

```bash
# Check Node version
node --version  # Should be 20.x

# Clear and rebuild
rm -rf node_modules .next
pnpm install
pnpm build
```

### App won't start

```bash
# Check logs
pm2 logs profgenie --lines 100

# Check environment
cat .env.production

# Check database connection
sudo -u postgres psql -d profgenie_db -c "\dt"
```

### SSL issues

```bash
# Check certificate
certbot certificates

# Renew manually
certbot renew --nginx
```

---

## DNS Configuration

Point your domain to the VPS:

**In Hostinger DNS Settings:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 31.220.62.85 | 3600 |
| A | www | 31.220.62.85 | 3600 |

Wait 5-30 minutes for DNS propagation.

---

## Post-Deployment Checklist

- [ ] Server setup complete
- [ ] Files uploaded to /var/www/profgenie
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database migrated
- [ ] Application built successfully
- [ ] Database backup restored
- [ ] Nginx configured
- [ ] PM2 running application
- [ ] SSL certificate installed
- [ ] DNS pointing to server
- [ ] Admin user created
- [ ] Website accessible via HTTPS
- [ ] Login working
- [ ] AI features working
- [ ] Health check result: <https://profgenie.ai> (HTTP 200)
- [ ] Verify key endpoints: API health, auth, and dashboard

---

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs profgenie`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check system logs: `journalctl -xe`
4. Verify environment variables are correct
5. Ensure database is running: `systemctl status postgresql`

**Server Info:**

- IP: 31.220.62.85
- Domain: profgenie.ai
- Server: srv1277312.hstgr.cloud
- App: /var/www/profgenie
- Database: profgenie_db
