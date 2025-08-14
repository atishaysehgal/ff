# Fantasy Football Analytics App

A comprehensive fantasy football analytics application that provides detailed insights about league managers, weekly performance analysis, and season-long statistics using the Sleeper API.

## Features

- **League Analysis**: Enter a Sleeper league ID to get comprehensive analytics
- **Manager Performance**: Detailed analysis of each manager's weekly and season performance
- **Optimal Lineup Analysis**: Shows what the best possible lineup would have been each week
- **Season Insights**: Overall season statistics and trends for each manager
- **Interactive Dashboard**: Modern web interface with charts and detailed breakdowns

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python main.py
```

3. Open your browser and navigate to `http://localhost:8000`

## Usage

1. Enter a valid Sleeper league ID in the input field
2. Click "Analyze League" to fetch and process the data
3. View comprehensive analytics including:
   - Weekly performance breakdowns
   - Optimal lineup suggestions
   - Season-long statistics
   - Manager comparisons

## API Endpoints

- `GET /`: Main dashboard
- `POST /analyze`: Analyze a league by ID
- `GET /league/{league_id}`: Get league data
- `GET /managers/{league_id}`: Get manager analytics

## Sleeper API

This app uses the public Sleeper API to fetch:
- League information
- Roster data
- Matchup results
- Player statistics

No API key required - all data is publicly accessible through Sleeper's API.
