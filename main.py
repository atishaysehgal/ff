from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx
import asyncio
from typing import Dict, List, Optional
import json
from datetime import datetime
import pandas as pd
import numpy as np

app = FastAPI(title="Fantasy Football Analytics", version="1.0.0")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Sleeper API base URL
SLEEPER_BASE_URL = "https://api.sleeper.app/v1"

class SleeperAPI:
    def __init__(self):
        self.base_url = SLEEPER_BASE_URL
    
    async def get_league(self, league_id: str) -> Dict:
        """Fetch league information"""
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/league/{league_id}"
            print(f"Fetching league from: {url}")
            response = await client.get(url)
            print(f"League response status: {response.status_code}")
            if response.status_code != 200:
                print(f"League response text: {response.text}")
                raise HTTPException(status_code=404, detail="League not found")
            return response.json()
    
    async def get_rosters(self, league_id: str) -> List[Dict]:
        """Fetch all rosters in the league"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/league/{league_id}/rosters")
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Rosters not found")
            return response.json()
    
    async def get_users(self, league_id: str) -> List[Dict]:
        """Fetch all users in the league"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/league/{league_id}/users")
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Users not found")
            return response.json()
    
    async def get_matchups(self, league_id: str, week: int) -> List[Dict]:
        """Fetch matchups for a specific week"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/league/{league_id}/matchups/{week}")
            if response.status_code != 200:
                return []
            return response.json()
    
    async def get_player_stats(self, week: int, season: str = "2023") -> Dict:
        """Fetch player stats for a specific week"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/stats/nfl/regular/{season}/{week}")
            if response.status_code != 200:
                return {}
            return response.json()
    
    async def get_players(self) -> Dict:
        """Fetch all NFL players data"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/players/nfl")
            if response.status_code != 200:
                return {}
            return response.json()

class FantasyAnalytics:
    def __init__(self):
        self.sleeper_api = SleeperAPI()
        self.players_data = {}
        self.roster_settings = {}
    
    def set_players_data(self, players_data: Dict):
        """Set the players data for name lookups"""
        self.players_data = players_data
    
    def set_roster_settings(self, roster_settings: Dict):
        """Set the roster settings for position requirements"""
        self.roster_settings = roster_settings
    
    def get_player_name(self, player_id: str) -> str:
        """Get player name from player ID"""
        if player_id in self.players_data:
            player = self.players_data[player_id]
            first_name = player.get('first_name', '')
            last_name = player.get('last_name', '')
            name = f"{first_name} {last_name}".strip()
            print(f"      Player lookup: {player_id} -> {name}")
            return name
        print(f"      Player not found: {player_id}")
        return f"Player {player_id}"
    
    def get_player_position(self, player_id: str) -> str:
        """Get player position from player ID"""
        if player_id in self.players_data:
            player = self.players_data[player_id]
            return player.get('position', 'UNK')
        return 'UNK'
    
    def is_valid_position_substitution(self, current_positions: List[str], new_player_pos: str, replaced_player_pos: str) -> bool:
        """Check if a position substitution is valid according to roster settings"""
        # Create a copy of current positions
        test_positions = current_positions.copy()
        
        # Remove the replaced player's position
        if replaced_player_pos in test_positions:
            test_positions.remove(replaced_player_pos)
        
        # Add the new player's position
        test_positions.append(new_player_pos)
        
        # Check if this combination satisfies roster requirements
        return self._satisfies_roster_requirements(test_positions)
    
    def _satisfies_roster_requirements(self, positions: List[str]) -> bool:
        """Check if a list of positions satisfies the roster requirements"""
        if not self.roster_settings:
            return True  # If no settings, assume any combination is valid
        
        # Count positions
        pos_counts = {}
        for pos in positions:
            pos_counts[pos] = pos_counts.get(pos, 0) + 1
        
        # Check QB requirement
        qb_required = self.roster_settings.get('qb', 0)
        if pos_counts.get('QB', 0) != qb_required:
            return False
        
        # Check RB requirement
        rb_required = self.roster_settings.get('rb', 0)
        if pos_counts.get('RB', 0) < rb_required:
            return False
        
        # Check WR requirement
        wr_required = self.roster_settings.get('wr', 0)
        if pos_counts.get('WR', 0) < wr_required:
            return False
        
        # Check TE requirement
        te_required = self.roster_settings.get('te', 0)
        if pos_counts.get('TE', 0) < te_required:
            return False
        
        # Check K requirement
        k_required = self.roster_settings.get('k', 0)
        if pos_counts.get('K', 0) != k_required:
            return False
        
        # Check DEF requirement
        def_required = self.roster_settings.get('def', 0)
        if pos_counts.get('DEF', 0) != def_required:
            return False
        
        # Check FLEX positions (WR/RB/TE)
        flex_required = self.roster_settings.get('flex', 0)
        flex_positions = pos_counts.get('WR', 0) + pos_counts.get('RB', 0) + pos_counts.get('TE', 0)
        if flex_positions < (rb_required + wr_required + te_required + flex_required):
            return False
        
        return True
    
    def analyze_weekly_performance(self, roster: Dict, matchup: Dict, player_stats: Dict) -> Dict:
        """Analyze a team's weekly performance and suggest optimal lineup"""
        try:
            starters = roster.get('starters', [])
            players = roster.get('players', [])
            
            # Get starter points from matchup data, not roster data
            starters_points = matchup.get('starters_points', [])
            
            print(f"      Roster analysis - Starters: {len(starters)}, Players: {len(players)}, Starter points: {len(starters_points)}")
            print(f"      Actual starter points: {starters_points[:3]}...")  # Show first 3 actual point values
            
            # Get actual starters performance
            actual_performance = []
            for i, player_id in enumerate(starters):
                if i < len(starters_points):
                    actual_performance.append({
                        'player_id': player_id,
                        'name': self.get_player_name(player_id),
                        'points': starters_points[i],
                        'position': self.get_player_position(player_id)
                    })
            
            # Calculate optimal lineup from bench players
            bench_players = [p for p in players if p not in starters]
            bench_performance = []
            
            for player_id in bench_players:
                if player_id in player_stats:
                    points = player_stats[player_id].get('pts_ppr', 0)
                    bench_performance.append({
                        'player_id': player_id,
                        'name': self.get_player_name(player_id),
                        'points': points,
                        'position': self.get_player_position(player_id)
                    })
            
            # Sort bench players by points
            bench_performance.sort(key=lambda x: x['points'], reverse=True)
            
            # Find optimal lineup with position-aware improvements
            optimal_lineup = actual_performance.copy()
            improvements = []
            
            # Get current starter positions
            current_positions = [p['position'] for p in actual_performance]
            
            # Try to improve lineup with position-aware substitutions
            if optimal_lineup and len(optimal_lineup) > 0:
                # Sort starters by points (worst first)
                optimal_lineup.sort(key=lambda x: x['points'])
                
                for bench_player in bench_performance:
                    # Find the worst starter that can be replaced
                    for i, starter in enumerate(optimal_lineup):
                        # Check if this substitution would be valid positionally
                        if self.is_valid_position_substitution(current_positions, bench_player['position'], starter['position']):
                            if bench_player['points'] > starter['points']:
                                # Make the substitution
                                replaced_player = optimal_lineup.pop(i)
                                optimal_lineup.append(bench_player)
                                
                                # Update position list
                                current_positions.remove(replaced_player['position'])
                                current_positions.append(bench_player['position'])
                                
                                improvements.append({
                                    'replaced': replaced_player,
                                    'with': bench_player,
                                    'point_gain': bench_player['points'] - replaced_player['points']
                                })
                                break  # Move to next bench player
            
            return {
                'actual_points': sum(p['points'] for p in actual_performance),
                'optimal_points': sum(p['points'] for p in optimal_lineup),
                'improvements': improvements,
                'actual_lineup': actual_performance,
                'optimal_lineup': optimal_lineup
            }
        except Exception as e:
            print(f"Error in analyze_weekly_performance: {e}")
            # Return default values if analysis fails
            return {
                'actual_points': 0,
                'optimal_points': 0,
                'improvements': [],
                'actual_lineup': [],
                'optimal_lineup': []
            }
    
    def _get_player_position(self, player_id: str, player_stats: Dict) -> str:
        """Get player position from stats"""
        if player_id in player_stats:
            return player_stats[player_id].get('position', 'UNK')
        return 'UNK'
    
    def analyze_season_performance(self, user_id: str, all_matchups: List[List[Dict]], all_rosters: List[List[Dict]], all_player_stats: List[Dict]) -> Dict:
        """Analyze a manager's entire season performance"""
        season_data = []
        total_actual_points = 0
        total_optimal_points = 0
        wins = 0
        losses = 0
        
        try:
            for week, (week_matchups, week_rosters, week_player_stats) in enumerate(zip(all_matchups, all_rosters, all_player_stats), 1):
                print(f"    Processing week {week} for user {user_id}")
                
                # Find user's roster for this week
                user_roster = next((r for r in week_rosters if r.get('owner_id') == user_id), None)
                if not user_roster:
                    print(f"    No roster found for user {user_id} in week {week}")
                    continue
                
                # Find user's matchup for this week
                user_matchup = next((m for m in week_matchups if m.get('roster_id') == user_roster.get('roster_id')), None)
                if not user_matchup:
                    print(f"    No matchup found for roster {user_roster.get('roster_id')} in week {week}")
                    continue
                
                # Find opponent's matchup (same matchup_id but different roster_id)
                opponent_matchup = next((m for m in week_matchups 
                                       if m.get('matchup_id') == user_matchup.get('matchup_id') 
                                       and m.get('roster_id') != user_roster.get('roster_id')), None)
                
                # Calculate points against from opponent's points
                points_against = opponent_matchup.get('points', 0) if opponent_matchup else 0
                
                # Debug: Check matchup data structure
                if week == 1:
                    print(f"    Matchup keys: {list(user_matchup.keys())}")
                    print(f"    Starters points from matchup: {user_matchup.get('starters_points', [])[:3]}...")
                    print(f"    Total points: {user_matchup.get('points', 0)}")
                    print(f"    Points against: {points_against}")
                    print(f"    Matchup ID: {user_matchup.get('matchup_id')}")
                    if opponent_matchup:
                        print(f"    Opponent roster ID: {opponent_matchup.get('roster_id')}")
                        print(f"    Opponent points: {opponent_matchup.get('points', 0)}")
                
                # Analyze weekly performance
                try:
                    weekly_analysis = self.analyze_weekly_performance(user_roster, user_matchup, week_player_stats)
                    
                    season_data.append({
                        'week': week,
                        'actual_points': weekly_analysis['actual_points'],
                        'optimal_points': weekly_analysis['optimal_points'],
                        'improvements': weekly_analysis['improvements'],
                        'result': 'W' if user_matchup.get('points', 0) > points_against else 'L'
                    })
                    
                    total_actual_points += weekly_analysis['actual_points']
                    total_optimal_points += weekly_analysis['optimal_points']
                    
                    if user_matchup.get('points', 0) > points_against:
                        wins += 1
                    else:
                        losses += 1
                        
                except Exception as e:
                    print(f"    Error analyzing week {week}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error in analyze_season_performance: {e}")
            import traceback
            traceback.print_exc()
        
        return {
            'total_weeks': len(season_data),
            'wins': wins,
            'losses': losses,
            'win_percentage': wins / (wins + losses) if (wins + losses) > 0 else 0,
            'total_actual_points': total_actual_points,
            'total_optimal_points': total_optimal_points,
            'points_lost_to_suboptimal_lineups': total_optimal_points - total_actual_points,
            'average_actual_points': total_actual_points / len(season_data) if season_data else 0,
            'average_optimal_points': total_optimal_points / len(season_data) if season_data else 0,
            'weekly_data': season_data
        }

# Initialize analytics engine
analytics = FantasyAnalytics()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Main dashboard page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/analyze")
async def analyze_league(league_id: str = Form(...)):
    """Analyze a league and return comprehensive analytics"""
    try:
        print(f"Analyzing league: {league_id}")
        
        # Fetch league data
        league = await analytics.sleeper_api.get_league(league_id)
        print(f"League data fetched: {league.get('name', 'Unknown')}")
        
        users = await analytics.sleeper_api.get_users(league_id)
        print(f"Users fetched: {len(users)} users")
        
        # Fetch player data for name lookups
        players_data = await analytics.sleeper_api.get_players()
        print(f"Players data fetched: {len(players_data)} players")
        if players_data:
            sample_player_id = list(players_data.keys())[0]
            sample_player = players_data[sample_player_id]
            print(f"Sample player data: {sample_player_id} -> {sample_player.get('first_name', '')} {sample_player.get('last_name', '')}")
        analytics.set_players_data(players_data)
        
        # Extract roster settings from league data
        roster_settings = {}
        if 'roster_positions' in league:
            roster_positions = league['roster_positions']
            roster_settings = {
                'qb': roster_positions.count('QB'),
                'rb': roster_positions.count('RB'),
                'wr': roster_positions.count('WR'),
                'te': roster_positions.count('TE'),
                'k': roster_positions.count('K'),
                'def': roster_positions.count('DEF'),
                'flex': roster_positions.count('FLEX')
            }
            print(f"Roster settings: {roster_settings}")
        analytics.set_roster_settings(roster_settings)
        
        # Get current week and season
        current_week = league.get('settings', {}).get('leg', 1)
        season = str(league.get('season', '2023'))  # Convert to string and use actual season
        print(f"Current week: {current_week}, Season: {season}")
        
        # Fetch data for all weeks
        all_matchups = []
        all_rosters = []
        all_player_stats = []
        
        for week in range(1, current_week + 1):
            print(f"Fetching data for week {week}")
            matchups = await analytics.sleeper_api.get_matchups(league_id, week)
            rosters = await analytics.sleeper_api.get_rosters(league_id)
            player_stats = await analytics.sleeper_api.get_player_stats(week, season)
            
            # Debug: Check what we're getting
            if week == 1 and rosters:
                sample_roster = rosters[0]
                print(f"    Sample roster keys: {list(sample_roster.keys())}")
                print(f"    Starters: {sample_roster.get('starters', [])[:3]}...")  # First 3 starters
                print(f"    Starters points: {sample_roster.get('starters_points', [])[:3]}...")  # First 3 points
                print(f"    Players: {len(sample_roster.get('players', []))}")
            
            all_matchups.append(matchups)
            all_rosters.append(rosters)
            all_player_stats.append(player_stats)
        
        print(f"Data fetched for {len(all_matchups)} weeks")
        
        # Analyze each manager
        manager_analytics = {}
        for user in users:
            user_id = user['user_id']
            print(f"Analyzing user: {user.get('display_name', 'Unknown')}")
            season_analysis = analytics.analyze_season_performance(
                user_id, all_matchups, all_rosters, all_player_stats
            )
            
            manager_analytics[user_id] = {
                'user_info': user,
                'season_analysis': season_analysis
            }
        
        print("Analysis completed successfully")
        return {
            'league': league,
            'users': users,
            'manager_analytics': manager_analytics,
            'current_week': current_week,
            'season': season
        }
    
    except Exception as e:
        print(f"Error analyzing league: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/league/{league_id}")
async def get_league_data(league_id: str):
    """Get basic league information"""
    try:
        league = await analytics.sleeper_api.get_league(league_id)
        users = await analytics.sleeper_api.get_users(league_id)
        return {
            'league': league,
            'users': users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
