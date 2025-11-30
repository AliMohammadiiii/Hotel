# Hotel Application Deployment Documentation

This directory contains comprehensive deployment guides for the Hotel application.

## Available Guides

### 📘 [DEPLOYMENT_HOTEL_INNOVATION_IO.md](./DEPLOYMENT_HOTEL_INNOVATION_IO.md)
**Complete Step-by-Step Deployment Guide**

The most comprehensive guide with detailed instructions for deploying the Hotel application to `hotel.innovation.io`. This guide includes:
- Complete server setup
- PostgreSQL database configuration
- Django backend setup with Gunicorn
- Frontend build and deployment
- Nginx reverse proxy configuration
- SSL/HTTPS setup
- Security best practices
- Troubleshooting guide
- Maintenance procedures

**Use this guide if:** You're deploying for the first time or need detailed step-by-step instructions.

---

### ⚡ [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)
**Quick Reference Guide**

A condensed version with essential commands and configurations for quick deployment. Perfect for experienced DevOps engineers or when you need to deploy quickly.

**Use this guide if:** You're familiar with Django deployments and need a quick checklist.

---

### 📋 [DEPLOYMENT.md](./DEPLOYMENT.md)
**Original Deployment Guide**

The original deployment documentation with general instructions. Contains useful information about GitHub setup and deployment options.

**Use this guide if:** You need information about repository setup or alternative deployment methods (Netlify, Vercel).

---

## Quick Start

For a first-time deployment to `hotel.innovation.io`, follow this order:

1. **Read:** [DEPLOYMENT_HOTEL_INNOVATION_IO.md](./DEPLOYMENT_HOTEL_INNOVATION_IO.md) - Complete guide
2. **Reference:** [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md) - Quick commands
3. **Troubleshoot:** Check the troubleshooting section in the main guide

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              hotel.innovation.io                 │
│                  (Nginx)                         │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│  Frontend SPA  │    │  Django Backend  │
│  (Static)      │    │  (Gunicorn)      │
│  Port: 80/443  │    │  Port: 6000      │
└────────────────┘    └──────────────────┘
                              │
                      ┌───────▼───────┐
                      │  PostgreSQL   │
                      │  Port: 5432   │
                      └───────────────┘
```

## Key Configuration Points

### Backend
- **Port:** 6000 (Gunicorn)
- **User:** `hotel`
- **Directory:** `/opt/hotel/Back-end`
- **Environment:** `/opt/hotel/Back-end/.env`
- **Service:** `hotel-backend.service`

### Frontend
- **Build Output:** `/opt/hotel/Front-end/dist/spa`
- **API Base URL:** `https://hotel.innovation.io` (set in `.env.production`)
- **Package Manager:** `pnpm`

### Database
- **Type:** PostgreSQL (production)
- **Database:** `hotel`
- **User:** `hotel`
- **Connection:** Via `DATABASE_URL` in `.env`

### Nginx
- **Config:** `/etc/nginx/sites-available/hotel`
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **Domain:** `hotel.innovation.io`

## Environment Variables

### Backend (.env)
```bash
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=hotel.innovation.io,www.hotel.innovation.io,127.0.0.1,localhost
DATABASE_URL=postgresql://hotel:password@localhost:5432/hotel
CORS_ALLOWED_ORIGINS=https://hotel.innovation.io,http://hotel.innovation.io
CSRF_TRUSTED_ORIGINS=https://hotel.innovation.io,http://hotel.innovation.io
STATIC_ROOT=/opt/hotel/Back-end/staticfiles
MEDIA_ROOT=/opt/hotel/Back-end/media
SECURE_SSL_REDIRECT=False  # Set to True after SSL setup
```

### Frontend (.env.production)
```bash
VITE_API_BASE_URL=https://hotel.innovation.io
```

## Common Tasks

### Update Application
```bash
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

### View Logs
```bash
# Backend logs
sudo journalctl -u hotel-backend -f

# Django logs
tail -f /var/log/hotel/django.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart hotel-backend
sudo systemctl restart nginx
```

## Security Checklist

Before going live, ensure:

- [ ] `SECRET_KEY` is set and secure
- [ ] `DEBUG=False` in production
- [ ] `ALLOWED_HOSTS` is restricted
- [ ] `CORS_ALLOWED_ORIGINS` is restricted
- [ ] `CSRF_TRUSTED_ORIGINS` is set correctly
- [ ] Database password is strong
- [ ] SSL certificate is installed
- [ ] Firewall is configured
- [ ] `.env` file permissions: `chmod 600`
- [ ] Regular backups are configured

## Support

- **Repository:** https://github.com/AliMohammadiiii/Hotel
- **Django Docs:** https://docs.djangoproject.com/
- **Nginx Docs:** https://nginx.org/en/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

## Related Documentation

- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local development setup
- [PRODUCTION_SETUP.md](./Back-end/PRODUCTION_SETUP.md) - Backend production configuration
- [README.md](./README.md) - Project overview

---

**Last Updated:** 2024
**Application:** Hotel Management System
**Target Domain:** hotel.innovation.io

