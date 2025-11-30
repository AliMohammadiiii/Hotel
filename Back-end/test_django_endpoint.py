#!/usr/bin/env python
"""
Test the Django endpoint directly to see what's different from direct Python call.
"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_backend.settings')
django.setup()

from sso_integration.services import InjastAPIClient

# Replace with actual session code
TEST_SESSION_CODE = "3c0df6d9-6ffb-47d5-8199-cbf6f0678f5e"

def test_direct_python():
    """Test direct Python call (what works)."""
    print("=" * 60)
    print("Test 1: Direct Python Call (Working)")
    print("=" * 60)
    
    client = InjastAPIClient()
    
    try:
        access_token = client.exchange_session_code(TEST_SESSION_CODE)
        print(f"\n✓ SUCCESS!")
        print(f"Access Token: {access_token[:50]}...")
        return access_token
    except Exception as e:
        print(f"\n✗ Failed: {e}")
        return None

def test_django_endpoint():
    """Test via Django endpoint."""
    print("\n" + "=" * 60)
    print("Test 2: Django Endpoint Call")
    print("=" * 60)
    
    url = "http://localhost:8000/api/auth/injast/callback/"
    
    try:
        response = requests.post(
            url,
            json={'session_code': TEST_SESSION_CODE},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"\nStatus: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ SUCCESS!")
            print(f"Access Token: {data.get('access', '')[:50]}...")
            print(f"User: {data.get('user', {})}")
            return True
        else:
            print(f"\n✗ Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"\n✗ Exception: {e}")
        return False

def compare_requests():
    """Compare what's being sent in both cases."""
    print("\n" + "=" * 60)
    print("Comparing Request Formats")
    print("=" * 60)
    
    print(f"\nSession Code: {TEST_SESSION_CODE[:30]}... (length: {len(TEST_SESSION_CODE)})")
    print(f"\nDirect Python call uses:")
    print(f"  - URL: https://api.injast.life/service/user/sso/exchange-session-code")
    print(f"  - Method: POST")
    print(f"  - Body: {{'session_code': '{TEST_SESSION_CODE[:20]}...'}}")
    print(f"  - Headers: Content-Type: application/json")
    
    print(f"\nDjango endpoint receives:")
    print(f"  - URL: /api/auth/injast/callback/")
    print(f"  - Method: POST")
    print(f"  - Body: {{'session_code': '{TEST_SESSION_CODE[:20]}...'}}")
    print(f"  - Then forwards to Injast API")

if __name__ == '__main__':
    if TEST_SESSION_CODE == "YOUR_SESSION_CODE_HERE":
        print("⚠️  Please update TEST_SESSION_CODE with actual session code")
        compare_requests()
    else:
        # Test direct call
        token = test_direct_python()
        
        if token:
            # Test Django endpoint
            test_django_endpoint()


