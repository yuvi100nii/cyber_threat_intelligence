/**
 * Victims Module
 * Handles victim record management
 */

const Victims = {
    currentPage: 1,
    filters: {},

    // Load victims
    async load(page = 1) {
        this.currentPage = page;
        App.showLoading('victimsTable');

        try {
            const params = {
                page,
                limit: 10,
                ...this.filters
            };

            const response = await API.victims.getAll(params);

            if (response.success) {
                this.renderTable(response.victims);
                this.renderPagination(response.pagination);
            }
        } catch (error) {
            console.error('Load victims error:', error);
            App.showToast('Failed to load victims', 'error');
        }

        this.bindEvents();
    },

    // Bind events
    bindEvents() {
        // Search
        const searchInput = document.getElementById('victimSearch');
        searchInput.onkeyup = this.debounce(() => {
            this.filters.search = searchInput.value;
            this.load(1);
        }, 300);

        // Add victim button
        document.getElementById('addVictimBtn').onclick = () => this.showAddForm();
    },

    // Render table
    renderTable(victims) {
        const tbody = document.getElementById('victimsTable');

        if (!victims || victims.length === 0) {
            App.showEmpty('victimsTable', 'No victims found');
            return;
        }

        let html = '';
        victims.forEach(victim => {
            html += `
                <tr>
                    <td><strong>${victim.first_name} ${victim.last_name}</strong></td>
                    <td>${victim.gender || '-'}</td>
                    <td>${victim.phone || '-'}</td>
                    <td>${victim.email || '-'}</td>
                    <td>
                        ${victim.latest_case_number 
                            ? `<span style="color:#3498db;font-weight:600;">${victim.latest_case_number}</span>${victim.crime_count > 1 ? ` <small style="color:#aaa;">+${victim.crime_count - 1} more</small>` : ''}`
                            : `<span style="color:#aaa;">${victim.crime_count || 0} cases</span>`
                        }
                    </td>
                    <td>
                        ${victim.latest_fir_number 
                            ? `<span style="color:#9b59b6;font-weight:600;">${victim.latest_fir_number}</span>`
                            : '<span style="color:#aaa;">No FIR</span>'
                        }
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-icon" onclick="Victims.viewVictim(${victim.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-icon" onclick="Victims.showEditForm(${victim.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-icon" onclick="Victims.deleteVictim(${victim.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    // Render pagination
    renderPagination(pagination) {
        document.getElementById('victimsPagination').innerHTML = 
            App.createPagination(pagination, 'Victims.load');
    },

    // Show add form
    async showAddForm() {
        try {
            const crimesResponse = await API.crimes.getAll({ limit: 100 });
            const crimes = crimesResponse.success ? crimesResponse.crimes : [];
            const formHtml = this.getVictimForm(null, crimes);
            App.showModal('Add New Victim', formHtml);
            document.getElementById('victimForm').onsubmit = (e) => this.handleSubmit(e);
        } catch (error) {
            App.showToast('Failed to load crimes for selection', 'error');
        }
    },

    // Show edit form
    async showEditForm(id) {
        try {
            const [victimResponse, crimesResponse] = await Promise.all([
                API.victims.getOne(id),
                API.crimes.getAll({ limit: 100 })
            ]);
            
            if (victimResponse.success) {
                const crimes = crimesResponse.success ? crimesResponse.crimes : [];
                const formHtml = this.getVictimForm(victimResponse.victim, crimes);
                App.showModal('Edit Victim', formHtml);
                document.getElementById('victimForm').onsubmit = (e) => this.handleSubmit(e, id);
            }
        } catch (error) {
            App.showToast('Failed to load victim details', 'error');
        }
    },

    // Get victim form HTML
    getVictimForm(victim = null, crimes = []) {
        const linkedCrimeIds = victim?.linkedCrimes?.map(c => c.id) || [];
        
        return `
            <form id="victimForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="first_name">First Name *</label>
                        <input type="text" id="first_name" name="first_name" required 
                               value="${victim?.first_name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="last_name">Last Name *</label>
                        <input type="text" id="last_name" name="last_name" required 
                               value="${victim?.last_name || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="date_of_birth">Date of Birth</label>
                        <input type="date" id="date_of_birth" name="date_of_birth" 
                               value="${victim?.date_of_birth ? victim.date_of_birth.split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender</label>
                        <select id="gender" name="gender">
                            <option value="">Select</option>
                            <option value="male" ${victim?.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${victim?.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${victim?.gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="text" id="phone" name="phone" value="${victim?.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" value="${victim?.email || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address" rows="2">${victim?.address || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-file-alt"></i> Link to Crimes</label>
                    <div class="searchable-checkbox-group">
                        <input type="text" class="search-filter" placeholder="Filter crimes..." 
                               onkeyup="App.filterCheckboxes(this)">
                        <div class="checkbox-list">
                            ${crimes.map(crime => `
                                <label class="checkbox-item">
                                    <input type="checkbox" name="crimes" value="${crime.id}" 
                                           ${linkedCrimeIds.includes(crime.id) ? 'checked' : ''}>
                                    <span><strong>${crime.crime_number}</strong> - ${crime.title}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="occupation">Occupation</label>
                    <input type="text" id="occupation" name="occupation" value="${victim?.occupation || ''}">
                </div>
                <div class="form-group">
                    <label for="injury_description">Injury Description</label>
                    <textarea id="injury_description" name="injury_description" rows="2" 
                               placeholder="Describe any injuries sustained">${victim?.injury_description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="statement">Statement</label>
                    <textarea id="statement" name="statement" rows="3" 
                               placeholder="Victim's statement or testimony">${victim?.statement || ''}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${victim ? 'Update' : 'Create'} Victim
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
        
        // Handle multi-select crimes
        const crimes = [];
        e.target.querySelectorAll('input[name="crimes"]:checked').forEach(cb => {
            crimes.push(parseInt(cb.value));
        });
        data.crimes = crimes;

        try {
            let response;
            if (id) {
                response = await API.victims.update(id, data);
            } else {
                response = await API.victims.create(data);
            }

            if (response.success) {
                App.closeModal();
                App.showToast(response.message, 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to save victim', 'error');
        }
    },

    // View victim details
    async viewVictim(id) {
        try {
            const response = await API.victims.getOne(id);
            if (response.success) {
                const victim = response.victim;
                const html = `
                    <div class="detail-section">
                        <h4>Personal Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Full Name</label>
                                <span>${victim.first_name} ${victim.last_name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Date of Birth</label>
                                <span>${App.formatDate(victim.date_of_birth)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Gender</label>
                                <span>${victim.gender || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Occupation</label>
                                <span>${victim.occupation || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Contact Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Phone</label>
                                <span>${victim.phone || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Email</label>
                                <span>${victim.email || '-'}</span>
                            </div>
                        </div>
                        <div class="detail-item" style="margin-top: 15px;">
                            <label>Address</label>
                            <span>${victim.address || '-'}</span>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Case Information</h4>
                        <div class="detail-item">
                            <label>Injury Description</label>
                            <span>${victim.injury_description || 'No injuries recorded'}</span>
                        </div>
                        <div class="detail-item" style="margin-top: 15px;">
                            <label>Statement</label>
                            <span>${victim.statement || 'No statement recorded'}</span>
                        </div>
                    </div>

                    ${victim.associatedCriminals && victim.associatedCriminals.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-user-secret" style="color:#e74c3c;"></i> Associated Criminals (${victim.associatedCriminals.length})</h4>
                            <p style="font-size:0.85em;color:#777;margin-bottom:10px;">Criminals linked to the same cases as this victim.</p>
                            <table class="table" style="font-size:0.88em;">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Alias</th>
                                        <th>Role in Crime</th>
                                        <th>Case #</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${victim.associatedCriminals.map(criminal => `
                                        <tr style="cursor:pointer;" onclick="Criminals.viewCriminal(${criminal.id})">
                                            <td><strong>${criminal.first_name} ${criminal.last_name}</strong></td>
                                            <td>${criminal.alias || '-'}</td>
                                            <td><span class="badge badge-outline">${criminal.crime_role || 'Suspect'}</span></td>
                                            <td><span style="color:#3498db;">${criminal.crime_number}</span></td>
                                            <td>${App.getStatusBadge(criminal.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}

                    ${victim.linkedCrimes && victim.linkedCrimes.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-link" style="color:#9b59b6;"></i> Linked Cases & FIRs (${victim.linkedCrimes.length})</h4>
                            <table class="table" style="margin-top:10px;font-size:0.88em;">
                                <thead>
                                    <tr>
                                        <th>Case #</th>
                                        <th>Crime Type</th>
                                        <th>Date</th>
                                        <th>FIR #</th>
                                        <th>FIR Status</th>
                                        <th>Case Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${victim.linkedCrimes.map(crime => `
                                        <tr style="cursor:pointer;" onclick="Crimes.viewCrime(${crime.id})">
                                            <td><strong>${crime.crime_number}</strong></td>
                                            <td>${crime.crime_type.replace(/_/g, ' ')}</td>
                                            <td>${App.formatDate(crime.date_occurred)}</td>
                                            <td>${crime.fir_number ? `<strong style="color:#9b59b6;">${crime.fir_number}</strong>` : '<em style="color:#aaa;">No FIR</em>'}</td>
                                            <td>${crime.fir_status ? App.getStatusBadge(crime.fir_status) : '-'}</td>
                                            <td>${App.getStatusBadge(crime.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="detail-section">
                            <h4>Linked Cases</h4>
                            <p class="empty-state">No cases linked</p>
                        </div>
                    `}
                `;
                App.showModal(`Victim Details - ${victim.first_name} ${victim.last_name}`, html);
            }
        } catch (error) {
            App.showToast('Failed to load victim details', 'error');
        }
    },

    // Delete victim
    async deleteVictim(id) {
        if (!App.confirm('Are you sure you want to delete this victim record?')) {
            return;
        }

        try {
            const response = await API.victims.delete(id);
            if (response.success) {
                App.showToast('Victim deleted successfully', 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to delete victim', 'error');
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
