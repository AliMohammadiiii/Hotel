# Injast SSO Integration Documentation

## Overview

This document describes the Injast SSO (Single Sign-On) integration for the Hotel application. The integration allows users to authenticate using their Injast SuperApp credentials, enabling seamless login across the Injast ecosystem.

## Architecture

### Flow Diagram

```
┌─────────────────┐
│ Injast SuperApp │
│   (Host App)    │
└────────┬────────┘
         │
         │ 1. User initiates login
         │ 2. Generate session code (15min TTL)
         │
         ▼
┌─────────────────┐
│  Guest App      │
│  (This App)     │
└────────┬────────┘
         │
         │ 3. Receive session_code via URL param
         │
         ▼
┌─────────────────┐
│  Frontend        │
│  (React/Vite)    │
└────────┬────────┘
         │
         │ 4. POST /api/auth/injast/callback/
         │    { session_code: "..." }
         │
         ▼
┌─────────────────┐
│  Backend         │
│  (Django)       │
└────────┬────────┘
         │
         │ 5. Exchange session_code for JWT
         │    POST /service/user/sso/exchange-session-code
         │
         ▼
┌─────────────────┐
│  Injast Backend │
└────────┬────────┘
         │
         │ 6. Return access_token (JWT)
         │
         ▼
┌─────────────────┐
│  Backend         │
│  (Django)       │
└────────┬────────┘
         │
         │ 7. Validate JWT signature (JWKS)
         │ 8. Fetch user data (/sso/user-basic)
         │ 9. Create/update local user
         │ 10. Generate local JWT tokens
         │
         ▼
┌─────────────────┐
│  Frontend        │
│  (React/Vite)    │
└─────────────────┘
         │
         │ 11. Store tokens, redirect to app
```

## Components

### Backend Components

#### 1. Django App: `sso_integration/`

**Models** (`models.py`):
- `InjastUser`: Stores Injast user information linked to Django User
  - OneToOne relationship with Django User
  - National ID (unique identifier)
  - Encrypted access token storage
  - Mobile number and country code
  - Token expiration tracking
  - Last sync timestamp

**Services** (`services.py`):
- `InjastTokenValidator`: Validates JWT tokens using JWKS
- `InjastAPIClient`: HTTP client for Injast API endpoints
- `UserSyncService`: Creates/updates Django users from Injast data

**Views** (`views.py`):
- `injast_callback_view`: Handles session code exchange
- `injast_user_info_view`: Returns Injast-linked user info

**Configuration** (`config.py`):
- All settings use `python-decouple` with placeholder defaults
- Configurable via environment variables

#### 2. API Endpoints

- `POST /api/auth/injast/callback/`: Exchange session code for tokens
- `GET /api/auth/injast/user-info/`: Get Injast user information (authenticated)

### Frontend Components

#### 1. Auth Utilities (`lib/injastAuth.ts`)

Functions:
- `isInjastSessionCode(url)`: Detects session code in URL
- `extractSessionCode(url)`: Extracts session code from URL
- `handleInjastCallback(sessionCode)`: Processes SSO callback

#### 2. Auth Hook (`hooks/useAuth.tsx`)

Added method:
- `loginWithInjast(sessionCode)`: Authenticates user via Injast SSO

#### 3. Pages

- `Login.tsx`: Updated with Injast SSO button and auto-detection
- `InjastCallback.tsx`: Handles SSO callback with loading/error states

## Configuration

### Environment Variables

Create a `.env` file in the `Back-end/` directory with the following variables:

```bash
# Required: Injast backend base URL
INJAST_BACKEND_URL=https://injast-api.example.com

# Optional: Override JWKS URL (auto-constructed if not provided)
# INJAST_JWKS_URL=https://injast-api.example.com/.well-known/jwks.json

# Optional: IP whitelist for backend-to-backend calls
# INJAST_ALLOWED_IPS=192.168.1.1,10.0.0.1

# Optional: JWT validation settings
# INJAST_JWT_AUDIENCE=sso
# INJAST_JWT_ALGORITHM=RS256
# INJAST_JWKS_CACHE_TTL=3600

# Optional: Token encryption key
# Generate using: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# INJAST_TOKEN_ENCRYPTION_KEY=your-encryption-key-here
```

### Placeholder Values

All configuration uses placeholder defaults for development:
- `INJAST_BACKEND_URL`: `https://injast-api.example.com`
- Other settings have sensible defaults

**Important**: Replace placeholder values with actual Injast credentials when provided.

## Installation & Setup

### 1. Install Dependencies

```bash
cd Back-end
source venv/bin/activate
pip install -r requirements.txt
```

New dependencies added:
- `PyJWT[crypto]`: JWT token validation
- `cryptography`: Token encryption and JWKS handling
- `requests`: HTTP client for Injast API

### 2. Run Migrations

```bash
python manage.py migrate sso_integration
```

### 3. Configure Environment

1. Copy `.env.example` to `.env` (if it exists) or create `.env` file
2. Update `INJAST_BACKEND_URL` with actual Injast backend URL
3. (Optional) Generate and set `INJAST_TOKEN_ENCRYPTION_KEY`

### 4. Generate Encryption Key (Optional but Recommended)

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Add the output to `.env` as `INJAST_TOKEN_ENCRYPTION_KEY`.

## Usage

### User Flow

1. User opens the app from Injast SuperApp
2. Injast SuperApp generates a session code and opens the app with `?session_code=...`
3. Frontend detects the session code automatically
4. Frontend calls `/api/auth/injast/callback/` with the session code
5. Backend exchanges code for Injast JWT token
6. Backend validates token and fetches user data
7. Backend creates/updates local user account
8. Backend returns local JWT tokens
9. Frontend stores tokens and redirects user to the app

### Manual Testing

To test the integration manually:

1. Start the backend server:
   ```bash
   cd Back-end
   python manage.py runserver
   ```

2. Start the frontend:
   ```bash
   cd Front-end
   npm run dev
   ```

3. Simulate Injast callback by visiting:
   ```
   http://localhost:3000/auth/injast/callback?session_code=test-session-code-123
   ```

**Note**: This will fail with placeholder Injast backend URL. Use actual Injast credentials for real testing.

## Security Considerations

### Token Storage

- Injast access tokens are stored encrypted in the database
- Encryption uses Fernet (symmetric encryption)
- Encryption key should be stored securely in environment variables

### Token Validation

- JWT signatures are validated using JWKS (JSON Web Key Set)
- JWKS keys are cached with TTL to reduce API calls
- Token expiration is checked on every validation
- Audience and issuer are validated

### Replay Protection

- Session codes are one-time use (15-minute expiration)
- Injast backend tracks used session codes
- Local tokens have expiration times

### IP Whitelisting

- Optional IP whitelist for backend-to-backend calls
- Configure via `INJAST_ALLOWED_IPS` environment variable

### HTTPS Requirements

- All communication with Injast backend should use HTTPS
- Local tokens should be transmitted over HTTPS in production

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch JWKS"

**Cause**: Cannot reach Injast JWKS endpoint

**Solutions**:
- Verify `INJAST_BACKEND_URL` is correct
- Check network connectivity
- Verify JWKS endpoint is accessible: `{INJAST_BACKEND_URL}/.well-known/jwks.json`

#### 2. "Token validation failed"

**Cause**: Invalid JWT signature or expired token

**Solutions**:
- Check token expiration
- Verify JWKS keys are up to date
- Clear JWKS cache if keys rotated

#### 3. "Session code exchange failed"

**Cause**: Invalid or expired session code

**Solutions**:
- Session codes expire after 15 minutes
- Ensure session code is used only once
- Verify session code format

#### 4. "User creation failed"

**Cause**: Missing required fields or database error

**Solutions**:
- Check database connection
- Verify national_id is provided in JWT payload
- Check user data from Injast API

#### 5. Encryption errors

**Cause**: Missing or invalid encryption key

**Solutions**:
- Generate encryption key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
- Set `INJAST_TOKEN_ENCRYPTION_KEY` in `.env`
- Ensure key is consistent across deployments

### Debugging

Enable Django logging to see detailed SSO flow:

```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'sso_integration': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Testing

### Unit Tests

Run SSO integration tests:

```bash
cd Back-end
python manage.py test sso_integration
```

Tests cover:
- Token validation
- Session code exchange (mocked)
- User creation/update
- Error handling

### Integration Testing

For full integration testing:
1. Obtain actual Injast credentials
2. Update `.env` with real values
3. Test end-to-end flow from Injast SuperApp

## API Reference

### POST /api/auth/injast/callback/

Exchange session code for local JWT tokens.

**Request**:
```json
{
  "session_code": "2fcc8778-222d-4618-ad30-75a9b0d6fb88"
}
```

**Response** (Success):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "injast_0012345678",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response** (Error):
```json
{
  "error": "SSO authentication failed",
  "message": "Session code is invalid"
}
```

### GET /api/auth/injast/user-info/

Get Injast-linked user information (requires authentication).

**Response**:
```json
{
  "id": 1,
  "user_id": 1,
  "username": "injast_0012345678",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "national_id": "0012345678",
  "mobile_number": "9121234567",
  "mobile_country_code": "98",
  "last_synced_at": "2024-01-01T12:00:00Z",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

## Maintenance

### Token Refresh

Injast access tokens are stored with expiration times. The system automatically checks expiration when validating tokens.

### User Sync

User data is synced from Injast on every SSO login. To manually sync:

1. User logs in via Injast SSO
2. Backend fetches latest user data
3. Local user record is updated

### Key Rotation

If Injast rotates JWKS keys:
1. Clear JWKS cache (restart server or wait for TTL)
2. System will automatically fetch new keys

## Support

For issues or questions:
1. Check this documentation
2. Review Django logs
3. Contact Injast support for API-related issues

## Changelog

### Initial Implementation
- Full SSO integration with Injast
- JWT validation using JWKS
- Encrypted token storage
- User creation/update from Injast data
- Frontend auto-detection and callback handling


