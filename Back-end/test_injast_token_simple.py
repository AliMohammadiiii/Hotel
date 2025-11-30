#!/usr/bin/env python
"""
Simple test script for Injast SSO token (without signature validation).
This is useful for testing when JWKS endpoint is not available.
Usage: python test_injast_token_simple.py
"""
import os
import sys
import django
import jwt
import json

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')
django.setup()

from sso_integration.services import InjastAPIClient
from sso_integration.models import InjastUser
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime

# Your test token (update this with new tokens as needed)
TEST_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmeUF6NkRCRGpjQkpnRVRTZnpxVkhkIiwiYXVkIjpbImluamFzdCJdLCJleHAiOjE3NzE2OTY1NTUsImlhdCI6MTc2NDQ5NjU1NSwidWlkIjoiYjM5OGQ1MTUtZDdiOC00OTcwLWIyYmQtYzZmNjBmNTA1ZTg5IiwicmxlIjoiY3VzdG9tZXIiLCJtYmMiOiI5OCIsIm1ibiI6IjkzNjIzOTI0NTciLCJyZnMiOmZhbHNlLCJtc3AiOm51bGwsInVhZyI6IiJ9.CUuzl4Q8Il0eRd-NBDFy33NhgY1Tw-vJ4g3I74zb6gGmrZgoPEchTjuR6hwKUurE-Q_HBKzloQPA2mYmnmkbBQ"

def decode_token_without_validation():
    """Decode token without signature validation for testing."""
    print("=" * 60)
    print("Decoding Token (without signature validation)")
    print("=" * 60)
    
    try:
        # Decode without verification
        payload = jwt.decode(TEST_TOKEN, options={"verify_signature": False})
        
        print(f"\n✓ Token decoded successfully!")
        print(f"\nToken Payload:")
        print(json.dumps(payload, indent=2))
        
        # Check expiration
        exp = payload.get('exp')
        if exp:
            exp_datetime = datetime.fromtimestamp(exp)
            now = datetime.now()
            if exp_datetime < now:
                print(f"\n⚠ Token is EXPIRED (expired at: {exp_datetime})")
            else:
                print(f"\n✓ Token is valid (expires at: {exp_datetime})")
        
        return payload
        
    except Exception as e:
        print(f"\n✗ Failed to decode token: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_user_basic_api(token):
    """Test fetching user basic data."""
    print("\n" + "=" * 60)
    print("Testing Injast User Basic API")
    print("=" * 60)
    
    client = InjastAPIClient()
    
    try:
        print(f"\nFetching user basic data...")
        print(f"   API URL: {client.user_basic_url}")
        print(f"   Using token: {token[:50]}...")
        
        user_data = client.get_user_basic(token)
        
        print(f"\n✓ User data fetched successfully!")
        print(f"\nUser Data:")
        print(json.dumps(user_data, indent=2))
        
        return user_data
        
    except Exception as e:
        print(f"\n⚠ Failed to fetch user data from API: {e}")
        print(f"   (This is OK - will use token payload data instead)")
        # Don't print full traceback for API errors - it's expected
        return None

def test_user_creation(payload, user_data, token):
    """Test creating/updating user from token and user data."""
    print("\n" + "=" * 60)
    print("Testing User Creation/Update")
    print("=" * 60)
    
    try:
        from sso_integration.services import UserSyncService
        
        sync_service = UserSyncService()
        
        # Use uid as national_id if national_id not in user_data
        if not user_data.get('national_id'):
            user_data['national_id'] = payload.get('uid') or payload.get('nid')
        
        print(f"\nCreating/updating user...")
        print(f"   National ID: {user_data.get('national_id')}")
        print(f"   Mobile: {payload.get('mbc')} {payload.get('mbn')}")
        
        user = sync_service.create_or_update_user(
            injast_data=user_data,
            access_token=token,
            token_payload=payload
        )
        
        print(f"\n✓ User synced successfully!")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.first_name} {user.last_name}")
        
        # Check InjastUser
        injast_user = InjastUser.objects.get(user=user)
        print(f"   National ID: {injast_user.national_id}")
        print(f"   Mobile: {injast_user.mobile_country_code} {injast_user.mobile_number}")
        
        return user
        
    except Exception as e:
        print(f"\n✗ Failed to sync user: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Injast SSO Manual Test (Simple Mode)")
    print("=" * 60)
    print("\nNote: This test skips signature validation.")
    print("      Use this to test the flow when JWKS is not available.\n")
    
    # Step 1: Decode token
    payload = decode_token_without_validation()
    
    if not payload:
        print("\n✗ Cannot proceed without token payload.")
        return
    
    # Step 2: Fetch user data (optional - will use token payload if API fails)
    user_data = test_user_basic_api(TEST_TOKEN)
    
    if not user_data:
        print("\n⚠ User data API unavailable. Using token payload data instead...")
        # Create minimal user_data from token
        user_data = {
            'national_id': payload.get('uid') or payload.get('nid'),
            'mobile_number': payload.get('mbn'),
            'mobile_country_code': payload.get('mbc'),
        }
        print(f"   Created user_data from token: national_id={user_data['national_id']}, mobile={user_data['mobile_country_code']} {user_data['mobile_number']}")
    
    # Step 3: Create/update user
    user = test_user_creation(payload, user_data, TEST_TOKEN)
    
    if user:
        print("\n" + "=" * 60)
        print("✓ Test completed successfully!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - Token decoded: ✓")
        print(f"  - User ID: {payload.get('uid') or payload.get('nid') or payload.get('sub')}")
        print(f"  - Mobile: {payload.get('mbc')} {payload.get('mbn')}")
        print(f"  - Role: {payload.get('rle')}")
        print(f"  - Django User: {user.username}")
        if user_data:
            print(f"  - Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}")
            print(f"  - Email: {user_data.get('email', 'N/A')}")

if __name__ == '__main__':
    main()

