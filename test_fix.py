#!/usr/bin/env python3
"""
Test the fix for the IndexError with empty rosters
"""

import asyncio
import httpx

async def test_analysis():
    """Test the analysis with the known league ID"""
    
    league_id = "1127119665626521600"  # Your league ID
    
    print("Testing league analysis with fixes...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://localhost:8000/analyze",
                data={"league_id": league_id}
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success! Analysis completed without errors.")
                print(f"League: {data.get('league', {}).get('name', 'Unknown')}")
                print(f"Users analyzed: {len(data.get('manager_analytics', {}))}")
                
                # Show some sample data
                for user_id, analytics in data.get('manager_analytics', {}).items():
                    user_info = analytics.get('user_info', {})
                    season_analysis = analytics.get('season_analysis', {})
                    print(f"  - {user_info.get('display_name', 'Unknown')}: {season_analysis.get('wins', 0)}-{season_analysis.get('losses', 0)} record")
                    break  # Just show first user
                    
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_analysis())
