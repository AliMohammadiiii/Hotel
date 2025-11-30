# ⚠️ IMPORTANT: User Name Retrieval

## Current Status

**The user's name (first_name, last_name) is CRITICAL but currently unavailable** due to API issues.

## Where Name Comes From

According to the Injast SSO specification, user name information comes from:
- **API Endpoint**: `GET /service/user/sso/user-basic`
- **Response Fields**: `first_name`, `last_name`, `email`, `national_id`, etc.

**The JWT token itself does NOT contain name information** - only:
- `uid` (user ID)
- `mbc`, `mbn` (mobile country code and number)
- `rle` (role)
- `sub` (subject)

## Current Issue

The `/sso/user-basic` API endpoint is returning:
- **Status**: 500 Internal Server Error
- **Error Code**: `ErrUnmarshal`
- **Meaning**: Server-side parsing/unmarshaling error
- **Tested with**: Multiple tokens (both old and new) - same error

This prevents us from getting:
- ❌ User's first name
- ❌ User's last name  
- ❌ User's email
- ❌ User's birthdate
- ❌ User's postal code

**Note**: The JWT token itself does NOT contain name information. The name MUST come from the API endpoint, which is currently broken.

## What's Working

✅ User creation works with:
- User ID (uid)
- Mobile number
- Role

## What's Missing

❌ User name (first_name, last_name)
❌ Email address
❌ Other profile data

## Solutions

### Option 1: Fix API Issue (Recommended)
Contact Injast support to resolve the `ErrUnmarshal` error on `/service/user/sso/user-basic` endpoint.

**Questions to ask:**
1. What is the correct Authorization header format?
2. Is the endpoint working correctly?
3. Does the token need special permissions/scopes?
4. Is there a different endpoint or format?

### Option 2: Alternative Data Source
If Injast provides name data through another method:
- Different API endpoint
- Different token format
- Additional API call

### Option 3: Manual Entry (Temporary)
Until API is fixed, users could:
- Enter their name manually after SSO login
- Update profile after authentication

## Code Status

The code is **ready and properly configured** to capture name when API works:

1. ✅ Retry logic with multiple header formats
2. ✅ Proper error handling and logging
3. ✅ Name fields are prioritized in user sync
4. ✅ Graceful fallback when API fails

## Testing

To test name retrieval once API is fixed:

```bash
python test_name_retrieval.py
```

This will try different authorization formats and show if name data is retrieved.

## Next Steps

1. **URGENT**: Contact Injast support about API 500 error
2. Verify correct Authorization header format
3. Test with working API endpoint
4. Verify name fields populate correctly

## Impact

**Current Impact**: Users can authenticate but their names are not captured.

**Once Fixed**: Full user profile data (name, email, etc.) will be automatically captured on login.

