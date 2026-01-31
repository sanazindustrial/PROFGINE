# Hostinger Deployment Guide for Professor GENIE Platform

## Prerequisites

- Hostinger VPS or Cloud Hosting (Node.js support required)
- Domain purchased on Hostinger
- PostgreSQL database (Neon recommended)
- All required API keys (Google OAuth, AI providers, etc.)

## Step 1: Domain Setup

1. **Log into Hostinger Panel**: <https://hpanel.hostinger.com/domains>
2. **Point Domain to VPS**:
   - Go to **Domains** → Select your domain
   - Click **DNS/Nameservers**
   - Add/Update A Record:

     ```
     Type: A
     Name: @ (for root domain) or www
     Points to: [Your VPS IP Address]
     TTL: 3600
     ```

   - Add CNAME for www (optional):

     ```
     Type: CNAME
     Name: www
     Points to: yourdomain.com
     ```

## Step 2: VPS Server Setup

### Connect to Your Hostinger VPS

Based on your VPS details:

- **Server**: srv1277312.hstgr.cloud
- **IP**: 31.220.62.85
- **Type**: KVM 4

```bash
# Connect via SSH
ssh root@31.220.62.85

# You'll be prompted for your root password
# (Check your Hostinger email for initial credentials)
```

### Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18+ (required for Next.js 16)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install pnpm (required by this project)
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Install certbot (for SSL)
apt install -y certbot python3-certbot-nginx
```

### Install PostgreSQL Database on VPS

```bash
# Install PostgreSQL 15 (latest stable version)
apt install -y postgresql postgresql-contrib

# Check PostgreSQL status
systemctl status postgresql

# PostgreSQL should start automatically
# If not, start it:
systemctl start postgresql
systemctl enable postgresql
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# You're now in PostgreSQL prompt
# Create database for your application
CREATE DATABASE profgenie_db;

# Create user with password (CHANGE THIS PASSWORD!)
CREATE USER profgenie_user WITH ENCRYPTED PASSWORD 'YourSecurePassword123!@#';

# Grant all privileges on database to user
GRANT ALL PRIVILEGES ON DATABASE profgenie_db TO profgenie_user;

# Grant schema privileges (required for Prisma)
\c profgenie_db
GRANT ALL ON SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO profgenie_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO profgenie_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO profgenie_user;

# Exit PostgreSQL
\q
```

### Enable Remote Access to PostgreSQL (Optional but Recommended for Management)

```bash
# Edit PostgreSQL configuration
nano /etc/postgresql/15/main/postgresql.conf

# Find and change this line (around line 59):
# listen_addresses = 'localhost'
# Change to:
listen_addresses = '*'

# Save and exit (Ctrl+X, Y, Enter)

# Edit client authentication
nano /etc/postgresql/15/main/pg_hba.conf

# Add this line at the end (allows password authentication):
host    all             all             0.0.0.0/0               md5

# Save and exit (Ctrl+X, Y, Enter)

# Restart PostgreSQL
systemctl restart postgresql
```

### Setup PostgreSQL Firewall Rules

```bash
# Install UFW firewall (if not already installed)
apt install -y ufw

# Allow SSH (IMPORTANT: do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow PostgreSQL (only if you need remote access)
# WARNING: Only allow from trusted IPs in production
ufw allow 5432/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Test PostgreSQL Connection

```bash
# Test local connection
psql -U profgenie_user -d profgenie_db -h localhost

# You should be prompted for password
# If successful, you'll see the PostgreSQL prompt

# Exit
\q
```

### Create Database Connection String

Your PostgreSQL connection string will be:

```bash
# For local connection (from VPS itself)
DATABASE_URL="postgresql://profgenie_user:YourSecurePassword123!@#@localhost:5432/profgenie_db?schema=public"

# For remote connection (if needed)
DATABASE_URL="postgresql://profgenie_user:YourSecurePassword123!@#@31.220.62.85:5432/profgenie_db?schema=public"

# For Prisma, use the same URL for both:
DIRECT_URL="postgresql://profgenie_user:YourSecurePassword123!@#@localhost:5432/profgenie_db?schema=public"
```

**⚠️ Security Note**:

- Replace `YourSecurePassword123!@#` with a strong password
- Store credentials securely
- Consider using connection pooling for production (PgBouncer)

## Step 3: Deploy Application

### 1. Clone or Upload Your Project

```bash
# Create app directory
mkdir -p /var/www/profgenie
cd /var/www/profgenie

# Option A: Upload via Git
git clone your-repository-url .

# Option B: Upload via SFTP
# Use FileZilla or similar to upload files to /var/www/profgenie
```

### 2. Install Dependencies

```bash
cd /var/www/profgenie
pnpm install
```

### 3. Set Environment Variables

```bash
# Create production environment file
nano .env.production

# Add ALL required variables:
# Database (Neon URLs)
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Provider Keys (at least one required)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
# Add others as needed...

# Stripe (if using payments)
STRIPE_SECRET_KEY="your-stripe-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-public"

# Save and exit (Ctrl+X, Y, Enter)
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm migrate:deploy
```

### 5. Build Application

```bash
pnpm build
```

### 6. Start with PM2

```bash
# Start the app
pm2 start pnpm --name "profgenie" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

## Step 4: Configure Nginx Reverse Proxy

### Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/profgenie
```

### Add Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
    }
}
```

### Enable Configuration

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/profgenie /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

## Step 5: Setup SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts to complete setup
# Certificate auto-renews via cron
```

## Step 6: Create Admin User

```bash
cd /var/www/profgenie

# Run admin setup script
node scripts/setup-admin.js

# Or make existing user admin
node scripts/make-admin.js
```

## Step 7: Verify Deployment

1. Visit `https://yourdomain.com`
2. Test login with Google OAuth
3. Check admin access
4. Test AI features
5. Verify database connectivity

## Maintenance Commands

```bash
# View logs
pm2 logs profgenie

# Restart app
pm2 restart profgenie

# Stop app
pm2 stop profgenie

# Update app after changes
cd /var/www/profgenie
git pull  # or upload new files
pnpm install
pnpm build
pm2 restart profgenie
```

## Troubleshooting

### Check App Status

```bash
pm2 status
pm2 logs profgenie --lines 100
```

### Check Nginx Status

```bash
systemctl status nginx
nginx -t
tail -f /var/log/nginx/error.log
```

### Database Connection Issues

```bash
# Test database connectivity
node scripts/test-db.js
```

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000
# Kill if needed
kill -9 [PID]
```

## Alternative: Deploy to Vercel (Recommended)

Since your app is optimized for Vercel (as mentioned in the copilot instructions):

1. **Push code to GitHub**
2. **Connect to Vercel**:
   - Visit <https://vercel.com>
   - Import your GitHub repository
   - Configure environment variables
   - Deploy
3. **Connect Custom Domain**:
   - In Vercel dashboard, go to **Domains**
   - Add your Hostinger domain
   - Update DNS in Hostinger panel:

     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     ```

**Vercel Benefits**:

- Automatic SSL
- Edge runtime optimization
- Zero configuration
- Automatic deployments
- Better performance for Next.js

## Security Checklist

- [ ] SSL certificate installed
- [ ] Environment variables secured (not in git)
- [ ] Database uses SSL connection
- [ ] Firewall configured (UFW)
- [ ] Regular backups enabled
- [ ] PM2 monitoring active
- [ ] Nginx security headers added

## Performance Optimization

```bash
# Enable PM2 clustering for better performance
pm2 start pnpm --name "profgenie" -i max -- start

# Monitor resource usage
pm2 monit
```

## Support Resources

- **Hostinger Support**: <https://www.hostinger.com/tutorials/>
- **Neon Database**: <https://neon.tech/docs>
- **Next.js Deployment**: <https://nextjs.org/docs/deployment>
- **PM2 Documentation**: <https://pm2.keymetrics.io/docs/usage/quick-start/>
