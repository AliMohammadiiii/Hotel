#!/usr/bin/env python
"""
Manual test script for Injast SSO token validation.
Usage: python test_injast_token.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')
django.setup()

from sso_integration.services import InjastTokenValidator, InjastAPIClient
import json

# Your test token
TEST_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1akhSZ25OeU5NbUVNWlRYWVVNeEtUIiwiYXVkIjpbImluamFzdCJdLCJleHAiOjE3NjgyMjAwMjgsImlhdCI6MTc2MTAyMDAyOCwidWlkIjoiOTc0MjczMTUtMWQwNy00YzIyLWEwZDUtZTg3ZjMzOWIzYmI4IiwicmxlIjoiY3VzdG9tZXIiLCJtYmMiOiI5OCIsIm1ibiI6IjkxOTA2NzU3MTYiLCJyZnMiOmZhbHNlfQ.Okib-d9IDSyi6RpQNNCu3_t3v5_5ID_c5wHUf9xYvCTPHhL5yKfMl-3sTGDtJYA6sKwvSjtqeglhh-Qlwq9uBw"

def test_token_validation():
    """Test token validation."""
    print("=" * 60)
    print("Testing Injast Token Validation")
    print("=" * 60)
    
    validator = InjastTokenValidator()
    
    try:
        print(f"\n1. Validating token...")
        print(f"   JWKS URL: {validator.jwks_url}")
        print(f"   Expected Audience: {validator.audience}")
        print(f"   Algorithm: {validator.algorithm}")
        
        payload = validator.validate_token(TEST_TOKEN)
        
        print(f"\n✓ Token validated successfully!")
        print(f"\nToken Payload:")
        print(json.dumps(payload, indent=2))
        
        return payload
        
    except Exception as e:
        print(f"\n✗ Token validation failed: {e}")
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
        print(f"\n2. Fetching user basic data...")
        print(f"   API URL: {client.user_basic_url}")
        
        user_data = client.get_user_basic(token)
        
        print(f"\n✓ User data fetched successfully!")
        print(f"\nUser Data:")
        print(json.dumps(user_data, indent=2))
        
        return user_data
        
    except Exception as e:
        print(f"\n✗ Failed to fetch user data: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Injast SSO Manual Test")
    print("=" * 60)
    
    # Test 1: Validate token
    payload = test_token_validation()
    
    if not payload:
        print("\n✗ Token validation failed. Cannot proceed.")
        return
    
    # Test 2: Fetch user data
    user_data = test_user_basic_api(TEST_TOKEN)
    
    if user_data:
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - Token validated: ✓")
        print(f"  - User ID: {payload.get('uid') or payload.get('nid') or payload.get('sub')}")
        print(f"  - Mobile: {payload.get('mbc')} {payload.get('mbn')}")
        print(f"  - Role: {payload.get('rle')}")
        if user_data:
            print(f"  - Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}")
            print(f"  - Email: {user_data.get('email', 'N/A')}")
    else:
        print("\n" + "=" * 60)
        print("⚠ Token validated but user data fetch failed")
        print("=" * 60)

if __name__ == '__main__':
    main()




