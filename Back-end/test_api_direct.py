#!/usr/bin/env python
"""
Direct API test to check what format Injast expects.
"""
import requests
import json

TEST_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1akhSZ25OeU5NbUVNWlRYWVVNeEtUIiwiYXVkIjpbImluamFzdCJdLCJleHAiOjE3NjgyMjAwMjgsImlhdCI6MTc2MTAyMDAyOCwidWlkIjoiOTc0MjczMTUtMWQwNy00YzIyLWEwZDUtZTg3ZjMzOWIzYmI4IiwicmxlIjoiY3VzdG9tZXIiLCJtYmMiOiI5OCIsIm1ibiI6IjkxOTA2NzU3MTYiLCJyZnMiOmZhbHNlfQ.Okib-d9IDSyi6RpQNNCu3_t3v5_5ID_c5wHUf9xYvCTPHhL5yKfMl-3sTGDtJYA6sKwvSjtqeglhh-Qlwq9uBw"

API_URL = "https://api.injast.life/service/user/sso/user-basic"

print("Testing different Authorization header formats...\n")

# Test 1: Token only (as per spec)
print("1. Testing with token only (no Bearer prefix):")
try:
    response = requests.get(
        API_URL,
        headers={
            'Authorization': TEST_TOKEN,
            'Content-Type': 'application/json'
        },
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✓ Success!")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"   ✗ Failed")
        try:
            print(f"   Error: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"   Error: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Exception: {e}")

print("\n" + "-" * 60 + "\n")

# Test 2: Bearer prefix
print("2. Testing with Bearer prefix:")
try:
    response = requests.get(
        API_URL,
        headers={
            'Authorization': f'Bearer {TEST_TOKEN}',
            'Content-Type': 'application/json'
        },
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✓ Success!")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"   ✗ Failed")
        try:
            print(f"   Error: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"   Error: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Exception: {e}")

print("\n" + "-" * 60 + "\n")

# Test 3: Check if token is expired or invalid
print("3. Token info:")
import jwt
payload = jwt.decode(TEST_TOKEN, options={"verify_signature": False})
from datetime import datetime
exp = datetime.fromtimestamp(payload['exp'])
now = datetime.now()
print(f"   Expires: {exp}")
print(f"   Now: {now}")
print(f"   Valid: {'✓' if exp > now else '✗ EXPIRED'}")

