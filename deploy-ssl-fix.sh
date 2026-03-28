#!/bin/bash
# ============================================================
# ProfGenie.ai - SSL Fix + Full Deployment Script
# Run this on the production server (root@31.220.62.85)
# ============================================================
set -e

echo "=========================================="
echo "  ProfGenie.ai SSL Fix + Deploy"
echo "=========================================="

cd /var/www/profgenie

# ---- Step 1: Pull latest code ----
echo ""
echo "[1/7] Pulling latest code from GitHub..."
git pull origin main || git pull PROFGINE main || { echo "Git pull failed. Trying with reset..."; git fetch --all; git reset --hard origin/main 2>/dev/null || git reset --hard PROFGINE/main; }
echo "✅ Code updated"

# ---- Step 2: Install dependencies ----
echo ""
echo "[2/7] Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "✅ Dependencies installed"

# ---- Step 3: Build the application ----
echo ""
echo "[3/7] Building Next.js application..."
pnpm build
echo "✅ Build complete"

# ---- Step 4: Fix nginx config ----
echo ""
echo "[4/7] Updating nginx configuration..."
cat > /etc/nginx/sites-available/profgenie.ai << 'NGINX_CONF'
server {
    server_name profgenie.ai www.profgenie.ai;

    proxy_intercept_errors on;
    error_page 502 503 504 /maintenance.html;
    location = /maintenance.html {
        root /var/www/profgenie;
        internal;
    }

    # Serve uploaded files directly from disk (faster, bypasses Next.js)
    location /uploads/ {
        alias /var/www/profgenie/public/uploads/;
        add_header Cache-Control "public, max-age=3600";
        add_header X-Content-Type-Options nosniff;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/profgenie.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/profgenie.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # SSL hardening
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
}

server {
    listen 80;
    server_name profgenie.ai www.profgenie.ai;
    return 301 https://$host$request_uri;
}
NGINX_CONF

# Ensure symlink exists
ln -sf /etc/nginx/sites-available/profgenie.ai /etc/nginx/sites-enabled/profgenie.ai

# Test nginx config before reloading
nginx -t
echo "✅ Nginx config updated"

# ---- Step 5: Fix SSL Certificate ----
echo ""
echo "[5/7] Fixing SSL certificate with Let's Encrypt..."
echo "  Stopping nginx temporarily for standalone verification..."

# First check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "  Installing certbot..."
    apt-get update -qq && apt-get install -y certbot python3-certbot-nginx -qq
fi

# Check current certificate status
echo "  Current certificate status:"
certbot certificates 2>/dev/null || echo "  No certificates found"

# Force renew/obtain certificate for BOTH domains
echo ""
echo "  Obtaining fresh SSL certificate for profgenie.ai + www.profgenie.ai..."
certbot --nginx -d profgenie.ai -d www.profgenie.ai --non-interactive --agree-tos --force-renewal --redirect || {
    echo "  Certbot --nginx failed, trying standalone method..."
    systemctl stop nginx
    certbot certonly --standalone -d profgenie.ai -d www.profgenie.ai --non-interactive --agree-tos --force-renewal
    systemctl start nginx
}

echo "✅ SSL certificate renewed"

# ---- Step 6: Verify certificate ----
echo ""
echo "[6/7] Verifying SSL certificate..."
echo "  Certificate details:"
openssl x509 -in /etc/letsencrypt/live/profgenie.ai/fullchain.pem -noout -subject -dates -issuer 2>/dev/null || echo "  Warning: Could not read certificate"

# Reload nginx to pick up any cert changes
systemctl reload nginx
echo "✅ Nginx reloaded with new certificate"

# ---- Step 7: Restart application ----
echo ""
echo "[7/7] Restarting PM2 application..."
pm2 restart profgenie || pm2 start "pnpm start" --name profgenie
pm2 save
echo "✅ Application restarted"

# ---- Final verification ----
echo ""
echo "=========================================="
echo "  Deployment Complete! Verifying..."
echo "=========================================="
echo ""

# Wait for app to start
sleep 3

# Check if app is running
echo "PM2 Status:"
pm2 list | grep profgenie

# Quick SSL test
echo ""
echo "SSL Test:"
curl -sI https://profgenie.ai 2>/dev/null | head -5 || echo "  Note: curl SSL check may need a moment"
echo ""
curl -sI https://www.profgenie.ai 2>/dev/null | head -5 || echo "  Note: www curl check may need a moment"

# Check certbot renewal timer
echo ""
echo "Auto-renewal timer:"
systemctl status certbot.timer 2>/dev/null | head -5 || echo "  Setting up auto-renewal..."

# Ensure auto-renewal is set up
systemctl enable certbot.timer 2>/dev/null
systemctl start certbot.timer 2>/dev/null

echo ""
echo "=========================================="
echo "  ✅ ALL DONE!"
echo "  profgenie.ai should now have valid SSL"
echo "  www.profgenie.ai should also work"
echo "=========================================="
echo ""
echo "Test URLs:"
echo "  https://profgenie.ai"
echo "  https://www.profgenie.ai"
echo ""
echo "If SSL still shows issues, DNS may be"
echo "pointing to a different server. Check with:"
echo "  dig profgenie.ai +short"
echo "  dig www.profgenie.ai +short"
