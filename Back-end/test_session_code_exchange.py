#!/usr/bin/env python
"""
Test script to debug session code exchange.
This helps identify the correct request format.
"""
import requests
import json

# Test session code (replace with actual session code from Injast)
TEST_SESSION_CODE = "YOUR_SESSION_CODE_HERE"

API_URL = "https://api.injast.life/service/user/sso/exchange-session-code"

print("=" * 60)
print("Testing Session Code Exchange")
print("=" * 60)

# Test different request formats
test_configs = [
    {
        'name': 'JSON body (per spec)',
        'method': 'POST',
        'data': None,
        'json': {'session_code': TEST_SESSION_CODE},
        'headers': {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },
    {
        'name': 'Form data',
        'method': 'POST',
        'data': {'session_code': TEST_SESSION_CODE},
        'json': None,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    },
    {
        'name': 'Query parameter',
        'method': 'POST',
        'url': f"{API_URL}?session_code={TEST_SESSION_CODE}",
        'data': None,
        'json': None,
        'headers': {
            'Content-Type': 'application/json'
        }
    },
]

for config in test_configs:
    if TEST_SESSION_CODE == "YOUR_SESSION_CODE_HERE":
        print("\n⚠️  Please replace TEST_SESSION_CODE with actual session code")
        break
    
    print(f"\n{config['name']}:")
    try:
        url = config.get('url', API_URL)
        response = requests.request(
            config['method'],
            url,
            json=config.get('json'),
            data=config.get('data'),
            headers=config['headers'],
            timeout=10
        )
        
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('meta', {}).get('success'):
                access_token = data.get('data', {}).get('access_token')
                print(f"  ✓ SUCCESS!")
                print(f"  Access Token: {access_token[:50]}...")
                print(f"\n  Full response:")
                print(json.dumps(data, indent=2))
                break
            else:
                print(f"  ✗ API error: {data.get('message', 'Unknown')}")
        else:
            try:
                error_data = response.json()
                error_code = error_data.get('meta', {}).get('error_code', 'Unknown')
                error_message = error_data.get('message', '')
                print(f"  ✗ Error: {error_code}")
                print(f"  Message: {error_message}")
            except:
                print(f"  ✗ Error: {response.text[:200]}")
    except Exception as e:
        print(f"  ✗ Exception: {e}")

print("\n" + "=" * 60)
print("Note: If all fail with 401, your server IP may need whitelisting")
print("=" * 60)

