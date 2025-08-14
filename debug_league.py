#!/usr/bin/env python3
"""
Debug script to test Sleeper API calls directly
"""

import asyncio
import httpx
import json

SLEEPER_BASE_URL = "https://api.sleeper.app/v1"

async def test_sleeper_api(league_id):
    """Test Sleeper API calls directly"""
    
    print(f"Testing Sleeper API for league ID: {league_id}")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        # Test 1: Get league info
        print("1. Testing league info...")
        try:
            response = await client.get(f"{SLEEPER_BASE_URL}/league/{league_id}")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                league_data = response.json()
                print(f"   League name: {league_data.get('name', 'Unknown')}")
                print(f"   Season: {league_data.get('season', 'Unknown')}")
                print(f"   Current week: {league_data.get('settings', {}).get('leg', 'Unknown')}")
            else:
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"   Exception: {e}")
            return False
        
        # Test 2: Get users
        print("\n2. Testing users...")
        try:
            response = await client.get(f"{SLEEPER_BASE_URL}/league/{league_id}/users")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                users = response.json()
                print(f"   Number of users: {len(users)}")
                for user in users[:3]:  # Show first 3 users
                    print(f"   - {user.get('display_name', 'Unknown')} (ID: {user.get('user_id', 'Unknown')})")
            else:
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"   Exception: {e}")
            return False
        
        # Test 3: Get rosters
        print("\n3. Testing rosters...")
        try:
            response = await client.get(f"{SLEEPER_BASE_URL}/league/{league_id}/rosters")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                rosters = response.json()
                print(f"   Number of rosters: {len(rosters)}")
                if rosters:
                    roster = rosters[0]
                    print(f"   Sample roster - Owner ID: {roster.get('owner_id', 'Unknown')}")
                    print(f"   Players: {len(roster.get('players', []))}")
                    print(f"   Starters: {len(roster.get('starters', []))}")
            else:
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"   Exception: {e}")
            return False
        
        # Test 4: Get matchups for week 1
        print("\n4. Testing matchups (week 1)...")
        try:
            response = await client.get(f"{SLEEPER_BASE_URL}/league/{league_id}/matchups/1")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                matchups = response.json()
                print(f"   Number of matchups: {len(matchups)}")
                if matchups:
                    matchup = matchups[0]
                    print(f"   Sample matchup - Roster ID: {matchup.get('roster_id', 'Unknown')}")
                    print(f"   Points: {matchup.get('points', 'Unknown')}")
            else:
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"   Exception: {e}")
            return False
        
        # Test 5: Get player stats for week 1
        print("\n5. Testing player stats (week 1)...")
        try:
            response = await client.get(f"{SLEEPER_BASE_URL}/stats/nfl/regular/2023/1")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                stats = response.json()
                print(f"   Number of player stats: {len(stats)}")
                if stats:
                    # Get first player stat
                    first_player = list(stats.keys())[0]
                    player_stat = stats[first_player]
                    print(f"   Sample player stat - Points: {player_stat.get('pts_ppr', 'Unknown')}")
            else:
                print(f"   Error: {response.text}")
                return False
        except Exception as e:
            print(f"   Exception: {e}")
            return False
    
    print("\n" + "=" * 50)
    print("All tests completed!")
    return True

def main():
    """Main function"""
    print("Sleeper API Debug Tool")
    print("=" * 50)
    
    # Get league ID from user
    league_id = input("Enter your Sleeper League ID: ").strip()
    
    if not league_id:
        print("No league ID provided. Exiting.")
        return
    
    # Run the tests
    success = asyncio.run(test_sleeper_api(league_id))
    
    if success:
        print("\n✅ All API tests passed! The issue might be in the application logic.")
        print("Try running the web app again and check the console output.")
    else:
        print("\n❌ Some API tests failed. Check the errors above.")
        print("Make sure your league ID is correct and the league is accessible.")

if __name__ == "__main__":
    main()
