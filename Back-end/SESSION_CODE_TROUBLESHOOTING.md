# Session Code Exchange - Troubleshooting Guide

## Error: InvalidToken - توکن وارد شده صحیح نمی باشد

This error means the session code validation failed on Injast's side.

## Common Causes

### 1. Session Code Expired
- Session codes expire after **15 minutes**
- Check when the code was generated
- Request a new session code from Injast SuperApp

### 2. Session Code Already Used
- Session codes are **one-time use only**
- If the code was already exchanged, it cannot be used again
- Request a new session code

### 3. Session Code Format
- Session codes should be UUID format (e.g., `2fcc8778-222d-4618-ad30-75a9b0d6fb88`)
- Verify the code is complete and not truncated
- Check for extra whitespace or special characters

### 4. Server IP Whitelisting
- Backend-to-backend calls require IP whitelisting
- Your server's public IP must be whitelisted by Injast
- Contact Injast support to whitelist your IP

## How to Get a Valid Session Code

1. **From Injast SuperApp**:
   - User initiates login in Injast SuperApp
   - SuperApp generates a session code
   - SuperApp opens your app with: `yourapp://?session_code=XXXX-XXXX-XXXX`

2. **Testing**:
   - You need a real session code from Injast SuperApp
   - Cannot generate session codes manually
   - Must come from the actual Injast flow

## Testing

### Test with Real Session Code

1. Get session code from Injast SuperApp
2. Test via API:
   ```bash
   curl -X POST https://api.injast.life/service/user/sso/exchange-session-code \
     -H "Content-Type: application/json" \
     -d '{"session_code": "YOUR_SESSION_CODE"}'
   ```

3. Or use the test script:
   ```bash
   python test_session_code_exchange.py
   ```
   (Update TEST_SESSION_CODE in the script first)

## Code Status

✅ The code correctly:
- Sends session code in JSON format: `{"session_code": "..."}`
- Uses proper Content-Type headers
- Handles errors appropriately

## Next Steps

1. **Verify session code is fresh** (within 15 minutes)
2. **Verify session code hasn't been used** (one-time use)
3. **Check server IP whitelisting** with Injast support
4. **Test with a new session code** from Injast SuperApp

## Important Notes

- Session codes come from Injast SuperApp, not generated locally
- Each session code can only be used once
- Session codes expire after 15 minutes
- Backend IP must be whitelisted for the exchange to work


