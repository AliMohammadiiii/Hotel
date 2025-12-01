# Local Development Guide

Quick guide to run the Hotel application locally on your machine.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ and pnpm installed
- Git installed

## Quick Start

### 1. Backend Setup (Port 6000)

```bash
# Navigate to backend directory
cd Back-end

# Create and activate virtual environment (if not already done)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file for local development
cat > .env << EOF
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:6001,http://127.0.0.1:6001
CORS_ALLOW_CREDENTIALS=True
EOF

# Run database migrations
python manage.py migrate

# (Optional) Create a superuser for admin access
python manage.py createsuperuser

# Run the development server on port 6000
python manage.py runserver 6000
```

The backend API will be available at: **http://localhost:6000**

### 2. Frontend Setup (Port 6001)

Open a **new terminal window** and run:

```bash
# Navigate to frontend directory
cd Front-end

# Install dependencies
pnpm install

# Create .env file for local development
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:6000
EOF

# Run the development server
pnpm dev
```

The frontend will be available at: **http://localhost:6001**

## Running Both Services

You need **two terminal windows**:

### Terminal 1 - Backend:
```bash
cd Back-end
source venv/bin/activate
python manage.py runserver 6000
```

### Terminal 2 - Frontend:
```bash
cd Front-end
pnpm dev
```

## Access Points

- **Frontend Application**: http://localhost:6001
- **Backend API**: http://localhost:6000
- **Admin Panel**: http://localhost:6000/admin (if you created a superuser)

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Kill process on port 6000 (macOS/Linux)
lsof -ti:6000 | xargs kill -9

# Or use a different port
python manage.py runserver 6001
```

**Module not found errors:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Database errors:**
```bash
# Run migrations
python manage.py migrate

# If issues persist, delete db.sqlite3 and migrate again
rm db.sqlite3
python manage.py migrate
```

### Frontend Issues

**Port already in use:**
```bash
# Kill process on port 6001 (macOS/Linux)
lsof -ti:6001 | xargs kill -9

# Or edit vite.config.ts to use a different port
```

**Dependencies not installed:**
```bash
# Make sure pnpm is installed
npm install -g pnpm

# Install dependencies
pnpm install
```

**API connection errors:**
- Make sure backend is running on port 6000
- Check that `.env` file has: `VITE_API_BASE_URL=http://localhost:6000`
- Restart the frontend dev server after changing .env

### CORS Errors

If you see CORS errors, make sure your backend `.env` includes:
```
CORS_ALLOWED_ORIGINS=http://localhost:6001,http://127.0.0.1:6001
```

## Development Workflow

1. **Start Backend** (Terminal 1)
2. **Start Frontend** (Terminal 2)
3. **Open Browser** to http://localhost:6001
4. **Make Changes** - Both servers support hot reload
5. **Check Backend Logs** in Terminal 1 for API requests
6. **Check Frontend Console** in browser DevTools for errors

## Useful Commands

### Backend
```bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Access Django shell
python manage.py shell

# Check for issues
python manage.py check
```

### Frontend
```bash
# Install new package
pnpm add package-name

# Build for production
pnpm build

# Type check
pnpm typecheck

# Format code
pnpm format.fix
```

## Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:6001,http://127.0.0.1:6001
CORS_ALLOW_CREDENTIALS=True
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:6000
```

## Next Steps

- Read the main [README.md](README.md) for detailed setup
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Review the API endpoints in the README




