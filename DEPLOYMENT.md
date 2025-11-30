# Deployment Instructions

## GitHub Repository Setup

The repository is already set up and available at:
**https://github.com/AliMohammadiiii/Hotel.git**

### Verify Remote Configuration

Check that the remote is configured correctly:

```bash
git remote -v
```

You should see:
```
origin  https://github.com/AliMohammadiiii/Hotel.git (fetch)
origin  https://github.com/AliMohammadiiii/Hotel.git (push)
```

### Push Updates

To push your latest changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Production Deployment

### Backend Deployment (hotel.nntc.io/api)

1. **SSH into your server**
2. **Clone the repository:**
   ```bash
   git clone https://github.com/AliMohammadiiii/Hotel.git
   cd Hotel/Back-end
   ```

3. **Set up Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   nano .env
   ```

5. **Generate SECRET_KEY:**
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```
   Copy the output and add it to `.env` as `SECRET_KEY=...`

6. **Set up database (PostgreSQL recommended):**
   ```bash
   # Install PostgreSQL if not already installed
   # Create database and user
   # Update DATABASE_URL in .env
   ```

7. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

8. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

9. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

10. **Run with Gunicorn:**
    ```bash
    gunicorn hotel_backend.wsgi:application --bind 0.0.0.0:6000 --workers 4
    ```

11. **Configure Nginx as reverse proxy:**
    ```nginx
    server {
        listen 80;
        server_name hotel.nntc.io;

        location /api {
            proxy_pass http://127.0.0.1:6000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /media {
            alias /path/to/Hotel/Back-end/media;
        }

        location /static {
            alias /path/to/Hotel/Back-end/staticfiles;
        }
    }
    ```

12. **Set up SSL with Let's Encrypt:**
    ```bash
    sudo certbot --nginx -d hotel.nntc.io
    ```

### Frontend Deployment (hotel.nntc.io)

#### Option 1: Netlify

1. **Connect repository to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect to your GitHub repository
   - Select the repository: **AliMohammadiiii/Hotel**

2. **Configure build settings:**
   - Base directory: `Front-end`
   - Build command: `pnpm build` or `npm run build`
   - Publish directory: `Front-end/dist/spa`

3. **Set environment variables:**
   - Go to Site settings > Environment variables
   - Add: `VITE_API_BASE_URL` = `https://hotel.nntc.io/api`

4. **Deploy:**
   - Netlify will automatically deploy on push to main branch

#### Option 2: Vercel

1. **Connect repository to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository: **AliMohammadiiii/Hotel**

2. **Configure project:**
   - Root directory: `Front-end`
   - Build command: `pnpm build`
   - Output directory: `dist/spa`

3. **Set environment variables:**
   - Add: `VITE_API_BASE_URL` = `https://hotel.nntc.io/api`

#### Option 3: Manual Server Deployment

1. **Build the frontend:**
   ```bash
   cd Front-end
   pnpm install
   VITE_API_BASE_URL=https://hotel.nntc.io/api pnpm build
   ```

2. **Deploy dist/spa to your web server:**
   - Copy contents of `dist/spa/` to your web server
   - Configure Nginx to serve the static files:

   ```nginx
   server {
       listen 80;
       server_name hotel.nntc.io;

       root /path/to/dist/spa;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://127.0.0.1:6000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## Post-Deployment Checklist

- [ ] Backend API is accessible at `https://hotel.nntc.io/api`
- [ ] Frontend is accessible at `https://hotel.nntc.io`
- [ ] SSL certificates are valid
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] Database migrations are applied
- [ ] Static files are being served
- [ ] Media files are accessible
- [ ] Admin panel is accessible
- [ ] Authentication is working
- [ ] Reservations can be created
- [ ] All API endpoints are responding

## Troubleshooting

### Backend Issues

- **500 Internal Server Error:** Check Django logs and ensure all environment variables are set
- **Static files not loading:** Run `python manage.py collectstatic` and check STATIC_ROOT
- **Database errors:** Verify DATABASE_URL and database permissions
- **CORS errors:** Check CORS_ALLOWED_ORIGINS in .env

### Frontend Issues

- **API connection errors:** Verify VITE_API_BASE_URL is set correctly
- **Build failures:** Check Node.js version (18+) and run `pnpm install`
- **Routing issues:** Ensure server is configured to serve index.html for all routes

## Maintenance

### Updating the Application

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Backend:**
   ```bash
   cd Back-end
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py collectstatic --noinput
   # Restart Gunicorn
   ```

3. **Frontend:**
   - If using Netlify/Vercel: Push to main branch (auto-deploy)
   - If manual: Rebuild and redeploy

### Backup

- **Database:** Set up regular PostgreSQL backups
- **Media files:** Backup `Back-end/media/` directory regularly
- **Code:** Already in Git, but consider additional backups

