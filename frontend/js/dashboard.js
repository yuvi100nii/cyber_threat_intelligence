/**
 * Dashboard Module
 * Handles dashboard statistics and charts
 */

const Dashboard = {
    // Load dashboard data
    async load() {
        try {
            // Load all dashboard data in parallel
            const [statsResponse, crimesByTypeResponse, recentCrimesResponse, criticalCasesResponse] = 
                await Promise.all([
                    API.dashboard.getStats(),
                    API.dashboard.getCrimesByType(),
                    API.dashboard.getRecentCrimes(5),
                    API.dashboard.getCriticalCases()
                ]);

            if (statsResponse.success) {
                this.renderStats(statsResponse.stats);
            }

            if (crimesByTypeResponse.success) {
                this.renderCrimesByTypeChart(crimesByTypeResponse.data);
            }

            if (statsResponse.success) {
                this.renderStatusChart(statsResponse.stats.crimesByStatus);
            }

            if (recentCrimesResponse.success) {
                this.renderRecentCases(recentCrimesResponse.crimes);
            }

            if (criticalCasesResponse.success) {
                this.renderCriticalCases(criticalCasesResponse.cases);
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            App.showToast('Failed to load dashboard data', 'error');
        }
    },

    // Render statistics cards
    renderStats(stats) {
        document.getElementById('statTotalCrimes').textContent = stats.totalCrimes || 0;
        document.getElementById('statActiveCases').textContent = stats.activeCases || 0;
        document.getElementById('statSolvedCases').textContent = stats.solvedCases || 0;
        document.getElementById('statWantedCriminals').textContent = stats.wantedCriminals || 0;
    },

    // Render crimes by type chart
    renderCrimesByTypeChart(data) {
        const container = document.getElementById('crimesByTypeChart');
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-state">No data available</p>';
            return;
        }

        const maxCount = Math.max(...data.map(d => d.count));
        const maxHeight = 180;

        let html = '';
        data.slice(0, 6).forEach(item => {
            const height = (item.count / maxCount) * maxHeight;
            const label = item.crime_type.replace(/_/g, ' ');
            html += `
                <div class="chart-bar">
                    <span class="chart-bar-value">${item.count}</span>
                    <div class="chart-bar-fill" style="height: ${height}px"></div>
                    <span class="chart-bar-label">${label}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // Render case status chart
    renderStatusChart(statusData) {
        const container = document.getElementById('caseStatusChart');
        if (!statusData || Object.keys(statusData).length === 0) {
            container.innerHTML = '<p class="empty-state">No data available</p>';
            return;
        }

        const statuses = ['open', 'investigating', 'solved', 'closed'];
        const colors = {
            open: '#3498db',
            investigating: '#f39c12',
            solved: '#27ae60',
            closed: '#7f8c8d'
        };

        const total = Object.values(statusData).reduce((a, b) => a + b, 0);
        const maxCount = Math.max(...Object.values(statusData));
        const maxHeight = 180;

        let html = '';
        statuses.forEach(status => {
            const count = statusData[status] || 0;
            const height = maxCount > 0 ? (count / maxCount) * maxHeight : 0;
            html += `
                <div class="chart-bar">
                    <span class="chart-bar-value">${count}</span>
                    <div class="chart-bar-fill" style="height: ${height}px; background: ${colors[status]}"></div>
                    <span class="chart-bar-label">${status}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // Render recent cases table
    renderRecentCases(crimes) {
        const tbody = document.getElementById('recentCasesTable');
        
        if (!crimes || crimes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <p>No recent cases</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        crimes.forEach(crime => {
            html += `
                <tr>
                    <td>${crime.crime_number}</td>
                    <td>${crime.crime_type.replace(/_/g, ' ')}</td>
                    <td>${crime.title.substring(0, 30)}${crime.title.length > 30 ? '...' : ''}</td>
                    <td>${App.getStatusBadge(crime.status)}</td>
                    <td>${App.formatDate(crime.date_occurred)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    // Render critical cases
    renderCriticalCases(cases) {
        const container = document.getElementById('criticalCasesList');

        if (!cases || cases.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No critical cases</p>
                </div>
            `;
            return;
        }

        let html = '';
        cases.forEach(crime => {
            html += `
                <div class="case-item" onclick="Crimes.viewCrime(${crime.id})">
                    <div class="case-item-info">
                        <h4>${crime.crime_number} - ${crime.crime_type.replace(/_/g, ' ')}</h4>
                        <p>${crime.title.substring(0, 40)}${crime.title.length > 40 ? '...' : ''}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${crime.city || crime.location}</p>
                    </div>
                    <div>
                        ${App.getStatusBadge(crime.status)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
};
