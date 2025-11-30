# Hotel Booking Application

A full-stack hotel booking application with Django REST Framework backend and React frontend, featuring accommodation management, reservations, and SSO integration.

## Project Structure

```
Hotel/
├── Back-end/          # Django REST API
├── Front-end/         # React + Vite application
├── Icons/            # SVG icons for amenities
├── Images/           # Accommodation images
└── docs/             # Documentation
```

## Features

- **Accommodation Management**: Browse and manage hotel accommodations with detailed information
- **Reservation System**: Create and manage bookings with date availability checking
- **Admin Panel**: Full admin interface for managing accommodations, amenities, and reservations
- **SSO Integration**: Injast SSO integration for authentication
- **JWT Authentication**: Secure token-based authentication
- **Media Management**: Image upload and management for accommodations
- **Room Availability**: Dynamic pricing and availability management

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 18+ and pnpm (for frontend)
- PostgreSQL (recommended for production) or SQLite (for development)

## Backend Setup

### 1. Install Dependencies

```bash
cd Back-end
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
# Generate a new secret key for production
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
ALLOWED_HOSTS=hotel.nntc.io,www.hotel.nntc.io
CORS_ALLOWED_ORIGINS=https://hotel.nntc.io,https://www.hotel.nntc.io
CORS_ALLOW_CREDENTIALS=True
SECURE_SSL_REDIRECT=True
```

**Generate a SECRET_KEY:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Database Setup

For development (SQLite):
```bash
python manage.py migrate
```

For production (PostgreSQL), configure `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### 4. Create Superuser

```bash
python manage.py createsuperuser
```

### 5. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:6000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd Front-end
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your API URL:

```env
VITE_API_BASE_URL=https://hotel.nntc.io/api
```

For local development:
```env
VITE_API_BASE_URL=http://localhost:6000
```

### 3. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:6001`

### 4. Build for Production

```bash
pnpm build
```

The production build will be in `dist/spa/`

## Production Deployment

### Backend Deployment

1. **Set up production environment variables** in `.env` file
2. **Use a production database** (PostgreSQL recommended)
3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```
4. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```
5. **Run with Gunicorn:**
   ```bash
   gunicorn hotel_backend.wsgi:application --bind 0.0.0.0:6000 --workers 4
   ```
6. **Configure reverse proxy** (nginx/Apache) to serve the application
7. **Set up SSL certificates** for HTTPS

### Frontend Deployment

1. **Set environment variable** `VITE_API_BASE_URL` in your deployment platform
2. **Build the application:**
   ```bash
   pnpm build
   ```
3. **Deploy the `dist/spa/` directory** to your hosting service (Netlify, Vercel, etc.)

#### Netlify Deployment

The project includes `netlify.toml` configuration. Set the build environment variable:
- `VITE_API_BASE_URL=https://hotel.nntc.io/api`

## API Endpoints

### Public Endpoints
- `GET /api/accommodations/` - List accommodations
- `GET /api/accommodations/{id}/` - Get accommodation details
- `GET /api/accommodations/{id}/unavailable-dates/` - Get unavailable dates

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user

### Reservation Endpoints (Authenticated)
- `GET /api/reservations/` - List user reservations
- `POST /api/reservations/` - Create reservation
- `GET /api/reservations/{id}/` - Get reservation details
- `PUT /api/reservations/{id}/` - Update reservation
- `DELETE /api/reservations/{id}/` - Cancel reservation

### Admin Endpoints (Admin only)
- `/api/admin/accommodations/` - Manage accommodations
- `/api/admin/amenities/` - Manage amenities
- `/api/admin/reservations/` - Manage all reservations
- `/api/admin/room-availability/` - Manage room availability

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key | Yes |
| `DEBUG` | Debug mode (False for production) | Yes |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts | Yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of CORS origins | Yes |
| `CORS_ALLOW_CREDENTIALS` | Allow CORS credentials | Yes |
| `SECURE_SSL_REDIRECT` | Redirect HTTP to HTTPS | Yes (production) |
| `INJAST_BACKEND_URL` | Injast SSO backend URL | Optional |
| `INJAST_JWKS_URL` | Injast JWKS URL | Optional |
| `INJAST_TOKEN_ENCRYPTION_KEY` | Token encryption key | Optional |
| `DATABASE_URL` | Database connection string | Optional |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |

## Security Checklist

- [ ] `DEBUG=False` in production
- [ ] `SECRET_KEY` is set to a secure random value
- [ ] `ALLOWED_HOSTS` includes your production domain(s)
- [ ] `CORS_ALLOWED_ORIGINS` includes your frontend domain(s)
- [ ] SSL/HTTPS is enabled
- [ ] Database is configured for production (not SQLite)
- [ ] Static files are served by a web server or WhiteNoise
- [ ] Media files are served securely
- [ ] Environment variables are not committed to version control
- [ ] Regular security updates are performed

## Development Workflow

1. **Backend Development:**
   ```bash
   cd Back-end
   python manage.py runserver
   ```

2. **Frontend Development:**
   ```bash
   cd Front-end
   pnpm dev
   ```

3. **Running Migrations:**
   ```bash
   cd Back-end
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Creating Superuser:**
   ```bash
   cd Back-end
   python manage.py createsuperuser
   ```

## Technology Stack

### Backend
- Django 5.2.8
- Django REST Framework
- Django CORS Headers
- JWT Authentication (djangorestframework-simplejwt)
- WhiteNoise (static file serving)
- Gunicorn (production WSGI server)
- Python Decouple (environment variables)

### Frontend
- React 18
- Vite 7
- TypeScript
- React Router
- TanStack Query
- Radix UI Components
- Tailwind CSS
- React Hook Form

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on GitHub.

## Deployment URL

Production: https://hotel.nntc.io
API: https://hotel.nntc.io/api
