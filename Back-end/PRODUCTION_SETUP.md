# Production Setup Guide

This guide will help you configure the Django backend for production deployment.

## Environment Variables

Create a `.env` file in the `Back-end` directory with the following variables:

```env
# Django Settings
# SECURITY WARNING: Generate a new secret key for production!
# You can generate one using: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=your-secret-key-here

# Set to False in production
DEBUG=False

# Comma-separated list of allowed hosts (e.g., example.com,www.example.com)
ALLOWED_HOSTS=example.com,www.example.com

# CORS allowed origins (comma-separated)
# In production, specify your frontend domain(s)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# CORS credentials
CORS_ALLOW_CREDENTIALS=True

# SSL/HTTPS settings (optional, defaults to True when DEBUG=False)
SECURE_SSL_REDIRECT=True
```

## Installation Steps

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Generate a new SECRET_KEY:**
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```
   Copy the output and set it as `SECRET_KEY` in your `.env` file.

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

6. **Create a superuser (if needed):**
   ```bash
   python manage.py createsuperuser
   ```

## Security Checklist

- [ ] `DEBUG=False` in production
- [ ] `SECRET_KEY` is set to a secure random value
- [ ] `ALLOWED_HOSTS` includes your production domain(s)
- [ ] `CORS_ALLOWED_ORIGINS` includes your frontend domain(s)
- [ ] SSL/HTTPS is enabled
- [ ] Database is configured for production (not SQLite)
- [ ] Static files are served by a web server (nginx, Apache, etc.)
- [ ] Media files are served securely
- [ ] Environment variables are not committed to version control

## Production Deployment

For production deployment, consider:

1. **Use a production database** (PostgreSQL, MySQL, etc.) instead of SQLite
2. **Use a production web server** (Gunicorn, uWSGI) with a reverse proxy (nginx, Apache)
3. **Set up proper logging** and monitoring
4. **Configure backup strategies** for your database and media files
5. **Use environment-specific settings** if needed

## Example Production Settings

For a production database (PostgreSQL), add to your `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

Then update `settings.py` to use `dj-database-url` or configure `DATABASES` manually.



