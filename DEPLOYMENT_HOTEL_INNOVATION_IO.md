# Hotel Application Deployment Guide for hotel.nntc.io

Complete step-by-step guide to deploy the Hotel application at `hotel.nntc.io`.

---

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Ubuntu 20.04 LTS or later server
- [ ] Root or sudo access to the server
- [ ] Domain name `hotel.nntc.io` pointing to your server IP
- [ ] SSH access to the server
- [ ] Basic knowledge of Linux commands

---

## Step 1: Initial Server Setup

### 1.1 Connect to Your Server

```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

### 1.2 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Essential Tools

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    ufw \
    software-properties-common
```

---

## Step 2: Create Application User

### 2.1 Create User

```bash
sudo adduser --disabled-password --gecos "" hotel
```

### 2.2 Add to Sudo Group (Optional)

```bash
sudo usermod -aG sudo hotel
```

### 2.3 Switch to Application User

```bash
sudo su - hotel
```

---

## Step 3: Install PostgreSQL

### 3.1 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

### 3.2 Start PostgreSQL Service

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.3 Create Database and User

```bash
sudo -u postgres psql
```

In the PostgreSQL prompt, run:

```sql
CREATE DATABASE hotel;
CREATE USER hotel WITH PASSWORD 'your-secure-password-here';
ALTER ROLE hotel SET client_encoding TO 'utf8';
ALTER ROLE hotel SET default_transaction_isolation TO 'read committed';
ALTER ROLE hotel SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE hotel TO hotel;
\q
```

**Important:** Replace `'your-secure-password-here'` with a strong password. Save this password for later use.

### 3.4 Verify Database Connection

```bash
psql -U hotel -d hotel -h localhost
```

Enter the password when prompted. If successful, type `\q` to exit.

---

## Step 4: Install Python and Dependencies

### 4.1 Install Python 3.11

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip python3.11-dev
```

### 4.2 Install System Dependencies

```bash
sudo apt install -y \
    build-essential \
    libpq-dev \
    gcc \
    python3-setuptools
```

### 4.3 Verify Python Installation

```bash
python3.11 --version
```

Should output: `Python 3.11.x`

---

## Step 5: Install Node.js and pnpm

### 5.1 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 5.2 Install pnpm

```bash
npm install -g pnpm
```

### 5.3 Verify Installation

```bash
node --version
npm --version
pnpm --version
```

Should show Node.js v20.x, npm version, and pnpm version.

---

## Step 6: Install Nginx

### 6.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 6.2 Start and Enable Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6.3 Verify Nginx is Running

```bash
sudo systemctl status nginx
```

Press `q` to exit.

---

## Step 7: Clone Repository

### 7.1 Create Application Directory

```bash
sudo mkdir -p /opt/hotel
sudo chown hotel:hotel /opt/hotel
cd /opt/hotel
```

### 7.2 Clone Repository

```bash
git clone https://github.com/AliMohammadiiii/Hotel.git .
```

**Note:** If the repository is private, you may need to:
- Set up SSH keys, or
- Use a personal access token

---

## Step 8: Set Up Python Virtual Environment

### 8.1 Create Virtual Environment

```bash
cd /opt/hotel
python3.11 -m venv venv
```

### 8.2 Activate Virtual Environment

```bash
source venv/bin/activate
```

You should see `(venv)` in your prompt.

### 8.3 Upgrade Pip

```bash
pip install --upgrade pip
```

### 8.4 Install Python Dependencies

```bash
cd Back-end
pip install -r requirements.txt
```

This may take a few minutes.

---

## Step 9: Configure Environment Variables

### 9.1 Create Environment File

```bash
cd /opt/hotel/Back-end
cp .env.example .env
# Or create a new .env file if .env.example doesn't exist
nano .env
```

### 9.2 Update Required Variables

Add the following to your `.env` file:

```bash
# Django Settings
SECRET_KEY=your-generated-secret-key-here

# Set to False for production
DEBUG=False

# Your domain (include 127.0.0.1 and localhost for internal requests)
ALLOWED_HOSTS=hotel.nntc.io,www.hotel.nntc.io,127.0.0.1,localhost

# Database connection (use PostgreSQL in production)
DATABASE_URL=postgresql://hotel:your-database-password@localhost:5432/hotel

# CORS origins
CORS_ALLOWED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io

# CSRF trusted origins (must include protocol)
CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io,https://www.hotel.nntc.io,http://www.hotel.nntc.io

# Static and Media Files
STATIC_ROOT=/opt/hotel/Back-end/staticfiles
MEDIA_ROOT=/opt/hotel/Back-end/media

# Logging
LOG_FILE=/var/log/hotel/django.log
LOG_LEVEL=INFO

# Security (False allows both HTTP and HTTPS, True forces HTTPS)
SECURE_SSL_REDIRECT=False

# Injast SSO Configuration (if using SSO)
INJAST_BACKEND_URL=https://injast-api.example.com
INJAST_JWKS_URL=https://injast-api.example.com/.well-known/jwks.json
INJAST_JWT_AUDIENCE=sso
INJAST_JWT_ALGORITHM=RS256
INJAST_TOKEN_ENCRYPTION_KEY=your-encryption-key-here
```

### 9.3 Generate SECRET_KEY

In a new terminal or before editing, generate a secure key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Copy the output and paste it as your `SECRET_KEY` value.

### 9.4 Generate INJAST_TOKEN_ENCRYPTION_KEY (if using SSO)

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output and paste it as your `INJAST_TOKEN_ENCRYPTION_KEY` value.

### 9.5 Add PostgreSQL Support Package

Install `dj-database-url` for PostgreSQL support:

```bash
cd /opt/hotel/Back-end
source ../venv/bin/activate
echo "dj-database-url==2.1.0" >> requirements.txt
pip install dj-database-url==2.1.0
```

### 9.6 Update Database Configuration in settings.py

You need to update Django settings to use PostgreSQL. Edit `/opt/hotel/Back-end/hotel_backend/settings.py`:

1. **Add the import at the top** (after other imports, around line 14):

```python
import dj_database_url
```

2. **Find the `DATABASES` section** (around line 88) and replace it with:

```python
# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///' + str(BASE_DIR / 'db.sqlite3'))
    )
}
```

This will use PostgreSQL when `DATABASE_URL` is set in `.env`, and fall back to SQLite for local development.

### 9.7 Save and Exit

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 10: Set Up Logging Directory

### 10.1 Create Log Directory

```bash
sudo mkdir -p /var/log/hotel
sudo chown hotel:hotel /var/log/hotel
```

---

## Step 11: Run Database Migrations

### 11.1 Activate Virtual Environment

```bash
cd /opt/hotel
source venv/bin/activate
```

### 11.2 Load Environment Variables

```bash
cd Back-end
export $(cat .env | xargs)
```

### 11.3 Run Migrations

```bash
python manage.py migrate
```

You should see output like:
```
Operations to perform:
  Apply all migrations: ...
Running migrations:
  ...
```

### 11.4 Create Superuser

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin user:
- Username: (enter your username)
- Email: (enter your email, optional)
- Password: (enter a strong password)
- Password (again): (confirm password)

**Save these credentials securely!**

---

## Step 12: Collect Static Files

### 12.1 Collect Static Files

```bash
python manage.py collectstatic --noinput
```

This will create the `staticfiles` directory with all static assets.

---

## Step 13: Test Django Configuration

### 13.1 Run Django Checks

```bash
python manage.py check --deploy
```

This should complete without errors. If there are warnings, review them.

---

## Step 14: Configure Systemd Service

### 14.1 Create Service File

```bash
sudo nano /etc/systemd/system/hotel-backend.service
```

### 14.2 Add Service Configuration

Copy and paste the following:

```ini
[Unit]
Description=Hotel Django Backend (Gunicorn)
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=notify
User=hotel
Group=hotel
WorkingDirectory=/opt/hotel/Back-end
Environment="PATH=/opt/hotel/venv/bin"
EnvironmentFile=/opt/hotel/Back-end/.env
Environment="DJANGO_ALLOWED_HOSTS=hotel.nntc.io,www.hotel.nntc.io,127.0.0.1,localhost"
ExecStart=/opt/hotel/venv/bin/gunicorn \
    --workers 3 \
    --timeout 120 \
    --bind 127.0.0.1:6000 \
    --access-logfile /var/log/hotel/gunicorn-access.log \
    --error-logfile /var/log/hotel/gunicorn-error.log \
    --log-level info \
    hotel_backend.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=10

# Resource limits
MemoryMax=2G
CPUQuota=200%

# Security
NoNewPrivileges=true
ProtectSystem=false
ProtectHome=true
ReadWritePaths=/opt/hotel /var/log/hotel /tmp /var/run

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=hotel-backend

[Install]
WantedBy=multi-user.target
```

### 14.3 Save and Exit

Press `Ctrl+X`, then `Y`, then `Enter`.

### 14.4 Reload Systemd

```bash
sudo systemctl daemon-reload
```

### 14.5 Start Service

```bash
sudo systemctl start hotel-backend
sudo systemctl enable hotel-backend
```

### 14.6 Check Service Status

```bash
sudo systemctl status hotel-backend
```

Press `q` to exit. The service should be `active (running)`.

### 14.7 View Logs

```bash
sudo journalctl -u hotel-backend -f
```

Press `Ctrl+C` to exit. Check for any errors.

---

## Step 15: Build and Deploy Frontend

### 15.1 Navigate to Frontend Directory

```bash
cd /opt/hotel/Front-end
```

### 15.2 Install Dependencies

```bash
pnpm install
```

This may take several minutes.

### 15.3 Create Frontend Environment File

```bash
cat > .env.production << EOF
VITE_API_BASE_URL=https://hotel.nntc.io
EOF
```

### 15.4 Build Frontend

```bash
pnpm build
```

This will create the `dist/spa` directory.

### 15.5 Verify Build Output

```bash
ls -la dist/spa/
# Should contain index.html and assets/
```

---

## Step 16: Configure Nginx

### 16.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/hotel
```

### 16.2 Add Nginx Configuration

Copy and paste the following:

```nginx
upstream hotel_backend {
    server 127.0.0.1:6000;
}

server {
    listen 80;
    server_name hotel.nntc.io www.hotel.nntc.io;

    # Increase body size for file uploads
    client_max_body_size 20M;

    # Static files
    location /static/ {
        alias /opt/hotel/Back-end/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media files
    location /media/ {
        alias /opt/hotel/Back-end/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://hotel_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Django admin (moved to /django-admin/ to avoid conflict with custom admin panel at /admin)
    location /django-admin/ {
        proxy_pass http://hotel_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Custom admin panel - explicitly route to frontend SPA (must be before location /)
    location /admin {
        root /opt/hotel/Front-end/dist/spa;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
        index index.html;
    }

    # Health check endpoint (must be before location /)
    location /health {
        proxy_pass http://hotel_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        access_log off;
    }

    # Frontend SPA - serve static files and handle routing
    location / {
        root /opt/hotel/Front-end/dist/spa;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
        index index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 16.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/hotel /etc/nginx/sites-enabled/
```

### 16.4 Remove Default Site (Optional)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 16.5 Test Nginx Configuration

```bash
sudo nginx -t
```

Should output: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### 16.6 Restart Nginx

```bash
sudo systemctl restart nginx
```

### 16.7 Check Nginx Status

```bash
sudo systemctl status nginx
```

---

## Step 17: Configure Firewall

### 17.1 Check Firewall Status

```bash
sudo ufw status
```

### 17.2 Allow SSH (Important!)

```bash
sudo ufw allow ssh
sudo ufw allow 22/tcp
```

### 17.3 Allow HTTP and HTTPS

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 17.4 Enable Firewall

```bash
sudo ufw enable
```

Type `y` when prompted.

### 17.5 Verify Firewall Rules

```bash
sudo ufw status verbose
```

---

## Step 18: Set File Permissions

### 18.1 Set Correct Permissions

```bash
sudo chown -R hotel:www-data /opt/hotel/Front-end/dist/spa
sudo chown -R hotel:www-data /opt/hotel/Back-end/staticfiles
sudo chown -R hotel:hotel /opt/hotel/Back-end/media
sudo chmod -R 755 /opt/hotel/Front-end/dist/spa
sudo chmod -R 755 /opt/hotel/Back-end/staticfiles
sudo chmod -R 755 /opt/hotel/Back-end/media
```

---

## Step 19: Test the Application

### 19.1 Test Backend Health Endpoint

```bash
curl http://localhost:6000/health
# or
curl http://hotel.nntc.io/health
```
ALLOWED_HOSTS=localhost,127.0.0.1,hotel.nntc.io,www.hotel.nntc.io
Should return a response.

### 19.2 Test via Domain (HTTP)

```bash
curl http://hotel.nntc.io/health
```

Should return a response.

### 19.3 Test Frontend

Open your browser and navigate to:
```
http://hotel.nntc.io
```

You should see the Hotel application.

### 19.4 Test Django Admin Panel

Navigate to:
```
http://hotel.nntc.io/django-admin
```

Log in with the superuser credentials you created in Step 11.4.

**Note:** The custom admin panel (developed admin interface) is available at `/admin`, while Django's built-in admin is at `/django-admin`.

---

## Step 20: (Optional) Set Up SSL/HTTPS

### 20.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 20.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d hotel.nntc.io -d www.hotel.nntc.io
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 20.3 Update Environment Variables

After SSL is set up, update your `.env` file:

```bash
sudo su - hotel
cd /opt/hotel/Back-end
nano .env
```

Update:
```bash
SECURE_SSL_REDIRECT=True
CORS_ALLOWED_ORIGINS=https://hotel.nntc.io
CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,https://www.hotel.nntc.io
```

Restart the backend:
```bash
exit
sudo systemctl restart hotel-backend
```

### 20.4 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### 20.5 Test HTTPS

```bash
curl https://hotel.nntc.io/health
```

---

## Step 21: Set Up Automated Backups

### 21.1 Create Backup Script

```bash
sudo nano /opt/hotel/backup.sh
```

Add the following:

```bash
#!/bin/bash
BACKUP_DIR="/opt/hotel/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump hotel > $BACKUP_DIR/db_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /opt/hotel/Back-end/media

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 21.2 Make Script Executable

```bash
chmod +x /opt/hotel/backup.sh
```

### 21.3 Set Up Cron Job

```bash
crontab -e
```

Add this line to run daily at 2 AM:

```cron
0 2 * * * /opt/hotel/backup.sh >> /var/log/hotel/backup.log 2>&1
```

---

## Step 22: Final Verification

### 22.1 Check All Services

```bash
sudo systemctl status hotel-backend
sudo systemctl status nginx
sudo systemctl status postgresql
```

All should be `active (running)`.

### 22.2 Check Application Logs

```bash
tail -f /var/log/hotel/django.log
```

Press `Ctrl+C` to exit.

### 22.3 Test API Endpoints

```bash
# Health check
curl http://hotel.nntc.io/health

# API endpoint (will require authentication in production)
curl http://hotel.nntc.io/api/accommodations/
```

### 22.4 Verify Frontend

- Open `http://hotel.nntc.io` in your browser
- Test login functionality
- Navigate through the application
- Check that all pages load correctly
- Test reservation creation

---

## Troubleshooting

### Backend Service Won't Start

1. Check service status:
   ```bash
   sudo systemctl status hotel-backend
   ```

2. Check logs:
   ```bash
   sudo journalctl -u hotel-backend -n 50
   ```

3. Verify environment variables:
   ```bash
   sudo systemctl show hotel-backend | grep Environment
   ```

4. Test Django manually:
   ```bash
   cd /opt/hotel/Back-end
   source ../venv/bin/activate
   export $(cat .env | xargs)
   python manage.py check --deploy
   ```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Test connection:
   ```bash
   psql -U hotel -d hotel -h localhost
   ```

3. Check DATABASE_URL in `.env` file

4. Verify pg_hba.conf allows local connections:
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```
   Should have: `local   all             all                                     peer`

### Nginx 502 Bad Gateway

1. Check if backend is running:
   ```bash
   curl http://127.0.0.1:6000/health
   ```

2. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Verify upstream in nginx config points to correct port (6000)

### Static Files Not Loading

1. Verify static files collected:
   ```bash
   ls -la /opt/hotel/Back-end/staticfiles/
   ```

2. Check Nginx static file location:
   ```bash
   sudo nginx -T | grep static
   ```

3. Verify file permissions:
   ```bash
   ls -la /opt/hotel/Back-end/staticfiles/ | head
   ```

### Frontend Not Loading

1. Verify build directory exists:
   ```bash
   ls -la /opt/hotel/Front-end/dist/spa/
   ```

2. Check Nginx root directory:
   ```bash
   sudo nginx -T | grep root
   ```

3. Verify file permissions:
   ```bash
   ls -la /opt/hotel/Front-end/dist/spa/
   ```

4. Check that `VITE_API_BASE_URL` is set correctly in build

### Admin Panel (/) Not Found

If `/admin` returns "Not Found":

1. **Verify Nginx configuration includes explicit `/admin` location block:**
   ```bash
   sudo nginx -T | grep -A 5 "location /admin"
   ```
   Should show a location block that routes to the frontend SPA.

2. **Check that frontend is built and deployed:**
   ```bash
   ls -la /opt/hotel/Front-end/dist/spa/index.html
   ```
   The `index.html` file must exist.

3. **Verify the location block order in Nginx config:**
   - `/admin` location block should come before the general `location /` block
   - `/django-admin/` should proxy to backend
   - `/admin` should serve from frontend SPA

4. **Test the frontend build:**
   ```bash
   curl http://localhost/admin
   ```
   Should return the HTML content of `index.html`.

5. **Reload Nginx after configuration changes:**
   ```bash
   sudo nginx -t  # Test configuration
   sudo systemctl reload nginx  # Reload if test passes
   ```

### API Calls Fail

1. Check browser console for errors

2. Verify frontend config:
   - Check that `.env.production` has `VITE_API_BASE_URL=https://hotel.nntc.io`
   - Rebuild frontend after changing environment variables

3. Check CORS settings:
   ```bash
   cat /opt/hotel/Back-end/.env | grep CORS_ALLOWED_ORIGINS
   ```

### CSRF Verification Failed

1. **Add CSRF_TRUSTED_ORIGINS to `.env` file:**
   ```bash
   sudo su - hotel
   nano /opt/hotel/Back-end/.env
   ```

   Add or update:
   ```bash
   CSRF_TRUSTED_ORIGINS=https://hotel.nntc.io,http://hotel.nntc.io,https://www.hotel.nntc.io,http://www.hotel.nntc.io
   ```

   **Important:** Must include protocol (`http://` or `https://`) and no trailing slash.

2. **Restart the backend service:**
   ```bash
   exit
   sudo systemctl restart hotel-backend
   ```

3. **Verify CSRF settings are loaded:**
   ```bash
   sudo su - hotel
   cd /opt/hotel/Back-end
   source ../venv/bin/activate
   export $(cat .env | xargs)
   python manage.py shell
   ```

   In Django shell:
   ```python
   from django.conf import settings
   print(settings.CSRF_TRUSTED_ORIGINS)
   ```

**Note:** CSRF_TRUSTED_ORIGINS is now configured in `settings.py` and will automatically load from the `.env` file. Make sure to set it in your `.env` file for production.

---

## Updating the Application

### Backend Updates

```bash
sudo su - hotel
cd /opt/hotel

# Pull latest code
git pull origin main

# Update dependencies
source venv/bin/activate
cd Back-end
pip install -r requirements.txt

# Run migrations
export $(cat .env | xargs)
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart service
exit
sudo systemctl restart hotel-backend
```

### Frontend Updates

```bash
sudo su - hotel
cd /opt/hotel/Front-end

# Update dependencies
pnpm install

# Build
pnpm build

# No restart needed - nginx serves static files directly
```

---

## Security Checklist

- [ ] SECRET_KEY is set and secure (not default)
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS includes only `hotel.nntc.io` and `www.hotel.nntc.io`
- [ ] CORS_ALLOWED_ORIGINS is restricted to your domain
- [ ] CSRF_TRUSTED_ORIGINS is set correctly
- [ ] Database password is strong
- [ ] `.env` file has correct permissions: `chmod 600 /opt/hotel/Back-end/.env`
- [ ] Firewall is configured (UFW recommended)
- [ ] Regular security updates applied
- [ ] SSL certificate installed (recommended)
- [ ] Backups are automated and tested
- [ ] Logs are monitored
- [ ] Superuser password is strong

---

## Summary

After completing all steps:

✅ **Hotel application is deployed at:**
- Frontend: `http://hotel.nntc.io/` (or `https://hotel.nntc.io/` with SSL)
- API: `http://hotel.nntc.io/api`
- Custom Admin Panel: `http://hotel.nntc.io/admin` (developed admin interface)
- Django Admin: `http://hotel.nntc.io/django-admin` (Django built-in admin)
- Static files: `http://hotel.nntc.io/static/`
- Media files: `http://hotel.nntc.io/media/`

✅ **Services running:**
- Django backend on port 6000 (via Gunicorn)
- Nginx reverse proxy on ports 80/443
- PostgreSQL database

---

## Quick Command Reference

```bash
# Start backend
sudo systemctl start hotel-backend

# Stop backend
sudo systemctl stop hotel-backend

# Restart backend
sudo systemctl restart hotel-backend

# Check status
sudo systemctl status hotel-backend

# View logs
sudo journalctl -u hotel-backend -f

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View Django logs
tail -f /var/log/hotel/django.log

# View Gunicorn logs
tail -f /var/log/hotel/gunicorn-access.log
tail -f /var/log/hotel/gunicorn-error.log
```

---

## Important File Locations

```
/opt/hotel/
├── Back-end/
│   ├── .env                 # Environment configuration
│   ├── staticfiles/        # Collected static files
│   ├── media/              # User uploaded files
│   └── ...
├── Front-end/
│   └── dist/spa/           # Built frontend
├── venv/                   # Python virtual environment
└── backups/                # Database and media backups

/var/log/hotel/
├── django.log              # Django application logs
├── gunicorn-access.log     # Gunicorn access logs
└── gunicorn-error.log      # Gunicorn error logs
```

---

## Need Help?

- Check logs first (see Troubleshooting section)
- Verify all paths and ports match configuration
- Ensure environment variables are set correctly
- Test each component independently (backend, frontend, nginx)
- Review Django deployment checklist: https://docs.djangoproject.com/en/stable/howto/deployment/checklist/

---

**Deployment Complete!** 🎉

Your Hotel application should now be accessible at `http://hotel.nntc.io` (or `https://hotel.nntc.io` with SSL)

