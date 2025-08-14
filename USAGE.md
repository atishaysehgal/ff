# Fantasy Football Analytics App - Usage Guide

## Overview

This comprehensive fantasy football analytics application provides detailed insights about your Sleeper league, including manager performance analysis, weekly breakdowns, and optimal lineup suggestions.

## Features

### 🏆 League Overview
- **League Information**: Name, number of teams, current week, season, and scoring type
- **Manager Statistics**: Win percentages, average points, and season records
- **Visual Charts**: Interactive charts showing win percentages and points lost to suboptimal lineups

### 📊 Manager Analytics
For each manager, the app provides:

#### Season Summary
- **Win/Loss Record**: Overall season performance
- **Win Percentage**: Success rate throughout the season
- **Total Points**: Cumulative points scored
- **Average Points per Week**: Consistency metric
- **Points Lost to Suboptimal Lineups**: Efficiency analysis

#### Weekly Performance Breakdown
- **Week-by-Week Analysis**: Detailed performance for each week
- **Actual vs Optimal Points**: Comparison of what was scored vs. what could have been scored
- **Lineup Improvements**: Specific suggestions for better player selections
- **Win/Loss Results**: Game outcomes with visual indicators

### 🎯 Optimal Lineup Analysis
The app analyzes each week's lineup and suggests improvements by:
- Identifying bench players who scored more than starters
- Calculating potential point gains from better lineup decisions
- Providing specific player swap recommendations
- Quantifying the impact of suboptimal decisions

## How to Use

### 1. Find Your League ID
1. Go to your Sleeper league page in a web browser
2. Look at the URL - it will look like: `https://sleeper.app/league/123456789`
3. The number after "league/" is your League ID (in this example: `123456789`)

### 2. Run the Application
```bash
# Install dependencies
pip install -r requirements.txt

# Start the application
python main.py
```

### 3. Access the Web Interface
1. Open your browser and go to `http://localhost:8000`
2. Enter your League ID in the input field
3. Click "Analyze League" or press Enter
4. Wait for the analysis to complete (may take a few moments)

### 4. Explore the Results
- **League Overview**: See basic league information and statistics
- **Manager Cards**: Click on any manager card to see detailed analysis
- **Charts**: View visual representations of league performance
- **Detailed Analysis**: Scroll down to see comprehensive weekly breakdowns

## Understanding the Analytics

### Manager Performance Categories
- **Winning Managers** (Green): Win percentage ≥ 60%
- **Average Managers** (Yellow): Win percentage 40-60%
- **Losing Managers** (Red): Win percentage ≤ 40%

### Points Lost Analysis
- **Low Points Lost** (Green): ≤ 50 points lost to suboptimal lineups
- **Medium Points Lost** (Yellow): 50-100 points lost
- **High Points Lost** (Red): > 100 points lost

### Weekly Analysis Colors
- **Win Weeks** (Green): Games won that week
- **Loss Weeks** (Red): Games lost that week

## Interpreting the Results

### What the Analytics Tell You

#### For Individual Managers:
1. **Efficiency**: How well they're utilizing their roster
2. **Consistency**: How reliable their scoring is week-to-week
3. **Decision Making**: Quality of lineup choices
4. **Potential**: What their record could have been with optimal decisions

#### For the League:
1. **Competitive Balance**: How evenly matched the teams are
2. **Skill vs Luck**: How much of success comes from good decisions vs. good fortune
3. **Learning Opportunities**: Areas where managers can improve

### Key Metrics Explained

#### Win Percentage
- **High (≥60%)**: Excellent season performance
- **Medium (40-60%)**: Average performance
- **Low (≤40%)**: Struggling season

#### Average Points per Week
- **High (≥120)**: Strong offensive output
- **Medium (100-120)**: Solid scoring
- **Low (<100)**: Offensive struggles

#### Points Lost to Suboptimal Lineups
- **Low (≤50)**: Good lineup decisions
- **Medium (50-100)**: Room for improvement
- **High (>100)**: Significant lineup optimization opportunities

## Example Analysis

### Scenario: Manager A Analysis
```
Season Record: 8-5 (61.5% win rate)
Total Points: 1,450.5
Average Points/Week: 111.6
Points Lost to Suboptimal Lineups: 75.2

Week 3 Analysis:
- Actual Points: 98.5
- Optimal Points: 112.3
- Points Lost: 13.8
- Improvement: Could have started Player X (15.2 pts) instead of Player Y (1.4 pts)
```

### What This Tells Us:
1. **Manager A** is having a good season (8-5 record)
2. They're scoring consistently (111.6 avg points)
3. They've lost about 75 points to suboptimal decisions
4. In Week 3, they left 13.8 points on the bench
5. With better lineup decisions, they could be 9-4 or 10-3

## Tips for Using the Analytics

### For League Commissioners:
- Use the data to identify managers who might need help or advice
- Share insights to improve league engagement
- Use optimal lineup analysis to settle "what if" debates

### For Individual Managers:
- Focus on weeks with high "points lost" to improve decision-making
- Look for patterns in your lineup mistakes
- Use the data to justify trades or roster moves

### For League Analysis:
- Compare manager efficiency across the league
- Identify which managers are "lucky" vs. "skilled"
- Use the data for draft strategy in future seasons

## Troubleshooting

### Common Issues:

1. **"League not found" error**
   - Double-check your League ID
   - Make sure the league is public or you have access
   - Try refreshing the page

2. **"Failed to analyze league" error**
   - Check your internet connection
   - The Sleeper API might be temporarily unavailable
   - Try again in a few minutes

3. **Slow loading times**
   - Analysis can take 30-60 seconds for leagues with many weeks
   - This is normal for comprehensive analysis
   - Be patient and don't refresh the page

4. **Missing data**
   - Some leagues may have incomplete data
   - The app will work with available data
   - Contact your league commissioner if data seems incorrect

## API Endpoints

For developers who want to integrate with the app:

- `GET /`: Main dashboard
- `POST /analyze`: Analyze a league (requires `league_id` form parameter)
- `GET /league/{league_id}`: Get basic league information

## Support

If you encounter issues or have questions:
1. Check this usage guide
2. Verify your League ID is correct
3. Ensure the Sleeper league is accessible
4. Try the test script: `python test_app.py`

## Future Enhancements

Planned features for future versions:
- Player-specific analysis
- Trade evaluation tools
- Draft analysis
- Historical season comparisons
- Export functionality for reports
