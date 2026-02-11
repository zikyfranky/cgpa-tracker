#!/bin/bash
set -e

# ============================================
# CGPA Tracker — Namecheap Deployment Script
# Subdomain: gph_cgpa.zikyfranky.com
# ============================================

# --- CONFIGURE THESE ---
SSH_USER="zikyfranky"                              # Your cPanel username
SSH_HOST="zikyfranky.com"                          # Server hostname (or IP)
SSH_PORT=21098                                     # Namecheap SSH port (default: 21098)
REMOTE_DIR="/home/$SSH_USER/gph_cgpa.zikyfranky.com"  # Remote app directory

# --- LOCAL ---
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  Deploying CGPA Tracker"
echo "  -> $SSH_USER@$SSH_HOST:$REMOTE_DIR"
echo "=========================================="

# Step 1: Build locally
echo ""
echo "[1/4] Building Next.js app..."
cd "$LOCAL_DIR"
npm run build

# Step 2: Sync files to server
echo ""
echo "[2/4] Uploading files to server..."
rsync -avz --delete \
  -e "ssh -p $SSH_PORT" \
  --exclude '.git' \
  --exclude '.git/*' \
  --exclude 'node_modules' \
  --exclude '.env.local' \
  --exclude '.env' \
  --exclude '.vscode' \
  --exclude 'db/import-state.*' \
  "$LOCAL_DIR/" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

# Step 3: Install dependencies & restart on server
echo ""
echo "[3/4] Installing dependencies on server..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'REMOTE'
  cd "$HOME/gph_cgpa.zikyfranky.com"

  # Install production dependencies
  npm install --production

  # Restart the app (try multiple methods)
  # Method 1: cPanel Passenger restart
  if [ -f tmp/restart.txt ] || [ -d tmp ]; then
    mkdir -p tmp
    touch tmp/restart.txt
    echo "  -> Restarted via Passenger (tmp/restart.txt)"
  fi

  # Method 2: PM2 (if available)
  if command -v pm2 &> /dev/null; then
    pm2 restart cgpa-tracker 2>/dev/null || pm2 start npm --name "cgpa-tracker" -- start
    echo "  -> Restarted via PM2"
  fi
REMOTE

# Step 4: Done
echo ""
echo "[4/4] Deployment complete!"
echo ""
echo "  Live at: https://gph_cgpa.zikyfranky.com"
echo ""
echo "  REMINDER: Make sure .env.local exists on the server with your DB credentials."
echo "  If this is the first deploy, SSH in and run:"
echo "    cd $REMOTE_DIR && node db/seed.mjs"
echo "=========================================="
