// ============================================
// Analytics Dashboard
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const analyticsDate = document.getElementById('analyticsDate');
    const analyticsContent = document.getElementById('analyticsContent');
    const emptyAnalytics = document.getElementById('emptyAnalytics');
    const loadingAnalytics = document.getElementById('loadingAnalytics');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');

    // Summary elements
    const totalHours = document.getElementById('totalHours');
    const totalActivities = document.getElementById('totalActivities');
    const topCategory = document.getElementById('topCategory');
    const avgDuration = document.getElementById('avgDuration');

    // Category list
    const categoryList = document.getElementById('categoryList');

    // Charts
    let pieChart = null;
    let barChart = null;

    // State
    let currentDate = Utils.getTodayDate();
    let activities = [];

    // Get date from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
        currentDate = dateParam;
    }

    // Initialize
    init();

    function init() {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            userName.textContent = user.displayName || user.email?.split('@')[0] || 'User';
            
            analyticsDate.value = currentDate;
            analyticsDate.max = Utils.getTodayDate();
            
            loadAnalytics();
        });
    }

    // Load analytics
    async function loadAnalytics() {
        showLoading(true);

        try {
            activities = await DB.getActivities(currentDate);
            
            if (activities.length === 0) {
                showEmptyState();
            } else {
                renderAnalytics();
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            showEmptyState();
        }

        showLoading(false);
    }

    // Show loading
    function showLoading(show) {
        if (show) {
            loadingAnalytics.classList.remove('hidden');
            analyticsContent.classList.add('hidden');
            emptyAnalytics.classList.add('hidden');
        } else {
            loadingAnalytics.classList.add('hidden');
        }
    }

    // Show empty state
    function showEmptyState() {
        emptyAnalytics.classList.remove('hidden');
        analyticsContent.classList.add('hidden');
    }

    // Render analytics
    function renderAnalytics() {
        analyticsContent.classList.remove('hidden');
        emptyAnalytics.classList.add('hidden');

        updateSummary();
        renderCharts();
        renderCategoryBreakdown();
    }

    // Update summary cards
    function updateSummary() {
        const total = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
        
        // Total hours
        totalHours.textContent = Utils.formatDuration(total);
        
        // Activity count
        totalActivities.textContent = activities.length;
        
        // Top category
        const categoryTotals = getCategoryTotals();
        const topCat = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])[0];
        topCategory.textContent = topCat ? `${Utils.getCategoryEmoji(topCat[0])} ${topCat[0]}` : '-';
        
        // Average duration
        const avg = Math.round(total / activities.length);
        avgDuration.textContent = Utils.formatDuration(avg);
    }

    // Get totals by category
    function getCategoryTotals() {
        return activities.reduce((acc, act) => {
            acc[act.category] = (acc[act.category] || 0) + act.duration;
            return acc;
        }, {});
    }

    // Render charts
    function renderCharts() {
        renderPieChart();
        renderBarChart();
    }

    // Render pie chart
    function renderPieChart() {
        const ctx = document.getElementById('pieChart').getContext('2d');
        const categoryTotals = getCategoryTotals();
        
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const colors = labels.map(cat => Utils.getCategoryColor(cat));

        if (pieChart) {
            pieChart.destroy();
        }

        pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleFont: {
                            family: "'Inter', sans-serif",
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            family: "'Inter', sans-serif",
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return ` ${Utils.formatDuration(context.raw)} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

    // Render bar chart
    function renderBarChart() {
        const ctx = document.getElementById('barChart').getContext('2d');
        
        const labels = activities.map(act => 
            act.name.length > 15 ? act.name.substring(0, 15) + '...' : act.name
        );
        const data = activities.map(act => act.duration);
        const colors = activities.map(act => Utils.getCategoryColor(act.category));

        if (barChart) {
            barChart.destroy();
        }

        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Duration (minutes)',
                    data: data,
                    backgroundColor: colors.map(c => c + '99'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: activities.length > 5 ? 'y' : 'x',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleFont: {
                            family: "'Inter', sans-serif",
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            family: "'Inter', sans-serif",
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                return activities[context[0].dataIndex].name;
                            },
                            label: function(context) {
                                return ` ${Utils.formatDuration(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Render category breakdown
    function renderCategoryBreakdown() {
        const categoryTotals = getCategoryTotals();
        const sortedCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);

        categoryList.innerHTML = sortedCategories.map(([cat, duration]) => `
            <div class="category-item">
                <span class="category-dot" style="background-color: ${Utils.getCategoryColor(cat)}"></span>
                <span class="category-name">${Utils.getCategoryEmoji(cat)} ${cat}</span>
                <span class="category-duration">${Utils.formatDuration(duration)}</span>
            </div>
        `).join('');
    }

    // Event Listeners

    // Date change
    analyticsDate.addEventListener('change', (e) => {
        currentDate = e.target.value;
        // Update URL
        window.history.replaceState({}, '', `analytics.html?date=${currentDate}`);
        loadAnalytics();
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
});
