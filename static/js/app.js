// Fantasy Football Analytics App JavaScript

let leagueData = null;
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Enter key in league ID input
    document.getElementById('leagueId').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeLeague();
        }
    });
});

// Main function to analyze league
async function analyzeLeague() {
    const leagueId = document.getElementById('leagueId').value.trim();
    
    if (!leagueId) {
        showError('Please enter a valid League ID');
        return;
    }
    
    showLoading();
    hideError();
    hideResults();
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `league_id=${encodeURIComponent(leagueId)}`
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        leagueData = await response.json();
        displayResults(leagueData);
        
    } catch (error) {
        console.error('Error analyzing league:', error);
        showError('Failed to analyze league. Please check your League ID and try again.');
    } finally {
        hideLoading();
    }
}

// Display the analysis results
function displayResults(data) {
    updateLeagueOverview(data);
    displayManagerCards(data);
    createCharts(data);
    displayDetailedAnalysis(data);
    showResults();
}

// Update league overview section
function updateLeagueOverview(data) {
    const league = data.league;
    const users = data.users;
    
    document.getElementById('leagueName').textContent = league.name || 'League Overview';
    document.getElementById('totalTeams').textContent = users.length;
    document.getElementById('currentWeek').textContent = data.current_week || 1;
    document.getElementById('season').textContent = data.season || '2023';
    
    // Determine scoring type
    const settings = league.settings || {};
    let scoringType = 'Standard';
    if (settings.ppr) scoringType = 'PPR';
    if (settings.half_ppr) scoringType = 'Half PPR';
    document.getElementById('scoringType').textContent = scoringType;
}

// Display manager cards
function displayManagerCards(data) {
    const managerCardsContainer = document.getElementById('managerCards');
    managerCardsContainer.innerHTML = '';
    
    const managerAnalytics = data.manager_analytics;
    const users = data.users;
    
    users.forEach(user => {
        const userAnalytics = managerAnalytics[user.user_id];
        if (!userAnalytics) return;
        
        const seasonAnalysis = userAnalytics.season_analysis;
        const card = createManagerCard(user, seasonAnalysis);
        managerCardsContainer.appendChild(card);
    });
}

// Create individual manager card
function createManagerCard(user, seasonAnalysis) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-3';
    
    const winPercentage = seasonAnalysis.win_percentage;
    let cardClass = 'manager-card card';
    if (winPercentage >= 0.6) {
        cardClass += ' winning';
    } else if (winPercentage <= 0.4) {
        cardClass += ' losing';
    } else {
        cardClass += ' average';
    }
    
    col.innerHTML = `
        <div class="${cardClass}" onclick="showManagerDetails('${user.user_id}')">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-user me-2"></i>
                    ${user.display_name || user.metadata?.team_name || 'Unknown Manager'}
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <div class="stat-card ${winPercentage >= 0.5 ? 'positive' : 'negative'}">
                            <div class="stat-value">${(winPercentage * 100).toFixed(1)}%</div>
                            <div class="stat-label">Win Rate</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="stat-card ${seasonAnalysis.average_actual_points >= 100 ? 'positive' : 'neutral'}">
                            <div class="stat-value">${seasonAnalysis.average_actual_points.toFixed(1)}</div>
                            <div class="stat-label">Avg Points</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-6">
                        <div class="stat-card ${seasonAnalysis.points_lost_to_suboptimal_lineups <= 50 ? 'positive' : 'negative'}">
                            <div class="stat-value">${seasonAnalysis.points_lost_to_suboptimal_lineups.toFixed(1)}</div>
                            <div class="stat-label">Points Lost</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="stat-card">
                            <div class="stat-value">${seasonAnalysis.wins}-${seasonAnalysis.losses}</div>
                            <div class="stat-label">Record</div>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-2">
                    <small class="text-muted">Click for detailed analysis</small>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Create charts for visualization
function createCharts(data) {
    const managerAnalytics = data.manager_analytics;
    const users = data.users;
    
    // Win Percentage Chart
    const winPercentageCtx = document.getElementById('winPercentageChart').getContext('2d');
    const winPercentageData = users.map(user => {
        const analytics = managerAnalytics[user.user_id];
        return {
            name: user.display_name || user.metadata?.team_name || 'Unknown',
            percentage: analytics ? analytics.season_analysis.win_percentage * 100 : 0
        };
    });
    
    if (charts.winPercentage) {
        charts.winPercentage.destroy();
    }
    
    charts.winPercentage = new Chart(winPercentageCtx, {
        type: 'bar',
        data: {
            labels: winPercentageData.map(d => d.name),
            datasets: [{
                label: 'Win Percentage (%)',
                data: winPercentageData.map(d => d.percentage),
                backgroundColor: winPercentageData.map(d => 
                    d.percentage >= 60 ? '#28a745' : 
                    d.percentage >= 40 ? '#ffc107' : '#dc3545'
                ),
                borderColor: '#333',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Points Lost Chart
    const pointsLostCtx = document.getElementById('pointsLostChart').getContext('2d');
    const pointsLostData = users.map(user => {
        const analytics = managerAnalytics[user.user_id];
        return {
            name: user.display_name || user.metadata?.team_name || 'Unknown',
            points: analytics ? analytics.season_analysis.points_lost_to_suboptimal_lineups : 0
        };
    });
    
    if (charts.pointsLost) {
        charts.pointsLost.destroy();
    }
    
    charts.pointsLost = new Chart(pointsLostCtx, {
        type: 'bar',
        data: {
            labels: pointsLostData.map(d => d.name),
            datasets: [{
                label: 'Points Lost to Suboptimal Lineups',
                data: pointsLostData.map(d => d.points),
                backgroundColor: pointsLostData.map(d => 
                    d.points <= 50 ? '#28a745' : 
                    d.points <= 100 ? '#ffc107' : '#dc3545'
                ),
                borderColor: '#333',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Display detailed analysis section
function displayDetailedAnalysis(data) {
    const detailedAnalysisContainer = document.getElementById('detailedAnalysis');
    detailedAnalysisContainer.innerHTML = '';
    
    const managerAnalytics = data.manager_analytics;
    const users = data.users;
    
    users.forEach(user => {
        const userAnalytics = managerAnalytics[user.user_id];
        if (!userAnalytics) return;
        
        const seasonAnalysis = userAnalytics.season_analysis;
        const analysisSection = createDetailedAnalysisSection(user, seasonAnalysis);
        detailedAnalysisContainer.appendChild(analysisSection);
    });
}

// Create detailed analysis section for a manager
function createDetailedAnalysisSection(user, seasonAnalysis) {
    const section = document.createElement('div');
    section.className = 'card mb-4 fade-in';
    
    section.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">
                <i class="fas fa-chart-line me-2"></i>
                ${user.display_name || user.metadata?.team_name || 'Unknown Manager'} - Season Analysis
            </h5>
        </div>
        <div class="card-body">
            <div class="row mb-3">
                <div class="col-md-3">
                    <div class="stat-card positive">
                        <div class="stat-value">${seasonAnalysis.total_actual_points.toFixed(1)}</div>
                        <div class="stat-label">Total Points</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card ${seasonAnalysis.points_lost_to_suboptimal_lineups <= 50 ? 'positive' : 'negative'}">
                        <div class="stat-value">${seasonAnalysis.points_lost_to_suboptimal_lineups.toFixed(1)}</div>
                        <div class="stat-label">Points Lost</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-value">${seasonAnalysis.average_actual_points.toFixed(1)}</div>
                        <div class="stat-label">Avg Points/Week</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-value">${seasonAnalysis.total_weeks}</div>
                        <div class="stat-label">Weeks Played</div>
                    </div>
                </div>
            </div>
            
            <h6>Weekly Performance Breakdown:</h6>
            <div class="weekly-breakdown">
                ${seasonAnalysis.weekly_data.map(week => createWeekAnalysisHTML(week)).join('')}
            </div>
        </div>
    `;
    
    return section;
}

// Create HTML for weekly analysis
function createWeekAnalysisHTML(week) {
    const resultClass = week.result === 'W' ? 'win' : 'loss';
    const resultIcon = week.result === 'W' ? 'fa-trophy' : 'fa-times-circle';
    
    let improvementsHTML = '';
    if (week.improvements && week.improvements.length > 0) {
        improvementsHTML = `
            <div class="mt-2">
                <strong>Lineup Improvements:</strong>
                ${week.improvements.map(improvement => `
                    <div class="improvement-item">
                        <i class="fas fa-arrow-up improvement-gain me-2"></i>
                        Could have gained <span class="improvement-gain">+${improvement.point_gain.toFixed(1)}</span> points by starting 
                        Player ${improvement.with.player_id} (${improvement.with.points.toFixed(1)} pts) 
                        instead of Player ${improvement.replaced.player_id} (${improvement.replaced.points.toFixed(1)} pts)
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="week-analysis ${resultClass}">
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Week ${week.week}</h6>
                <span class="badge ${week.result === 'W' ? 'bg-success' : 'bg-danger'}">
                    <i class="fas ${resultIcon} me-1"></i>${week.result}
                </span>
            </div>
            <div class="row mt-2">
                <div class="col-md-4">
                    <strong>Actual Points:</strong> ${week.actual_points.toFixed(1)}
                </div>
                <div class="col-md-4">
                    <strong>Optimal Points:</strong> ${week.optimal_points.toFixed(1)}
                </div>
                <div class="col-md-4">
                    <strong>Points Lost:</strong> 
                    <span class="${week.optimal_points - week.actual_points > 0 ? 'improvement-loss' : 'improvement-gain'}">
                        ${(week.optimal_points - week.actual_points).toFixed(1)}
                    </span>
                </div>
            </div>
            ${improvementsHTML}
        </div>
    `;
}

// Show manager details in modal
function showManagerDetails(userId) {
    if (!leagueData || !leagueData.manager_analytics[userId]) {
        return;
    }
    
    const userAnalytics = leagueData.manager_analytics[userId];
    const user = userAnalytics.user_info;
    const seasonAnalysis = userAnalytics.season_analysis;
    
    document.getElementById('managerModalTitle').textContent = 
        `${user.display_name || user.metadata?.team_name || 'Unknown Manager'} - Detailed Analysis`;
    
    const modalBody = document.getElementById('managerModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Season Summary</h6>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Record:</span>
                        <strong>${seasonAnalysis.wins}-${seasonAnalysis.losses}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Win Percentage:</span>
                        <strong>${(seasonAnalysis.win_percentage * 100).toFixed(1)}%</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Total Points:</span>
                        <strong>${seasonAnalysis.total_actual_points.toFixed(1)}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Average Points/Week:</span>
                        <strong>${seasonAnalysis.average_actual_points.toFixed(1)}</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Points Lost to Suboptimal Lineups:</span>
                        <strong class="${seasonAnalysis.points_lost_to_suboptimal_lineups > 50 ? 'text-danger' : 'text-success'}">
                            ${seasonAnalysis.points_lost_to_suboptimal_lineups.toFixed(1)}
                        </strong>
                    </li>
                </ul>
            </div>
            <div class="col-md-6">
                <h6>Weekly Performance</h6>
                <div class="weekly-breakdown" style="max-height: 400px; overflow-y: auto;">
                    ${seasonAnalysis.weekly_data.map(week => createWeekAnalysisHTML(week)).join('')}
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('managerModal'));
    modal.show();
}

// Utility functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showResults() {
    document.getElementById('results').style.display = 'block';
}

function hideResults() {
    document.getElementById('results').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}
