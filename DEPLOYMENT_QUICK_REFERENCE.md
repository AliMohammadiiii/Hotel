# Hotel Application - Quick Deployment Reference

Quick reference guide for deploying Hotel application to `hotel.innovation.io`.

## Prerequisites

- Ubuntu 20.04+ server
- Root/sudo access
- Domain `hotel.innovation.io` pointing to server IP

## Quick Setup Commands

### 1. Server Setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv postgresql postgresql-contrib nginx git curl build-essential libpq-dev
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm
```

### 2. Create User and Database

```bash
sudo adduser --disabled-password --gecos "" hotel
sudo mkdir -p /opt/hotel /var/log/hotel
sudo chown hotel:hotel /opt/hotel /var/log/hotel

# Create PostgreSQL database
sudo -u postgres psql << EOF
CREATE DATABASE hotel;
CREATE USER hotel WITH PASSWORD 'your-secure-password';
ALTER ROLE hotel SET client_encoding TO 'utf8';
ALTER ROLE hotel SET default_transaction_isolation TO 'read committed';
ALTER ROLE hotel SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE hotel TO hotel;
\q
EOF
```

### 3. Clone and Setup Backend

```bash
sudo su - hotel
cd /opt/hotel
git clone https://github.com/AliMohammadiiii/Hotel.git .
python3.11 -m venv venv
source venv/bin/activate
cd Back-end
pip install --upgrade pip
pip install -r requirements.txt
pip install dj-database-url==2.1.0  # Add PostgreSQL support
```

### 4. Configure Environment

```bash
cd /opt/hotel/Back-end
cat > .env << 'EOF'
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
DEBUG=False
ALLOWED_HOSTS=hotel.innovation.io,www.hotel.innovation.io,127.0.0.1,localhost
DATABASE_URL=postgresql://hotel:your-secure-password@localhost:5432/hotel
CORS_ALLOWED_ORIGINS=https://hotel.innovation.io,http://hotel.innovation.io
CSRF_TRUSTED_ORIGINS=https://hotel.innovation.io,http://hotel.innovation.io,https://www.hotel.innovation.io,http://www.hotel.innovation.io
STATIC_ROOT=/opt/hotel/Back-end/staticfiles
MEDIA_ROOT=/opt/hotel/Back-end/media
LOG_FILE=/var/log/hotel/django.log
SECURE_SSL_REDIRECT=False
EOF

# Generate SECRET_KEY
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" .env
```

### 5. Update settings.py for PostgreSQL

Add to `/opt/hotel/Back-end/hotel_backend/settings.py` after imports:

```python
import dj_database_url
```

Replace DATABASES section with:

```python
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///' + str(BASE_DIR / 'db.sqlite3'))
    )
}
```

### 6. Run Migrations

```bash
cd /opt/hotel/Back-end
source ../venv/bin/activate
export $(cat .env | xargs)
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 7. Create Systemd Service

```bash
exit  # Exit hotel user
sudo nano /etc/systemd/system/hotel-backend.service
```

Paste:

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
Environment="DJANGO_ALLOWED_HOSTS=hotel.innovation.io,www.hotel.innovation.io,127.0.0.1,localhost"
ExecStart=/opt/hotel/venv/bin/gunicorn \
    --workers 3 \
    --timeout 120 \
    --bind 127.0.0.1:6000 \
    --access-logfile /var/log/hotel/gunicorn-access.log \
    --error-logfile /var/log/hotel/gunicorn-error.log \
    --log-level info \
    hotel_backend.wsgi:application
Restart=on-failure
RestartSec=10
MemoryMax=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable hotel-backend
sudo systemctl start hotel-backend
```

### 8. Build Frontend

```bash
sudo su - hotel
cd /opt/hotel/Front-end
pnpm install
echo "VITE_API_BASE_URL=https://hotel.innovation.io" > .env.production
pnpm build
```

### 9. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/hotel
```

Paste:

```nginx
upstream hotel_backend {
    server 127.0.0.1:6000;
}

server {
    listen 80;
    server_name hotel.innovation.io www.hotel.innovation.io;
    client_max_body_size 20M;

    location /static/ {
        alias /opt/hotel/Back-end/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /opt/hotel/Back-end/media/;
        expires 7d;
    }

    location /api/ {
        proxy_pass http://hotel_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://hotel_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /opt/hotel/Front-end/dist/spa;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hotel /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 10. Set Permissions

```bash
sudo chown -R hotel:www-data /opt/hotel/Front-end/dist/spa
sudo chown -R hotel:www-data /opt/hotel/Back-end/staticfiles
sudo chown -R hotel:hotel /opt/hotel/Back-end/media
```

### 11. SSL (Optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hotel.innovation.io -d www.hotel.innovation.io
```

## Common Commands

```bash
# Restart backend
sudo systemctl restart hotel-backend

# View backend logs
sudo journalctl -u hotel-backend -f

# View Django logs
tail -f /var/log/hotel/django.log

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Update application
sudo su - hotel
cd /opt/hotel
git pull
source venv/bin/activate
cd Back-end
pip install -r requirements.txt
export $(cat .env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput
exit
sudo systemctl restart hotel-backend
```

## Troubleshooting

- **502 Bad Gateway**: Check if backend is running: `sudo systemctl status hotel-backend`
- **Static files not loading**: Run `python manage.py collectstatic --noinput`
- **Database errors**: Check DATABASE_URL in `.env` and PostgreSQL status
- **CORS errors**: Verify CORS_ALLOWED_ORIGINS in `.env`

## File Locations

- Application: `/opt/hotel`
- Backend: `/opt/hotel/Back-end`
- Frontend: `/opt/hotel/Front-end/dist/spa`
- Logs: `/var/log/hotel`
- Environment: `/opt/hotel/Back-end/.env`

