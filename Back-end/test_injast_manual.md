# Manual Testing Guide for Injast SSO

## Quick Test Scripts

### 1. Simple Token Test (No Signature Validation)

```bash
cd Back-end
source venv/bin/activate
python test_injast_token_simple.py
```

This script:
- Decodes your JWT token (without signature validation)
- Attempts to fetch user data from Injast API
- Creates/updates a Django user from the token data

### 2. Full Token Test (With Signature Validation)

```bash
python test_injast_token.py
```

This script validates the token signature using JWKS (requires JWKS endpoint to be available).

## Testing the Full SSO Flow

### Option 1: Test via Frontend

1. Start the backend:
   ```bash
   cd Back-end
   source venv/bin/activate
   python manage.py runserver
   ```

2. Start the frontend:
   ```bash
   cd Front-end
   npm run dev
   ```

3. Simulate Injast callback by visiting:
   ```
   http://localhost:3000/auth/injast/callback?session_code=YOUR_SESSION_CODE
   ```

### Option 2: Test via API Directly

Use curl or Postman to test the callback endpoint:

```bash
curl -X POST http://localhost:8000/api/auth/injast/callback/ \
  -H "Content-Type: application/json" \
  -d '{"session_code": "YOUR_SESSION_CODE"}'
```

## Current Status

✅ **Working:**
- Token decoding (without signature validation)
- User creation from token payload
- Database integration

⚠️ **Issues:**
- JWKS endpoint returns 404 (signature validation not possible)
- User Basic API returns 500 (might need correct Authorization header format)

## Next Steps

1. **Get correct JWKS URL** from Injast team
2. **Verify Authorization header format** for API calls
3. **Test with actual session code** from Injast SuperApp

## Token Information

Your token contains:
- **uid**: `97427315-1d07-4c22-a0d5-e87f339b3bb8` (used as national_id)
- **sub**: `5jHRgnNyNMmEMZTXYUMxKT`
- **mobile**: `98 9190675716`
- **role**: `customer`
- **expires**: `2026-01-12 12:13:48`

## Notes

- The token uses **EdDSA** algorithm (not RS256)
- Audience is **"injast"** (not "sso")
- Token uses **"uid"** field instead of "nid" for user identification


