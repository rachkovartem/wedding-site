# Wedding Invitation Site — Ира & Артём

Personal wedding invitation web application for Irina and Artem's wedding on 22 June 2026 in Gremi, Kakheti, Georgia.

Each guest receives a unique personal invitation link. The admin dashboard shows who has opened their invitation and aggregated visit statistics.

---

## Architecture

```
wedding-site/
  server/          Express API + SQLite (better-sqlite3)
  client/          Vite + React frontend (built separately)
  README.md
  package.json     Root — orchestrates both
```

**Stack:**
- Node.js v20+ (v24 supported)
- Express 4 with better-sqlite3
- JWT auth via HttpOnly cookie
- Vitest for backend tests

---

## Prerequisites

- Node.js 20 or higher (v24 recommended)
- npm 9+
- On Ubuntu/Debian VPS: build tools for native modules

```bash
# Ubuntu/Debian — install build tools for better-sqlite3
sudo apt update && sudo apt install -y build-essential python3
```

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url> wedding-site
cd wedding-site
npm install          # root (installs concurrently)
cd server && npm install
cd ../client && npm install   # if client exists
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env — set JWT_SECRET and ADMIN_PASSWORD to secure values
```

`.env` variables:

| Variable         | Description                          | Default                  |
|------------------|--------------------------------------|--------------------------|
| `PORT`           | Server port                          | `3001`                   |
| `JWT_SECRET`     | Secret for signing JWT tokens        | `change-me-in-production`|
| `ADMIN_PASSWORD` | Admin dashboard password             | `admin123`               |
| `NODE_ENV`       | `development` or `production`        | `development`            |

### 3. Run in development

```bash
# From root — starts both server and Vite dev server concurrently
npm run dev

# Or run server only
cd server && npm run dev
```

Server: http://localhost:3001  
Vite dev server: http://localhost:5173 (proxies /api to server)

### 4. Run backend tests

```bash
cd server && npm test
```

---

## API Reference

### Public endpoints

| Method | Path                              | Description                         |
|--------|-----------------------------------|-------------------------------------|
| GET    | `/api/invitations/:id`            | Get invitation (guest-facing)        |
| POST   | `/api/invitations/:id/view`       | Record page open                     |

### Auth

| Method | Path          | Description                    |
|--------|---------------|--------------------------------|
| POST   | `/api/auth`   | Login — sets HttpOnly cookie   |
| POST   | `/api/logout` | Logout — clears cookie         |

**Login body:** `{ "password": "..." }`  
Rate-limited to 5 attempts per 15 minutes.

### Admin (require valid cookie)

| Method | Path                         | Description                  |
|--------|------------------------------|------------------------------|
| GET    | `/api/admin/invitations`     | List all invitations          |
| POST   | `/api/admin/invitations`     | Create invitation             |
| DELETE | `/api/admin/invitations/:id` | Delete invitation             |
| GET    | `/api/admin/stats`           | Aggregate stats + guest list  |

---

## Production Build

```bash
# Build the React frontend
npm run build
# This outputs to client/dist/ — the server serves it statically
```

---

## VPS Deployment (Step by Step)

Tested on Ubuntu 22.04 LTS with Nginx + pm2 + certbot.

### Step 1 — Provision server

Create a VPS (DigitalOcean, Hetzner, etc.) with Ubuntu 22.04.  
Point your domain's A record to the server IP.

### Step 2 — Initial server setup

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Create deploy user
adduser deploy
usermod -aG sudo deploy
su - deploy

# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
nvm alias default 24
node --version   # should print v24.x.x

# Install build tools
sudo apt update && sudo apt install -y build-essential python3 git nginx

# Install pm2
npm install -g pm2
```

### Step 3 — Deploy application

```bash
# Create app directory
mkdir -p /home/deploy/apps
cd /home/deploy/apps

# Clone repository
git clone <your-repo-url> wedding-site
cd wedding-site

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install
cd ..

# Install client dependencies and build
cd client && npm install && npm run build
cd ..
```

### Step 4 — Configure environment

```bash
cd /home/deploy/apps/wedding-site/server
cp .env.example .env
nano .env
```

Set these values:
```
PORT=3001
JWT_SECRET=<generate with: openssl rand -base64 48>
ADMIN_PASSWORD=<your-secure-admin-password>
NODE_ENV=production
```

### Step 5 — Start with pm2

```bash
cd /home/deploy/apps/wedding-site/server
pm2 start index.js --name wedding-site
pm2 save
pm2 startup   # follow the printed instructions to enable auto-start on reboot
```

Verify it's running:
```bash
pm2 status
pm2 logs wedding-site --lines 20
```

### Step 6 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/wedding-site
```

Paste this configuration (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (certbot will update this)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    # SSL — certbot will fill these in
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Real client IP forwarding
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # API — proxy to Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets from React build — also served by Node, but can be served by Nginx for performance
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/wedding-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7 — Obtain SSL certificate with certbot

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address for renewal notices
# - Agree to terms of service
# - Choose to redirect HTTP to HTTPS (recommended: option 2)

# Verify auto-renewal works
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx config and set up a cron job for renewal.

### Step 8 — Verify deployment

```bash
# Check server is running
curl -s https://yourdomain.com/api/admin/invitations
# Expected: {"error":"Unauthorized"} (correct — 401 without auth)

# Check pm2 is running
pm2 status

# View live logs
pm2 logs wedding-site
```

---

## Updating the application

```bash
cd /home/deploy/apps/wedding-site
git pull

# Rebuild frontend
cd client && npm install && npm run build && cd ..

# Update server dependencies if needed
cd server && npm install && cd ..

# Restart the server
pm2 restart wedding-site
```

---

## Database

SQLite database is stored at `server/data.db`.

**Backup:**
```bash
cp /home/deploy/apps/wedding-site/server/data.db /home/deploy/backups/data-$(date +%Y%m%d).db
```

Add to crontab for automatic daily backups:
```bash
crontab -e
# Add:
0 3 * * * cp /home/deploy/apps/wedding-site/server/data.db /home/deploy/backups/data-$(date +\%Y\%m\%d).db
```

**First run:** Demo data is seeded automatically in development only (`NODE_ENV=development`). Production starts with an empty database.

---

## Admin Dashboard

Navigate to `https://yourdomain.com/admin` and log in with the `ADMIN_PASSWORD` from your `.env`.

From the dashboard you can:
- Create personalized invitation links for each guest
- See who has opened their invitation
- View visit statistics over time

---

## Troubleshooting

**Server fails to start — better-sqlite3 build error**
```bash
sudo apt install -y build-essential python3
cd server && npm rebuild better-sqlite3
```

**pm2 not found after reboot**
```bash
# Run the command pm2 startup printed, e.g.:
sudo env PATH=$PATH:/home/deploy/.nvm/versions/node/v24.14.0/bin pm2 startup systemd -u deploy --hp /home/deploy
pm2 restore
```

**Nginx returns 502 Bad Gateway**
```bash
pm2 status           # Check server is running
pm2 logs wedding-site  # Check for errors
sudo nginx -t          # Check Nginx config
```

**Admin password forgotten**
Update `ADMIN_PASSWORD` in `.env` and restart. The server detects the change automatically and re-hashes:
```bash
pm2 restart wedding-site
```
