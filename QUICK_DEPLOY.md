# Quick Deployment Commands

## Connect to VPS

```powershell
ssh root@31.220.62.85
```

## One-Line Server Setup

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/deploy.sh | bash
```

## Or Manual Setup

```bash
# Update system
apt update && apt upgrade -y && apt install -y curl wget git nano ufw unzip postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs

# Install pnpm & PM2
npm install -g pnpm pm2

# Setup database
sudo -u postgres psql << 'EOF'
CREATE DATABASE profgenie_db;
CREATE USER profgenie_user WITH ENCRYPTED PASSWORD 'ProfGenie2026!SecureDB#VPS';
GRANT ALL PRIVILEGES ON DATABASE profgenie_db TO profgenie_user;
\c profgenie_db
GRANT ALL ON SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO profgenie_user;
EOF

# Create app directory
mkdir -p /var/www/profgenie

echo "✅ Server ready! Upload files to /var/www/profgenie"
```

## Upload Files (from Windows)

```powershell
# Using SCP
scp -r C:\Users\Allot\OneDrive\Desktop\profhelp-main\* root@31.220.62.85:/var/www/profgenie/

# Or use WinSCP: https://winscp.net/
```

## Deploy App

```bash
cd /var/www/profgenie

# Create .env.production (see HOSTINGER_DEPLOYMENT.md)

# Install & build
pnpm install && pnpm prisma:generate && pnpm prisma migrate deploy && pnpm build

# Start with PM2
pm2 start pnpm --name "profgenie" -- start
pm2 save && pm2 startup

# Configure Nginx (see HOSTINGER_DEPLOYMENT.md)

# Setup SSL
certbot --nginx -d profgenie.ai -d www.profgenie.ai

# Create admin
node scripts/setup-admin.js
```

## Check Status

```bash
pm2 status
pm2 logs profgenie
systemctl status nginx
```

## Access

- HTTP: <http://31.220.62.85>
- Domain: <https://profgenie.ai> (after DNS setup)
