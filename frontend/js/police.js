/**
 * Police Module
 * Handles police officer management and case assignments
 */

const Police = {
    // Load police officers
    async load() {
        const tbody = document.getElementById('policeTable');
        tbody.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div></td></tr>';

        try {
            const response = await API.police.getOfficers();

            if (response.success) {
                this.renderTable(response.officers);
            }
        } catch (error) {
            console.error('Load officers error:', error);
            App.showToast('Failed to load officers', 'error');
        }
    },

    // Render table
    renderTable(officers) {
        const tbody = document.getElementById('policeTable');

        if (!officers || officers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-user-shield"></i>
                            <p>No officers found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        officers.forEach(officer => {
            html += `
                <tr>
                    <td><strong>${officer.badge_number || '-'}</strong></td>
                    <td>${officer.full_name}</td>
                    <td>${officer.rank || '-'}</td>
                    <td>${officer.department || '-'}</td>
                    <td>
                        <span class="badge ${officer.active_cases > 5 ? 'badge-danger' : officer.active_cases > 2 ? 'badge-warning' : 'badge-success'}">
                            ${officer.active_cases || 0} active
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-icon" onclick="Police.viewOfficer(${officer.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-icon" onclick="Police.showAssignForm(${officer.id})" title="Assign Case">
                            <i class="fas fa-tasks"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    // View officer details
    async viewOfficer(id) {
        try {
            const response = await API.police.getOfficer(id);
            if (response.success) {
                const officer = response.officer;
                const html = `
                    <div class="detail-section">
                        <h4>Officer Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Full Name</label>
                                <span>${officer.full_name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Badge Number</label>
                                <span>${officer.badge_number || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Rank</label>
                                <span>${officer.rank || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Department</label>
                                <span>${officer.department || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Station</label>
                                <span>${officer.station || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Specialization</label>
                                <span>${officer.specialization || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Joining Date</label>
                                <span>${App.formatDate(officer.joining_date)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Contact</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Email</label>
                                <span>${officer.email || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Phone</label>
                                <span>${officer.phone || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Case Statistics</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Total Cases</label>
                                <span>${officer.statistics?.total_cases || 0}</span>
                            </div>
                            <div class="detail-item">
                                <label>Active Cases</label>
                                <span class="badge badge-warning">${officer.statistics?.active_cases || 0}</span>
                            </div>
                            <div class="detail-item">
                                <label>Completed Cases</label>
                                <span class="badge badge-success">${officer.statistics?.completed_cases || 0}</span>
                            </div>
                        </div>
                    </div>
                    ${officer.assignedCases && officer.assignedCases.length > 0 ? `
                        <div class="detail-section">
                            <h4>Assigned Cases (${officer.assignedCases.length})</h4>
                            <div style="max-height: 300px; overflow-y: auto;">
                                ${officer.assignedCases.map(crime => `
                                    <div class="case-item" onclick="Crimes.viewCrime(${crime.id})">
                                        <div>
                                            <strong>${crime.crime_number}</strong> - ${crime.crime_type.replace(/_/g, ' ')}
                                            <br>
                                            <small>${crime.title.substring(0, 40)}${crime.title.length > 40 ? '...' : ''}</small>
                                            <br>
                                            <small>Role: ${crime.role} | Assigned: ${App.formatDate(crime.assigned_date)}</small>
                                        </div>
                                        <div>
                                            ${App.getStatusBadge(crime.crime_status)}
                                            <br>
                                            ${App.getStatusBadge(crime.assignment_status)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="detail-section">
                            <h4>Assigned Cases</h4>
                            <p class="empty-state">No cases assigned</p>
                        </div>
                    `}
                `;
                App.showModal(`Officer Profile - ${officer.full_name}`, html);
            }
        } catch (error) {
            App.showToast('Failed to load officer details', 'error');
        }
    },

    // Show assign case form
    async showAssignForm(officerId) {
        try {
            // Get available crimes
            const crimesResponse = await API.crimes.getAll({ 
                limit: 100, 
                status: 'open,investigating'
            });

            const crimes = crimesResponse.crimes || [];

            const html = `
                <form id="assignForm">
                    <input type="hidden" name="officer_id" value="${officerId}">
                    <div class="form-group">
                        <label for="crime_id">Select Case *</label>
                        <select id="crime_id" name="crime_id" required>
                            <option value="">Select a case</option>
                            ${crimes.map(c => `
                                <option value="${c.id}">
                                    ${c.crime_number} - ${c.title.substring(0, 40)} (${c.status})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="role">Assignment Role *</label>
                        <select id="role" name="role" required>
                            <option value="investigator">Investigator</option>
                            <option value="lead">Lead Officer</option>
                            <option value="support">Support</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="notes">Notes</label>
                        <textarea id="notes" name="notes" rows="3" placeholder="Additional notes for this assignment"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-tasks"></i> Assign Case
                        </button>
                    </div>
                </form>
            `;

            App.showModal('Assign Case to Officer', html);
            document.getElementById('assignForm').onsubmit = (e) => this.handleAssign(e);
        } catch (error) {
            App.showToast('Failed to load cases', 'error');
        }
    },

    // Handle assignment
    async handleAssign(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await API.police.assignToCase(data);
            if (response.success) {
                App.closeModal();
                App.showToast('Officer assigned to case successfully', 'success');
                this.load();
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to assign officer', 'error');
        }
    },

    // Show case status update form
    showUpdateStatusForm(crimeId, currentStatus) {
        const html = `
            <form id="statusForm">
                <div class="form-group">
                    <label for="status">New Status *</label>
                    <select id="status" name="status" required>
                        <option value="open" ${currentStatus === 'open' ? 'selected' : ''}>Open</option>
                        <option value="investigating" ${currentStatus === 'investigating' ? 'selected' : ''}>Investigating</option>
                        <option value="solved" ${currentStatus === 'solved' ? 'selected' : ''}>Solved</option>
                        <option value="closed" ${currentStatus === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Update Status
                    </button>
                </div>
            </form>
        `;

        App.showModal('Update Case Status', html);
        document.getElementById('statusForm').onsubmit = async (e) => {
            e.preventDefault();
            const status = document.getElementById('status').value;
            try {
                const response = await API.police.updateCaseStatus(crimeId, status);
                if (response.success) {
                    App.closeModal();
                    App.showToast('Case status updated', 'success');
                    this.load();
                }
            } catch (error) {
                App.showToast(error.message || 'Failed to update status', 'error');
            }
        };
    }
};
