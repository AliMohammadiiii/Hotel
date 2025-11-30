#!/usr/bin/env python
"""
Test script to verify name retrieval from Injast API.
This focuses on ensuring name fields are captured.
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

TEST_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1akhSZ25OeU5NbUVNWlRYWVVNeEtUIiwiYXVkIjpbImluamFzdCJdLCJleHAiOjE3NjgyMjAwMjgsImlhdCI6MTc2MTAyMDAyOCwidWlkIjoiOTc0MjczMTUtMWQwNy00YzIyLWEwZDUtZTg3ZjMzOWIzYmI4IiwicmxlIjoiY3VzdG9tZXIiLCJtYmMiOiI5OCIsIm1ibiI6IjkxOTA2NzU3MTYiLCJyZnMiOmZhbHNlfQ.Okib-d9IDSyi6RpQNNCu3_t3v5_5ID_c5wHUf9xYvCTPHhL5yKfMl-3sTGDtJYA6sKwvSjtqeglhh-Qlwq9uBw"

def test_api_with_different_formats():
    """Test API with different request formats to get name."""
    print("=" * 60)
    print("Testing Injast User Basic API - Name Retrieval")
    print("=" * 60)
    
    client = InjastAPIClient()
    
    # Test different header combinations
    test_configs = [
        {
            'name': 'Token only (no Bearer)',
            'headers': {
                'Authorization': TEST_TOKEN,
                'Content-Type': 'application/json'
            }
        },
        {
            'name': 'Bearer prefix',
            'headers': {
                'Authorization': f'Bearer {TEST_TOKEN}',
                'Content-Type': 'application/json'
            }
        },
        {
            'name': 'Token only + Accept header',
            'headers': {
                'Authorization': TEST_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        },
    ]
    
    for config in test_configs:
        print(f"\n{config['name']}:")
        try:
            response = requests.get(
                client.user_basic_url,
                headers=config['headers'],
                timeout=10
            )
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('meta', {}).get('success'):
                    user_data = data.get('data', {})
                    print(f"  ✓ SUCCESS!")
                    print(f"  Name: {user_data.get('first_name', 'N/A')} {user_data.get('last_name', 'N/A')}")
                    print(f"  Email: {user_data.get('email', 'N/A')}")
                    print(f"  National ID: {user_data.get('national_id', 'N/A')}")
                    return user_data
                else:
                    print(f"  ✗ API returned error: {data.get('message', 'Unknown')}")
            else:
                try:
                    error_data = response.json()
                    print(f"  ✗ Error: {error_data.get('meta', {}).get('error_code', 'Unknown')}")
                except:
                    print(f"  ✗ Error: {response.text[:100]}")
        except Exception as e:
            print(f"  ✗ Exception: {e}")
    
    print("\n" + "=" * 60)
    print("⚠️  All API attempts failed - name will not be available")
    print("=" * 60)
    return None

if __name__ == '__main__':
    result = test_api_with_different_formats()
    if result:
        print("\n✓ Name retrieval successful!")
    else:
        print("\n✗ Name retrieval failed - check API endpoint and token format")

