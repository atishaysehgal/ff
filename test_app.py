#!/usr/bin/env python3
"""
Test script for Fantasy Football Analytics App
This script provides a simple way to test the app functionality
"""

import asyncio
import httpx
import json

async def test_league_endpoint():
    """Test the league endpoint with a sample league ID"""
    
    # You can replace this with a real Sleeper league ID for testing
    test_league_id = "123456789"  # Replace with actual league ID
    
    print(f"Testing league analysis for ID: {test_league_id}")
    
    async with httpx.AsyncClient() as client:
        try:
            # Test basic league info endpoint
            response = await client.get(f"http://localhost:8000/league/{test_league_id}")
            print(f"League info status: {response.status_code}")
            
            if response.status_code == 200:
                league_data = response.json()
                print(f"League name: {league_data.get('league', {}).get('name', 'Unknown')}")
                print(f"Number of users: {len(league_data.get('users', []))}")
            else:
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"Error testing league endpoint: {e}")

async def test_analyze_endpoint():
    """Test the analyze endpoint"""
    
    test_league_id = "123456789"  # Replace with actual league ID
    
    print(f"\nTesting analyze endpoint for ID: {test_league_id}")
    
    async with httpx.AsyncClient() as client:
        try:
            # Test analyze endpoint
            response = await client.post(
                "http://localhost:8000/analyze",
                data={"league_id": test_league_id}
            )
            print(f"Analyze status: {response.status_code}")
            
            if response.status_code == 200:
                analysis_data = response.json()
                print(f"Analysis completed successfully!")
                print(f"League: {analysis_data.get('league', {}).get('name', 'Unknown')}")
                print(f"Managers analyzed: {len(analysis_data.get('manager_analytics', {}))}")
                print(f"Current week: {analysis_data.get('current_week', 'Unknown')}")
            else:
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"Error testing analyze endpoint: {e}")

def main():
    """Main test function"""
    print("Fantasy Football Analytics App - Test Script")
    print("=" * 50)
    
    print("\nNote: Make sure the app is running on http://localhost:8000")
    print("To start the app, run: python main.py")
    print("\nTo test with a real league:")
    print("1. Go to your Sleeper league page")
    print("2. Copy the league ID from the URL")
    print("3. Replace the test_league_id in this script")
    print("4. Run this test script")
    
    # Run the tests
    asyncio.run(test_league_endpoint())
    asyncio.run(test_analyze_endpoint())
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("\nTo use the web interface:")
    print("1. Start the app: python main.py")
    print("2. Open your browser to: http://localhost:8000")
    print("3. Enter a league ID and click 'Analyze League'")

if __name__ == "__main__":
    main()
