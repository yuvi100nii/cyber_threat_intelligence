/**
 * Crimes Module
 * Handles crime record management
 */

const Crimes = {
    currentPage: 1,
    filters: {},

    // Load crimes
    async load(page = 1) {
        this.currentPage = page;
        App.showLoading('crimesTable');

        try {
            const params = {
                page,
                limit: 10,
                ...this.filters
            };

            const response = await API.crimes.getAll(params);

            if (response.success) {
                this.renderTable(response.crimes);
                this.renderPagination(response.pagination);
            }
        } catch (error) {
            console.error('Load crimes error:', error);
            App.showToast('Failed to load crimes', 'error');
        }

        // Bind filter events
        this.bindEvents();
    },

    // Bind events
    bindEvents() {
        // Search
        const searchInput = document.getElementById('crimeSearch');
        searchInput.onkeyup = this.debounce(() => {
            this.filters.search = searchInput.value;
            this.load(1);
        }, 300);

        // Type filter
        document.getElementById('crimeTypeFilter').onchange = (e) => {
            this.filters.crime_type = e.target.value;
            this.load(1);
        };

        // Status filter
        document.getElementById('crimeStatusFilter').onchange = (e) => {
            this.filters.status = e.target.value;
            this.load(1);
        };

        // Add crime button
        document.getElementById('addCrimeBtn').onclick = () => this.showAddForm();
    },

    // Render table
    renderTable(crimes) {
        const tbody = document.getElementById('crimesTable');

        if (!crimes || crimes.length === 0) {
            App.showEmpty('crimesTable', 'No crimes found');
            return;
        }

        let html = '';
        crimes.forEach(crime => {
            html += `
                <tr>
                    <td><strong>${crime.crime_number}</strong></td>
                    <td>${crime.crime_type.replace(/_/g, ' ')}</td>
                    <td>${crime.title.substring(0, 40)}${crime.title.length > 40 ? '...' : ''}</td>
                    <td>${crime.city || crime.location.substring(0, 20)}</td>
                    <td>${App.formatDate(crime.date_occurred)}</td>
                    <td>${App.getStatusBadge(crime.severity)}</td>
                    <td>${App.getStatusBadge(crime.status)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-icon" onclick="Crimes.viewCrime(${crime.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-icon" onclick="Crimes.showEditForm(${crime.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${App.user.role === 'admin' ? `
                            <button class="btn btn-sm btn-danger btn-icon" onclick="Crimes.deleteCrime(${crime.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    // Render pagination
    renderPagination(pagination) {
        document.getElementById('crimesPagination').innerHTML = 
            App.createPagination(pagination, 'Crimes.load');
    },

    // Show add crime form
    async showAddForm() {
        try {
            const [criminalsResp, victimsResp] = await Promise.all([
                API.criminals.getAll({ limit: 100 }),
                API.victims.getAll({ limit: 100 })
            ]);
            
            const formHtml = this.getCrimeForm(null, criminalsResp.criminals || [], victimsResp.victims || []);
            App.showModal('Add New Crime', formHtml);
            document.getElementById('crimeForm').onsubmit = (e) => this.handleSubmit(e);
        } catch (error) {
            App.showToast('Failed to load form data', 'error');
        }
    },

    // Show edit crime form
    async showEditForm(id) {
        try {
            const [crimeResp, criminalsResp, victimsResp] = await Promise.all([
                API.crimes.getOne(id),
                API.criminals.getAll({ limit: 100 }),
                API.victims.getAll({ limit: 100 })
            ]);

            if (crimeResp.success) {
                const formHtml = this.getCrimeForm(crimeResp.crime, criminalsResp.criminals || [], victimsResp.victims || []);
                App.showModal('Edit Crime', formHtml);
                document.getElementById('crimeForm').onsubmit = (e) => this.handleSubmit(e, id);
            }
        } catch (error) {
            App.showToast('Failed to load crime details', 'error');
        }
    },

    // Get crime form HTML
    getCrimeForm(crime = null, allCriminals = [], allVictims = []) {
        const linkedCriminalIds = crime?.criminals?.map(c => c.id) || [];
        const linkedVictimIds = crime?.victims?.map(v => v.id) || [];

        return `
            <form id="crimeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="crime_type">Crime Type *</label>
                        <select id="crime_type" name="crime_type" required>
                            <option value="">Select Type</option>
                            <option value="theft" ${crime?.crime_type === 'theft' ? 'selected' : ''}>Theft</option>
                            <option value="robbery" ${crime?.crime_type === 'robbery' ? 'selected' : ''}>Robbery</option>
                            <option value="assault" ${crime?.crime_type === 'assault' ? 'selected' : ''}>Assault</option>
                            <option value="murder" ${crime?.crime_type === 'murder' ? 'selected' : ''}>Murder</option>
                            <option value="fraud" ${crime?.crime_type === 'fraud' ? 'selected' : ''}>Fraud</option>
                            <option value="cybercrime" ${crime?.crime_type === 'cybercrime' ? 'selected' : ''}>Cybercrime</option>
                            <option value="drug_offense" ${crime?.crime_type === 'drug_offense' ? 'selected' : ''}>Drug Offense</option>
                            <option value="kidnapping" ${crime?.crime_type === 'kidnapping' ? 'selected' : ''}>Kidnapping</option>
                            <option value="domestic_violence" ${crime?.crime_type === 'domestic_violence' ? 'selected' : ''}>Domestic Violence</option>
                            <option value="other" ${crime?.crime_type === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="severity">Severity *</label>
                        <select id="severity" name="severity" required>
                            <option value="low" ${crime?.severity === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${crime?.severity === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${crime?.severity === 'high' ? 'selected' : ''}>High</option>
                            <option value="critical" ${crime?.severity === 'critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required minlength="5" maxlength="200" 
                           value="${crime?.title || ''}" placeholder="Brief description of the crime">
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="3" 
                               placeholder="Detailed description of the crime">${crime?.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="date_occurred">Date Occurred *</label>
                        <input type="date" id="date_occurred" name="date_occurred" required 
                               value="${crime?.date_occurred ? crime.date_occurred.split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label for="time_occurred">Time Occurred</label>
                        <input type="time" id="time_occurred" name="time_occurred" 
                               value="${crime?.time_occurred || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-user-secret"></i> Accused Criminals</label>
                        <div class="searchable-checkbox-group">
                            <input type="text" class="search-filter" placeholder="Filter criminals..." 
                                   onkeyup="App.filterCheckboxes(this)">
                            <div class="checkbox-list">
                                ${allCriminals.map(c => `
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="criminals" value="${c.id}" 
                                               ${linkedCriminalIds.includes(c.id) ? 'checked' : ''}>
                                        <span>${c.first_name} ${c.last_name} ${c.alias ? `(${c.alias})` : ''}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-user-injured"></i> Victims</label>
                        <div class="searchable-checkbox-group">
                            <input type="text" class="search-filter" placeholder="Filter victims..." 
                                   onkeyup="App.filterCheckboxes(this)">
                            <div class="checkbox-list">
                                ${allVictims.map(v => `
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="victims" value="${v.id}" 
                                               ${linkedVictimIds.includes(v.id) ? 'checked' : ''}>
                                        <span>${v.first_name} ${v.last_name}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="location">Location *</label>
                    <input type="text" id="location" name="location" required 
                           value="${crime?.location || ''}" placeholder="Street address or area">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="city">City</label>
                        <input type="text" id="city" name="city" value="${crime?.city || ''}">
                    </div>
                    <div class="form-group">
                        <label for="state">State</label>
                        <input type="text" id="state" name="state" value="${crime?.state || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" name="status">
                            <option value="open" ${crime?.status === 'open' ? 'selected' : ''}>Open</option>
                            <option value="investigating" ${crime?.status === 'investigating' ? 'selected' : ''}>Investigating</option>
                            <option value="closed" ${crime?.status === 'closed' ? 'selected' : ''}>Closed</option>
                            <option value="solved" ${crime?.status === 'solved' ? 'selected' : ''}>Solved</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="weapon_used">Weapon Used</label>
                        <input type="text" id="weapon_used" name="weapon_used" value="${crime?.weapon_used || ''}">
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${crime ? 'Update' : 'Create'} Crime
                    </button>
                </div>
            </form>
        `;
    },

    // Handle form submit
    async handleSubmit(e, id = null) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Handle multiple checkboxes
        data.criminals = Array.from(e.target.querySelectorAll('input[name="criminals"]:checked')).map(cb => cb.value);
        data.victims = Array.from(e.target.querySelectorAll('input[name="victims"]:checked')).map(cb => cb.value);

        try {
            let response;
            if (id) {
                response = await API.crimes.update(id, data);
            } else {
                response = await API.crimes.create(data);
            }

            if (response.success) {
                App.closeModal();
                App.showToast(response.message, 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to save crime', 'error');
        }
    },

    // View crime details
    async viewCrime(id) {
        try {
            const response = await API.crimes.getOne(id);
            if (response.success) {
                const crime = response.crime;
                const html = `
                    <div class="detail-section">
                        <h4>Basic Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Case Number</label>
                                <span>${crime.crime_number}</span>
                            </div>
                            <div class="detail-item">
                                <label>Type</label>
                                <span>${crime.crime_type.replace(/_/g, ' ')}</span>
                            </div>
                            <div class="detail-item">
                                <label>Status</label>
                                <span>${App.getStatusBadge(crime.status)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Severity</label>
                                <span>${App.getStatusBadge(crime.severity)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Crime Details</h4>
                        <div class="detail-item">
                            <label>Title</label>
                            <span>${crime.title}</span>
                        </div>
                        <div class="detail-item">
                            <label>Description</label>
                            <span>${crime.description || 'No description'}</span>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Date</label>
                                <span>${App.formatDate(crime.date_occurred)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Time</label>
                                <span>${crime.time_occurred || 'Not specified'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Location</label>
                                <span>${crime.location}</span>
                            </div>
                            <div class="detail-item">
                                <label>City/State</label>
                                <span>${[crime.city, crime.state].filter(Boolean).join(', ') || '-'}</span>
                            </div>
                        </div>
                    </div>
                    ${crime.criminals && crime.criminals.length > 0 ? `
                        <div class="detail-section">
                            <h4>Linked Criminals (${crime.criminals.length})</h4>
                            ${crime.criminals.map(c => `
                                <div class="case-item">
                                    <div>
                                        <strong>${c.first_name} ${c.last_name}</strong>
                                        ${c.alias ? `(${c.alias})` : ''}
                                        <br>
                                        <small>Role: ${c.crime_role}</small>
                                    </div>
                                    ${App.getStatusBadge(c.status)}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${crime.victims && crime.victims.length > 0 ? `
                        <div class="detail-section">
                            <h4>Victims (${crime.victims.length})</h4>
                            ${crime.victims.map(v => `
                                <div class="case-item">
                                    <div>
                                        <strong>${v.first_name} ${v.last_name}</strong>
                                        <br>
                                        <small>${v.injury_description || 'No injury details'}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${crime.assignedOfficers && crime.assignedOfficers.length > 0 ? `
                        <div class="detail-section">
                            <h4>Assigned Officers</h4>
                            ${crime.assignedOfficers.map(o => `
                                <div class="case-item">
                                    <div>
                                        <strong>${o.full_name}</strong> (${o.badge_number})
                                        <br>
                                        <small>Role: ${o.role} | ${o.department}</small>
                                    </div>
                                    ${App.getStatusBadge(o.status)}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${crime.fir ? `
                        <div class="detail-section">
                            <h4>FIR Details</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>FIR Number</label>
                                    <span>${crime.fir.fir_number}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Status</label>
                                    <span>${App.getStatusBadge(crime.fir.status)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Complainant</label>
                                    <span>${crime.fir.complainant_name}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Date Filed</label>
                                    <span>${App.formatDate(crime.fir.date_filed)}</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                `;
                App.showModal(`Crime Details - ${crime.crime_number}`, html);
            }
        } catch (error) {
            App.showToast('Failed to load crime details', 'error');
        }
    },

    // Delete crime
    async deleteCrime(id) {
        if (!App.confirm('Are you sure you want to delete this crime record? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await API.crimes.delete(id);
            if (response.success) {
                App.showToast('Crime deleted successfully', 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to delete crime', 'error');
        }
    },

    // Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
