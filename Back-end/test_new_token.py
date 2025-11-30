#!/usr/bin/env python
"""
Test the new token to see if we can get name information.
"""
import os
import sys
import django
import jwt
import json
import requests

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')
django.setup()

from sso_integration.services import InjastAPIClient, UserSyncService
from sso_integration.models import InjastUser

# New test token
NEW_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmeUF6NkRCRGpjQkpnRVRTZnpxVkhkIiwiYXVkIjpbImluamFzdCJdLCJleHAiOjE3NzE2OTY1NTUsImlhdCI6MTc2NDQ5NjU1NSwidWlkIjoiYjM5OGQ1MTUtZDdiOC00OTcwLWIyYmQtYzZmNjBmNTA1ZTg5IiwicmxlIjoiY3VzdG9tZXIiLCJtYmMiOiI5OCIsIm1ibiI6IjkzNjIzOTI0NTciLCJyZnMiOmZhbHNlLCJtc3AiOm51bGwsInVhZyI6IiJ9.CUuzl4Q8Il0eRd-NBDFy33NhgY1Tw-vJ4g3I74zb6gGmrZgoPEchTjuR6hwKUurE-Q_HBKzloQPA2mYmnmkbBQ"

def decode_token():
    """Decode the new token."""
    print("=" * 60)
    print("Decoding New Token")
    print("=" * 60)
    
    try:
        payload = jwt.decode(NEW_TOKEN, options={"verify_signature": False})
        print(f"\n✓ Token decoded successfully!")
        print(f"\nToken Payload:")
        print(json.dumps(payload, indent=2))
        
        from datetime import datetime
        exp = datetime.fromtimestamp(payload['exp'])
        now = datetime.now()
        print(f"\nExpires: {exp}")
        print(f"Valid: {'✓' if exp > now else '✗ EXPIRED'}")
        
        return payload
    except Exception as e:
        print(f"\n✗ Failed to decode: {e}")
        return None

def test_api_with_new_token():
    """Test API with the new token."""
    print("\n" + "=" * 60)
    print("Testing User Basic API with New Token")
    print("=" * 60)
    
    client = InjastAPIClient()
    
    # Try different formats
    formats = [
        ("Token only", NEW_TOKEN),
        ("Bearer prefix", f"Bearer {NEW_TOKEN}"),
    ]
    
    for format_name, auth_header in formats:
        print(f"\nTrying: {format_name}")
        try:
            response = requests.get(
                client.user_basic_url,
                headers={
                    'Authorization': auth_header,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout=10
            )
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('meta', {}).get('success'):
                    user_data = data.get('data', {})
                    print(f"  ✓ SUCCESS!")
                    print(f"  First Name: {user_data.get('first_name', 'N/A')}")
                    print(f"  Last Name: {user_data.get('last_name', 'N/A')}")
                    print(f"  Email: {user_data.get('email', 'N/A')}")
                    print(f"  National ID: {user_data.get('national_id', 'N/A')}")
                    print(f"  Mobile: {user_data.get('mobile_country_code', '')} {user_data.get('mobile_number', '')}")
                    return user_data
                else:
                    print(f"  ✗ API error: {data.get('message', 'Unknown')}")
            else:
                try:
                    error_data = response.json()
                    print(f"  ✗ Error: {error_data.get('meta', {}).get('error_code', 'Unknown')}")
                    print(f"  Message: {error_data.get('message', '')}")
                except:
                    print(f"  ✗ Error: {response.text[:200]}")
        except Exception as e:
            print(f"  ✗ Exception: {e}")
    
    return None

def test_user_creation(payload, user_data):
    """Test creating user with new token."""
    print("\n" + "=" * 60)
    print("Testing User Creation with New Token")
    print("=" * 60)
    
    try:
        sync_service = UserSyncService()
        
        if not user_data:
            user_data = {
                'national_id': payload.get('uid') or payload.get('nid'),
                'mobile_number': payload.get('mbn'),
                'mobile_country_code': payload.get('mbc'),
            }
        
        print(f"\nCreating/updating user...")
        print(f"  National ID: {user_data.get('national_id')}")
        if user_data.get('first_name') or user_data.get('last_name'):
            print(f"  Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}")
        print(f"  Mobile: {user_data.get('mobile_country_code')} {user_data.get('mobile_number')}")
        
        user = sync_service.create_or_update_user(
            injast_data=user_data,
            access_token=NEW_TOKEN,
            token_payload=payload
        )
        
        print(f"\n✓ User synced successfully!")
        print(f"  Username: {user.username}")
        print(f"  First Name: {user.first_name or '(empty)'}")
        print(f"  Last Name: {user.last_name or '(empty)'}")
        print(f"  Email: {user.email or '(empty)'}")
        
        injast_user = InjastUser.objects.get(user=user)
        print(f"  National ID: {injast_user.national_id}")
        print(f"  Mobile: {injast_user.mobile_country_code} {injast_user.mobile_number}")
        
        if user.first_name or user.last_name:
            print(f"\n✓✓✓ NAME CAPTURED SUCCESSFULLY! ✓✓✓")
        else:
            print(f"\n⚠️  WARNING: Name is still empty")
        
        return user
    except Exception as e:
        print(f"\n✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Testing New Injast Token")
    print("=" * 60)
    
    # Step 1: Decode token
    payload = decode_token()
    if not payload:
        return
    
    # Step 2: Test API
    user_data = test_api_with_new_token()
    
    # Step 3: Create/update user
    user = test_user_creation(payload, user_data)
    
    if user:
        print("\n" + "=" * 60)
        if user.first_name or user.last_name:
            print("✓✓✓ SUCCESS - NAME CAPTURED! ✓✓✓")
        else:
            print("⚠️  User created but name is missing")
        print("=" * 60)

if __name__ == '__main__':
    main()

