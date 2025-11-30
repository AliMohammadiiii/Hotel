"""
Configuration for Injast SSO integration.
All values use python-decouple with placeholder defaults for development.
"""
from decouple import config, Csv
from django.conf import settings


# Injast backend base URL
INJAST_BACKEND_URL = config(
    'INJAST_BACKEND_URL',
    default='https://api.injast.life'
)

# JWKS endpoint URL (auto-constructed from base URL if not provided)
INJAST_JWKS_URL = config(
    'INJAST_JWKS_URL',
    default=None
)

# If JWKS URL not provided, construct it from base URL
if not INJAST_JWKS_URL:
    base_url = INJAST_BACKEND_URL.rstrip('/')
    INJAST_JWKS_URL = f"{base_url}/.well-known/jwks.json"

# IP whitelist for backend-to-backend calls (optional)
INJAST_ALLOWED_IPS = config(
    'INJAST_ALLOWED_IPS',
    default='',
    cast=Csv()
)

# API Key or authentication token for backend-to-backend calls (if required)
INJAST_API_KEY = config('INJAST_API_KEY', default=None)
INJAST_API_SECRET = config('INJAST_API_SECRET', default=None)

# Token validation settings
INJAST_JWT_AUDIENCE = config('INJAST_JWT_AUDIENCE', default='injast')
INJAST_JWT_ALGORITHM = config('INJAST_JWT_ALGORITHM', default='EdDSA')

# JWKS cache settings
INJAST_JWKS_CACHE_TTL = config('INJAST_JWKS_CACHE_TTL', default=3600, cast=int)  # 1 hour

# Session code exchange endpoint
INJAST_EXCHANGE_SESSION_CODE_URL = f"{INJAST_BACKEND_URL.rstrip('/')}/service/user/sso/exchange-session-code"

# User info endpoints
INJAST_USER_BASIC_URL = f"{INJAST_BACKEND_URL.rstrip('/')}/service/user/sso/user-basic"
INJAST_USER_BANKING_URL = f"{INJAST_BACKEND_URL.rstrip('/')}/service/user/sso/user-banking"

