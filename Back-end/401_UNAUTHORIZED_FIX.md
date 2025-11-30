# 401 Unauthorized Error - Session Code Exchange

## Error

```
401 Client Error: Unauthorized for url: https://api.injast.life/service/user/sso/exchange-session-code
```

## Cause

According to the Injast SSO specification:
> "The access to the host back is also restricted and whitelisted using the IP address."

This means your **server's IP address** must be whitelisted by Injast to make backend-to-backend API calls.

## Solutions

### Solution 1: IP Whitelisting (Required)

**Contact Injast support** and provide:
1. Your server's public IP address(es)
2. Request whitelisting for the `/service/user/sso/exchange-session-code` endpoint

**To find your server IP:**
```bash
# From your server
curl ifconfig.me
# or
curl ipinfo.io/ip
```

### Solution 2: API Key Authentication (If Required)

If Injast requires API keys for backend authentication:

1. Get API key/secret from Injast
2. Add to `.env` file:
   ```bash
   INJAST_API_KEY=your-api-key-here
   INJAST_API_SECRET=your-api-secret-here
   ```

The code already supports this - just add the keys to your `.env` file.

### Solution 3: Check Session Code

Ensure:
- Session code is valid and not expired (15 minute TTL)
- Session code hasn't been used before (one-time use)
- Session code format is correct

## Current Code Status

✅ Code is ready and includes:
- Support for API key authentication
- Detailed error logging for 401 errors
- Clear error messages

## Testing

Once IP is whitelisted, test with:

```bash
python test_injast_token_simple.py
```

Or test the full flow via the API endpoint.

## Next Steps

1. **URGENT**: Contact Injast support to whitelist your server IP
2. Get API keys if required
3. Test again after whitelisting

## Error Details

The 401 error occurs at the **session code exchange** step, which is the first backend-to-backend call. This is different from the user data API calls (which return 500 errors).

Both issues need to be resolved:
- ✅ 401 on session code exchange → IP whitelisting
- ✅ 500 on user-basic API → API format/endpoint issue

