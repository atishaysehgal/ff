#!/usr/bin/env python3
"""
Test the app with a known public league
"""

import asyncio
import httpx
import json

async def test_public_league():
    """Test with a known public league"""
    
    # This is a public league ID for testing
    test_league_id = "123456789"  # Replace with a real public league ID
    
    print("Testing with a public league...")
    print(f"League ID: {test_league_id}")
    
    async with httpx.AsyncClient() as client:
        try:
            # Test the analyze endpoint
            response = await client.post(
                "http://localhost:8000/analyze",
                data={"league_id": test_league_id}
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success! League analyzed successfully.")
                print(f"League name: {data.get('league', {}).get('name', 'Unknown')}")
                print(f"Number of users: {len(data.get('users', []))}")
                print(f"Manager analytics: {len(data.get('manager_analytics', {}))}")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_public_league())
