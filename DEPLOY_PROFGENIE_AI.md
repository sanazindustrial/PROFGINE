# 🚀 Deploy Professor GENIE to profgenie.ai

## Step-by-Step Deployment Guide

Your VPS Details:

- **Server**: srv1277312.hstgr.cloud
- **IP**: 31.220.62.85
- **Domain**: profgenie.ai

## Part 1: Connect to Your VPS

### Option A: Using PuTTY (Recommended for Windows)

1. **Download PuTTY**: <https://www.putty.org/>
2. **Open PuTTY**
3. **Configure**:
   - Host Name: `31.220.62.85`
   - Port: `22`
   - Connection type: `SSH`
4. **Click "Open"**
5. **Login with**:
   - Username: `root`
   - Password: (from Hostinger email/panel)

### Option B: Windows Terminal/PowerShell

```powershell
# Open PowerShell as Administrator and run:
ssh root@31.220.62.85

# If ssh command not found, install OpenSSH:
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

---

## Part 2: Configure Domain DNS (Do This First!)

1. **Go to Hostinger Domain Panel**: <https://hpanel.hostinger.com/domains>
2. **Select profgenie.ai**
3. **Click "DNS / Nameservers"**
4. **Add/Update A Records**:

```
Type: A
Name: @
Points to: 31.220.62.85
TTL: 3600

Type: A
Name: www
Points to: 31.220.62.85
TTL: 3600
```

1. **Save changes** (DNS propagation takes 5-60 minutes)

---

## Part 3: Server Setup & Installation

Once connected via SSH, run these commands:

### 3.1 Update System & Install Basic Tools

```bash
# Update packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git nano ufw
```

### 3.2 Install Node.js 18+

```bash
# Add Node.js repository
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### 3.3 Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Verify
pnpm --version
```

### 3.4 Install PostgreSQL

```bash
# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Verify it's running
systemctl status postgresql
```

### 3.5 Configure PostgreSQL Database

```bash
# Switch to postgres user and create database
sudo -u postgres psql << EOF
CREATE DATABASE profgenie_db;
CREATE USER profgenie_user WITH ENCRYPTED PASSWORD 'ProfGenie2026!Secure#DB';
GRANT ALL PRIVILEGES ON DATABASE profgenie_db TO profgenie_user;
\c profgenie_db
GRANT ALL ON SCHEMA public TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO profgenie_user;
EOF

echo "✅ Database created successfully!"
```

### 3.6 Install PM2 (Process Manager)

```bash
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
```

### 3.7 Install Nginx (Web Server)

```bash
apt install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

### 3.8 Configure Firewall

```bash
# Setup firewall rules
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Check status
ufw status
```

---

## Part 4: Deploy Application

### 4.1 Create Application Directory

```bash
mkdir -p /var/www/profgenie
cd /var/www/profgenie
```

### 4.2 Upload Your Code

**Option A: Using Git (Recommended)**

```bash
# If your code is on GitHub
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Or initialize and push from local
# (Run this on your local machine first):
# cd C:\Users\Allot\OneDrive\Desktop\profhelp-main
# git init
# git add .
# git commit -m "Initial commit"
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
# git push -u origin main
```

**Option B: Upload via SFTP**

1. Use **WinSCP** or **FileZilla**
2. Connect to: `31.220.62.85`
3. Upload all files from `C:\Users\Allot\OneDrive\Desktop\profhelp-main` to `/var/www/profgenie`

### 4.3 Create Environment File

```bash
cd /var/www/profgenie

# Create production environment file
nano .env.production
```

**Copy and paste this (Update the secrets!):**

```bash
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://profgenie_user:ProfGenie2026!Secure#DB@localhost:5432/profgenie_db?schema=public"
DIRECT_URL="postgresql://profgenie_user:ProfGenie2026!Secure#DB@localhost:5432/profgenie_db?schema=public"

# NextAuth
NEXTAUTH_URL="https://profgenie.ai"
NEXTAUTH_SECRET="Ly6jeFVq2699o3iqydeIvpDwrsvs6KzaqgNnNO1zBts="
AUTH_TRUST_HOST="true"

# Google OAuth (UPDATE THESE!)
GOOGLE_CLIENT_ID="566060212460-silnanpv9eh7pt2qi04jqv48j8k6ib5c.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_NEW_SECRET_FROM_GOOGLE_CLOUD"

# Stripe (Start with test keys, switch to live later)
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"

# Application URL
APP_URL="https://profgenie.ai"

# AI Provider Keys (Optional)
OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

### 4.4 Install Dependencies

```bash
cd /var/www/profgenie

# Install packages
pnpm install

# This may take 5-10 minutes
```

### 4.5 Setup Database Schema

```bash
# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm migrate:deploy

# Verify tables were created
sudo -u postgres psql -d profgenie_db -c "\dt"
```

### 4.6 Create Admin User

```bash
# Run the admin setup script
node scripts/setup-admin.js

# Follow the prompts to create your admin account
```

### 4.7 Build Application

```bash
# Build for production
pnpm build

# This may take 5-10 minutes
```

---

## Part 5: Configure Nginx

### 5.1 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/profgenie
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name profgenie.ai www.profgenie.ai;

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

    # Increase body size for file uploads
    client_max_body_size 50M;
}
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

### 5.2 Enable Site & Test Configuration

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/profgenie /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## Part 6: Start Application

### 6.1 Start with PM2

```bash
cd /var/www/profgenie

# Start the application
pm2 start pnpm --name "profgenie" -- start

# Save PM2 configuration
pm2 save

# View logs
pm2 logs profgenie

# Check status
pm2 status
```

### 6.2 Test Application

```bash
# Check if app is running
curl http://localhost:3000

# Should return HTML from your app
```

---

## Part 7: Setup SSL Certificate (HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d profgenie.ai -d www.profgenie.ai

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Verify auto-renewal
certbot renew --dry-run
```

---

## Part 8: Update Google OAuth Settings

1. **Go to**: <https://console.cloud.google.com/apis/credentials>
2. **Find your OAuth 2.0 Client**
3. **Add Authorized Redirect URIs**:
   - `https://profgenie.ai/api/auth/callback/google`
   - `https://www.profgenie.ai/api/auth/callback/google`
4. **Generate NEW Client Secret** (old one is exposed)
5. **Update `.env.production`** with new secret:

```bash
nano /var/www/profgenie/.env.production
# Update GOOGLE_CLIENT_SECRET with new value
# Save and restart app:
pm2 restart profgenie
```

---

## Part 9: Setup Stripe Webhook

1. **Go to**: <https://dashboard.stripe.com/webhooks>
2. **Click "Add endpoint"**
3. **Enter URL**: `https://profgenie.ai/api/stripe/webhook`
4. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy webhook secret** and update `.env.production`:

```bash
nano /var/www/profgenie/.env.production
# Update STRIPE_WEBHOOK_SECRET
# Save and restart:
pm2 restart profgenie
```

---

## Part 10: Final Verification

### 10.1 Check All Services

```bash
# Check PostgreSQL
systemctl status postgresql

# Check Nginx
systemctl status nginx

# Check application
pm2 status

# Check logs
pm2 logs profgenie --lines 50
```

### 10.2 Test Website

1. Open browser: **<https://profgenie.ai>**
2. Test login with Google
3. Check dashboard access
4. Test AI features

---

## Useful Commands for Management

```bash
# View application logs
pm2 logs profgenie

# Restart application
pm2 restart profgenie

# Stop application
pm2 stop profgenie

# Check resource usage
pm2 monit

# View Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Check PostgreSQL connections
sudo -u postgres psql -d profgenie_db -c "SELECT * FROM pg_stat_activity;"

# Backup database
sudo -u postgres pg_dump profgenie_db > backup_$(date +%Y%m%d).sql

# Update application (after changes)
cd /var/www/profgenie
git pull  # or upload new files
pnpm install
pnpm build
pm2 restart profgenie
```

---

## Troubleshooting

### Application won't start

```bash
cd /var/www/profgenie
pm2 logs profgenie --lines 100
# Check for errors in environment variables or database connection
```

### Database connection failed

```bash
# Test database connection
sudo -u postgres psql -d profgenie_db

# Check if user has permissions
sudo -u postgres psql -d profgenie_db -c "\du"
```

### SSL certificate issues

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew --force-renewal
```

### Domain not resolving

```bash
# Check DNS propagation
nslookup profgenie.ai

# Should show: 31.220.62.85
```

---

## 🎉 Deployment Complete

Your Professor GENIE platform should now be live at:

- **<https://profgenie.ai>**

### Next Steps

1. ✅ Test complete user flow
2. ✅ Switch Stripe to live mode (when ready)
3. ✅ Deploy Chrome extension to web stores
4. ✅ Setup monitoring and backups
5. ✅ Add additional security hardening

---

## Security Checklist

- [ ] Strong database password set
- [ ] Firewall enabled and configured
- [ ] SSL certificate installed
- [ ] Google OAuth secrets rotated
- [ ] Environment variables secured
- [ ] Regular backups scheduled
- [ ] Monitoring setup (PM2, logs)
- [ ] Rate limiting configured

---

## Support & Resources

- **VPS Access**: Hostinger hPanel
- **Domain DNS**: <https://hpanel.hostinger.com/domains>
- **Server IP**: 31.220.62.85
- **Database**: PostgreSQL 15 on localhost
- **Process Manager**: PM2
- **Web Server**: Nginx with SSL

**Need help?** Check logs first:

```bash
pm2 logs profgenie
tail -f /var/log/nginx/error.log
```
