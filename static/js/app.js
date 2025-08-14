// Fantasy Football Analytics App JavaScript

// Test if JavaScript is loading
console.log('JavaScript file loaded successfully!');

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
        console.log('Fetch successful! Data received:', leagueData);
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
    try {
        console.log('Displaying results with data:', data);
        
        updateLeagueOverview(data);
        displayManagerCards(data);
        createCharts(data);
        createTrendlineCharts(data);
        displayDetailedAnalysis(data);
        showResults();
    } catch (error) {
        console.error('Error displaying results:', error);
        alert('Error in displayResults: ' + error.message);
        showError('Failed to display results: ' + error.message);
    }
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
    
    // Create trendline charts
    createTrendlineCharts(data);
}

// Create trendline charts for weekly metrics
function createTrendlineCharts(data) {
    try {

        
        const managerAnalytics = data.manager_analytics;
        const users = data.users;
        
        console.log('Creating trendline charts with data:', { managerAnalytics, users });
        
        // Check if we have data
        if (!managerAnalytics || Object.keys(managerAnalytics).length === 0) {
            console.error('No manager analytics data found');
            alert('No manager analytics data found');
            return;
        }
        
        if (!users || users.length === 0) {
            console.error('No users data found');
            alert('No users data found');
            return;
        }
        
        // Weekly Points Trend Chart
        createWeeklyPointsTrendChart(managerAnalytics, users);
        
        // Optimal vs Actual Points Chart
        createOptimalVsActualChart(managerAnalytics, users);
        
        // Points Lost Per Week Chart
        createPointsLostPerWeekChart(managerAnalytics, users);
        
        // Cumulative Record Chart
        createCumulativeRecordChart(managerAnalytics, users);
    } catch (error) {
        console.error('Error creating trendline charts:', error);
        alert('Error creating trendline charts: ' + error.message);
    }
}

// Weekly Points Trend Chart
function createWeeklyPointsTrendChart(managerAnalytics, users) {

    
    console.log('Creating weekly points trend chart');
    console.log('Manager analytics:', managerAnalytics);
    console.log('Users:', users);
    
    const ctx = document.getElementById('weeklyPointsTrendChart');
    if (!ctx) {
        console.error('weeklyPointsTrendChart canvas not found');
        alert('weeklyPointsTrendChart canvas not found');
        return;
    }
    
    // Test if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        alert('Chart.js is not loaded');
        return;
    }
    
    console.log('Chart.js is available, creating test chart...');
    alert('Chart.js is available, creating test chart...');
    
    // Create a simple test chart first
    const testChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            datasets: [{
                label: 'Test Data',
                data: [10, 20, 15, 25, 30],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    console.log('Test chart created successfully');
    
            // Get all weeks from the first user's data
        const firstUser = Object.values(managerAnalytics)[0];
        console.log('First user:', firstUser);
        
        if (!firstUser || !firstUser.season_analysis || !firstUser.season_analysis.weekly_data) {
            console.error('No weekly data found in first user');
            alert('No weekly data found in first user');
            return;
        }
        
        const weeks = firstUser.season_analysis.weekly_data.map(w => w.week);
        console.log('Weeks:', weeks);
        alert('Weeks found: ' + weeks.join(', '));
        
        const datasets = users.map((user, index) => {
            const analytics = managerAnalytics[user.user_id];
            if (!analytics) {
                console.log('No analytics for user:', user.user_id);
                return null;
            }
            
            const weeklyData = analytics.season_analysis.weekly_data;
            const points = weeklyData.map(w => w.actual_points);
            console.log(`User ${user.display_name} actual points:`, points);
            alert(`User ${user.display_name} actual points: ${points.join(', ')}`);
        
        return {
            label: user.display_name || user.metadata?.team_name || 'Unknown',
            data: points,
            borderColor: getColor(index),
            backgroundColor: getColor(index, 0.1),
            borderWidth: 2,
            fill: false,
            tension: 0.1
        };
    }).filter(dataset => dataset !== null);
    
    if (window.weeklyPointsTrendChart && typeof window.weeklyPointsTrendChart.destroy === 'function') {
        window.weeklyPointsTrendChart.destroy();
    }
    
    window.weeklyPointsTrendChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: weeks,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Points'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Optimal vs Actual Points Chart
function createOptimalVsActualChart(managerAnalytics, users) {

    
    const ctx = document.getElementById('optimalVsActualChart');
    if (!ctx) {
        alert('optimalVsActualChart canvas not found');
        return;
    }
    
    const firstUser = Object.values(managerAnalytics)[0];
    if (!firstUser || !firstUser.season_analysis || !firstUser.season_analysis.weekly_data) {
        alert('No weekly data found in first user for optimal vs actual chart');
        return;
    }
    
    const weeks = firstUser.season_analysis.weekly_data.map(w => w.week);
    alert('Optimal vs Actual weeks: ' + weeks.join(', '));
    
    const datasets = users.map((user, index) => {
        const analytics = managerAnalytics[user.user_id];
        if (!analytics) {
            alert('No analytics for user: ' + user.user_id);
            return null;
        }
        
        const weeklyData = analytics.season_analysis.weekly_data;
        const actualPoints = weeklyData.map(w => w.actual_points);
        const optimalPoints = weeklyData.map(w => w.optimal_points);
        
        alert(`User ${user.display_name} - Actual: ${actualPoints.join(', ')}, Optimal: ${optimalPoints.join(', ')}`);
        
        return [
            {
                label: `${user.display_name || user.metadata?.team_name || 'Unknown'} - Actual`,
                data: actualPoints,
                borderColor: getColor(index),
                backgroundColor: getColor(index, 0.1),
                borderWidth: 2,
                fill: false,
                tension: 0.1
            },
            {
                label: `${user.display_name || user.metadata?.team_name || 'Unknown'} - Optimal`,
                data: optimalPoints,
                borderColor: getColor(index),
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.1
            }
        ];
    }).flat().filter(dataset => dataset !== null);
    
    if (window.optimalVsActualChart && typeof window.optimalVsActualChart.destroy === 'function') {
        window.optimalVsActualChart.destroy();
    }
    
    window.optimalVsActualChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: weeks,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Points'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Points Lost Per Week Chart
function createPointsLostPerWeekChart(managerAnalytics, users) {
    const ctx = document.getElementById('pointsLostPerWeekChart').getContext('2d');
    
    const firstUser = Object.values(managerAnalytics)[0];
    const weeks = firstUser ? firstUser.season_analysis.weekly_data.map(w => w.week) : [];
    
    const datasets = users.map((user, index) => {
        const analytics = managerAnalytics[user.user_id];
        if (!analytics) return null;
        
        const weeklyData = analytics.season_analysis.weekly_data;
        const pointsLost = weeklyData.map(w => w.optimal_points - w.actual_points);
        
        return {
            label: user.display_name || user.metadata?.team_name || 'Unknown',
            data: pointsLost,
            borderColor: getColor(index),
            backgroundColor: getColor(index, 0.1),
            borderWidth: 2,
            fill: false,
            tension: 0.1
        };
    }).filter(dataset => dataset !== null);
    
    if (window.pointsLostPerWeekChart) {
        if (window.pointsLostPerWeekChart && typeof window.pointsLostPerWeekChart.destroy === 'function') {
        window.pointsLostPerWeekChart.destroy();
    }
    }
    
    window.pointsLostPerWeekChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: weeks,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Points Lost'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Cumulative Record Chart
function createCumulativeRecordChart(managerAnalytics, users) {
    const ctx = document.getElementById('cumulativeRecordChart').getContext('2d');
    
    const firstUser = Object.values(managerAnalytics)[0];
    const weeks = firstUser ? firstUser.season_analysis.weekly_data.map(w => w.week) : [];
    
    const datasets = users.map((user, index) => {
        const analytics = managerAnalytics[user.user_id];
        if (!analytics) return null;
        
        const weeklyData = analytics.season_analysis.weekly_data;
        let cumulativeWins = 0;
        const cumulativeRecord = weeklyData.map(w => {
            if (w.result === 'W') cumulativeWins++;
            return cumulativeWins;
        });
        
        return {
            label: user.display_name || user.metadata?.team_name || 'Unknown',
            data: cumulativeRecord,
            borderColor: getColor(index),
            backgroundColor: getColor(index, 0.1),
            borderWidth: 2,
            fill: false,
            tension: 0.1
        };
    }).filter(dataset => dataset !== null);
    
    if (window.cumulativeRecordChart) {
        if (window.cumulativeRecordChart && typeof window.cumulativeRecordChart.destroy === 'function') {
        window.cumulativeRecordChart.destroy();
    }
    }
    
    window.cumulativeRecordChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: weeks,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative Wins'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Helper function to get colors for charts
function getColor(index, alpha = 1) {
    const colors = [
        `rgba(54, 162, 235, ${alpha})`,
        `rgba(255, 99, 132, ${alpha})`,
        `rgba(75, 192, 192, ${alpha})`,
        `rgba(255, 205, 86, ${alpha})`,
        `rgba(153, 102, 255, ${alpha})`,
        `rgba(255, 159, 64, ${alpha})`,
        `rgba(199, 199, 199, ${alpha})`,
        `rgba(83, 102, 255, ${alpha})`,
        `rgba(78, 252, 3, ${alpha})`,
        `rgba(252, 3, 244, ${alpha})`,
        `rgba(3, 252, 198, ${alpha})`,
        `rgba(252, 186, 3, ${alpha})`
    ];
    return colors[index % colors.length];
}

// Display detailed analysis section
function displayDetailedAnalysis(data) {
    try {
        console.log('Displaying detailed analysis');
        const managerTrendlinesContainer = document.getElementById('managerTrendlines');
        if (!managerTrendlinesContainer) {
            console.error('managerTrendlines container not found');
            return;
        }
        
        managerTrendlinesContainer.innerHTML = '';
        
        const managerAnalytics = data.manager_analytics;
        const users = data.users;
        
        console.log('Manager analytics:', managerAnalytics);
        console.log('Users:', users);
        
        users.forEach((user, index) => {
            const userAnalytics = managerAnalytics[user.user_id];
            if (!userAnalytics) {
                console.log('No analytics for user:', user.user_id);
                return;
            }
            
            const seasonAnalysis = userAnalytics.season_analysis;
            const managerSection = createManagerTrendlineSection(user, seasonAnalysis, index);
            managerTrendlinesContainer.appendChild(managerSection);
        });
        
    } catch (error) {
        console.error('Error in displayDetailedAnalysis:', error);
        const managerTrendlinesContainer = document.getElementById('managerTrendlines');
        if (managerTrendlinesContainer) {
            managerTrendlinesContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }
}

// Create individual manager trendline section
function createManagerTrendlineSection(user, seasonAnalysis, index) {
    const section = document.createElement('div');
    section.className = 'card mb-4 fade-in';
    
    section.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">
                <i class="fas fa-chart-line me-2"></i>
                ${user.display_name || user.metadata?.team_name || 'Unknown Manager'} - Season Trends
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
                        <div class="stat-value">${seasonAnalysis.wins}-${seasonAnalysis.losses}</div>
                        <div class="stat-label">Record</div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <canvas id="managerPointsChart${index}" height="200"></canvas>
                </div>
                <div class="col-md-6">
                    <canvas id="managerOptimalChart${index}" height="200"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Create the charts after the DOM is updated
    setTimeout(() => {
        createManagerPointsChart(user, seasonAnalysis, index);
        createManagerOptimalChart(user, seasonAnalysis, index);
    }, 100);
    
    return section;
}

// Create individual manager points trend chart
function createManagerPointsChart(user, seasonAnalysis, index) {
    const ctx = document.getElementById(`managerPointsChart${index}`);
    if (!ctx) return;
    
    const weeks = seasonAnalysis.weekly_data.map(w => w.week);
    const actualPoints = seasonAnalysis.weekly_data.map(w => w.actual_points);
    const optimalPoints = seasonAnalysis.weekly_data.map(w => w.optimal_points);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks,
            datasets: [
                {
                    label: 'Actual Points',
                    data: actualPoints,
                    borderColor: getColor(index),
                    backgroundColor: getColor(index, 0.1),
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Optimal Points',
                    data: optimalPoints,
                    borderColor: getColor(index),
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Weekly Points Performance'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Points'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Create individual manager optimal vs actual chart
function createManagerOptimalChart(user, seasonAnalysis, index) {
    const ctx = document.getElementById(`managerOptimalChart${index}`);
    if (!ctx) return;
    
    const weeks = seasonAnalysis.weekly_data.map(w => w.week);
    const pointsLost = seasonAnalysis.weekly_data.map(w => w.optimal_points - w.actual_points);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: [{
                label: 'Points Lost to Suboptimal Lineups',
                data: pointsLost,
                backgroundColor: pointsLost.map(points => 
                    points <= 5 ? '#28a745' : 
                    points <= 15 ? '#ffc107' : '#dc3545'
                ),
                borderColor: '#333',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Points Lost Per Week'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Points Lost'
                    },
                    beginAtZero: true
                }
            }
        }
    });
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
                        ${improvement.with.name || `Player ${improvement.with.player_id}`} (${improvement.with.points.toFixed(1)} pts) 
                        instead of ${improvement.replaced.name || `Player ${improvement.replaced.player_id}`} (${improvement.replaced.points.toFixed(1)} pts)
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
