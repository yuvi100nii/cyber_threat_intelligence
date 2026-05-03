/**
 * FIR Module
 * Handles First Information Report management
 */

const FIR = {
    currentPage: 1,
    filters: {},

    // Load FIRs
    async load(page = 1) {
        this.currentPage = page;
        App.showLoading('firTable');

        try {
            const params = {
                page,
                limit: 10,
                ...this.filters
            };

            const response = await API.fir.getAll(params);

            if (response.success) {
                this.renderTable(response.firs);
                this.renderPagination(response.pagination);
            }
        } catch (error) {
            console.error('Load FIRs error:', error);
            App.showToast('Failed to load FIRs', 'error');
        }

        this.bindEvents();
    },

    // Bind events
    bindEvents() {
        // Search
        const searchInput = document.getElementById('firSearch');
        searchInput.onkeyup = this.debounce(() => {
            this.filters.search = searchInput.value;
            this.load(1);
        }, 300);

        // Status filter
        document.getElementById('firStatusFilter').onchange = (e) => {
            this.filters.status = e.target.value;
            this.load(1);
        };

        // Add FIR button
        document.getElementById('addFirBtn').onclick = () => this.showAddForm();
    },

    // Render table
    renderTable(firs) {
        const tbody = document.getElementById('firTable');

        if (!firs || firs.length === 0) {
            App.showEmpty('firTable', 'No FIRs found');
            return;
        }

        let html = '';
        firs.forEach(fir => {
            html += `
                <tr>
                    <td><strong>${fir.fir_number}</strong></td>
                    <td>${fir.crime_number || '-'}</td>
                    <td>${fir.complainant_name}</td>
                    <td>${App.formatDate(fir.date_filed)}</td>
                    <td>${App.getStatusBadge(fir.status)}</td>
                    <td>${fir.investigating_officer_name || '-'}</td>
                    <td style="max-width:180px;">
                        ${fir.criminal_names 
                            ? `<span title="${fir.criminal_names}" style="color:#e74c3c;font-size:0.85em;"><i class="fas fa-user-secret"></i> ${fir.criminal_names.length > 30 ? fir.criminal_names.substring(0,30)+'...' : fir.criminal_names}</span>`
                            : '<span style="color:#aaa;font-size:0.85em;">None linked</span>'
                        }
                    </td>
                    <td style="max-width:180px;">
                        ${fir.victim_names 
                            ? `<span title="${fir.victim_names}" style="color:#9b59b6;font-size:0.85em;"><i class="fas fa-user-injured"></i> ${fir.victim_names.length > 30 ? fir.victim_names.substring(0,30)+'...' : fir.victim_names}</span>`
                            : '<span style="color:#aaa;font-size:0.85em;">None linked</span>'
                        }
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-icon" onclick="FIR.viewFir(${fir.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-icon" onclick="FIR.showEditForm(${fir.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${App.user.role === 'admin' ? `
                            <button class="btn btn-sm btn-danger btn-icon" onclick="FIR.deleteFir(${fir.id})" title="Delete">
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
        document.getElementById('firPagination').innerHTML = 
            App.createPagination(pagination, 'FIR.load');
    },

    // Show add form
    async showAddForm() {
        try {
            const [crimesResponse, officersResponse, criminalsResponse, victimsResponse] = await Promise.all([
                API.crimes.getAll({ limit: 100, status: 'open' }),
                API.police.getOfficers(),
                API.criminals.getAll({ limit: 100 }),
                API.victims.getAll({ limit: 100 })
            ]);

            const formHtml = this.getFirForm(
                null, 
                crimesResponse.crimes || [], 
                officersResponse.officers || [],
                criminalsResponse.criminals || [],
                victimsResponse.victims || []
            );
            App.showModal('File New FIR', formHtml);
            document.getElementById('firForm').onsubmit = (e) => this.handleSubmit(e);
        } catch (error) {
            App.showToast('Failed to load form data', 'error');
        }
    },

    // Show edit form
    async showEditForm(id) {
        try {
            const [firResponse, officersResponse, criminalsResponse, victimsResponse] = await Promise.all([
                API.fir.getOne(id),
                API.police.getOfficers(),
                API.criminals.getAll({ limit: 100 }),
                API.victims.getAll({ limit: 100 })
            ]);

            if (firResponse.success) {
                const formHtml = this.getFirForm(
                    firResponse.fir, 
                    [], 
                    officersResponse.officers || [],
                    criminalsResponse.criminals || [],
                    victimsResponse.victims || []
                );
                App.showModal('Edit FIR', formHtml);
                document.getElementById('firForm').onsubmit = (e) => this.handleSubmit(e, id);
            }
        } catch (error) {
            App.showToast('Failed to load FIR details', 'error');
        }
    },

    // Get FIR form HTML
    getFirForm(fir = null, crimes = [], officers = [], allCriminals = [], allVictims = []) {
        const linkedCriminalIds = fir?.linkedCriminals?.map(c => c.id) || [];
        const linkedVictimIds = fir?.linkedVictims?.map(v => v.id) || [];

        return `
            <form id="firForm">
                ${!fir ? `
                    <div class="form-group">
                        <label for="crime_id">Select Crime *</label>
                        <select id="crime_id" name="crime_id" required>
                            <option value="">Select a crime case</option>
                            ${crimes.map(c => `
                                <option value="${c.id}">${c.crime_number} - ${c.title.substring(0, 40)}</option>
                            `).join('')}
                        </select>
                    </div>
                ` : `
                    <div class="form-group">
                        <label>Crime Case</label>
                        <input type="text" disabled value="${fir.crime_number} - ${fir.crime_title || ''}">
                    </div>
                `}
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="complainant_name">Complainant Name *</label>
                        <input type="text" id="complainant_name" name="complainant_name" required 
                               value="${fir?.complainant_name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="complainant_phone">Complainant Phone</label>
                        <input type="text" id="complainant_phone" name="complainant_phone" 
                               value="${fir?.complainant_phone || ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="complainant_address">Complainant Address</label>
                    <textarea id="complainant_address" name="complainant_address" rows="2">${fir?.complainant_address || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-user-secret"></i> Link Criminals</label>
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
                        <label><i class="fas fa-user-injured"></i> Link Victims</label>
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

                <div class="form-row">
                    <div class="form-group">
                        <label for="date_filed">Date Filed *</label>
                        <input type="date" id="date_filed" name="date_filed" required 
                               value="${fir?.date_filed ? fir.date_filed.split('T')[0] : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="time_filed">Time Filed</label>
                        <input type="time" id="time_filed" name="time_filed" 
                               value="${fir?.time_filed || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" name="status">
                            <option value="registered" ${fir?.status === 'registered' ? 'selected' : ''}>Registered</option>
                            <option value="under_investigation" ${fir?.status === 'under_investigation' ? 'selected' : ''}>Under Investigation</option>
                            <option value="chargesheet_filed" ${fir?.status === 'chargesheet_filed' ? 'selected' : ''}>Chargesheet Filed</option>
                            <option value="closed" ${fir?.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="investigating_officer_id">Investigating Officer</label>
                        <select id="investigating_officer_id" name="investigating_officer_id">
                            <option value="">Select Officer</option>
                            ${officers.map(o => `
                                <option value="${o.id}" ${fir?.investigating_officer_id === o.id ? 'selected' : ''}>
                                    ${o.full_name} (${o.badge_number})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="description">Description *</label>
                    <textarea id="description" name="description" rows="4" required 
                               placeholder="Detailed description of the incident">${fir?.description || ''}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${fir ? 'Update' : 'File'} FIR
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

        // Handle multi-select criminals and victims
        const criminals = [];
        e.target.querySelectorAll('input[name="criminals"]:checked').forEach(cb => {
            criminals.push(parseInt(cb.value));
        });
        data.criminals = criminals;

        const victims = [];
        e.target.querySelectorAll('input[name="victims"]:checked').forEach(cb => {
            victims.push(parseInt(cb.value));
        });
        data.victims = victims;

        try {
            let response;
            if (id) {
                response = await API.fir.update(id, data);
            } else {
                response = await API.fir.create(data);
            }

            if (response.success) {
                App.closeModal();
                App.showToast(response.message, 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to save FIR', 'error');
        }
    },

    // View FIR details
    async viewFir(id) {
        try {
            const response = await API.fir.getOne(id);
            if (response.success) {
                const fir = response.fir;
                const html = `
                    <div class="detail-section">
                        <h4>FIR Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>FIR Number</label>
                                <span>${fir.fir_number}</span>
                            </div>
                            <div class="detail-item">
                                <label>Status</label>
                                <span>${App.getStatusBadge(fir.status)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Date Filed</label>
                                <span>${App.formatDate(fir.date_filed)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Time Filed</label>
                                <span>${fir.time_filed || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Linked Crime</h4>
                        <div class="case-item" onclick="Crimes.viewCrime(${fir.crime_id})">
                            <div>
                                <strong>${fir.crime_number}</strong> - ${fir.crime_type?.replace(/_/g, ' ') || ''}
                                <br>
                                <small>${fir.crime_title || ''}</small>
                            </div>
                            ${fir.crime_status ? App.getStatusBadge(fir.crime_status) : ''}
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Complainant Details</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Name</label>
                                <span>${fir.complainant_name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Phone</label>
                                <span>${fir.complainant_phone || '-'}</span>
                            </div>
                        </div>
                        <div class="detail-item" style="margin-top: 15px;">
                            <label>Address</label>
                            <span>${fir.complainant_address || '-'}</span>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Investigation</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Investigating Officer</label>
                                <span>${fir.investigating_officer_name || 'Not assigned'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Badge Number</label>
                                <span>${fir.badge_number || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Department</label>
                                <span>${fir.department || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Description</h4>
                        <p>${fir.description || 'No description available'}</p>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-user-secret" style="color:#e74c3c;"></i> Accused Criminals</h4>
                        ${fir.linkedCriminals && fir.linkedCriminals.length > 0 ? `
                            <table class="table" style="margin-top:8px;font-size:0.88em;">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Alias</th>
                                        <th>Role in Crime</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${fir.linkedCriminals.map(cr => `
                                        <tr style="cursor:pointer;" onclick="Criminals.viewCriminal(${cr.id})">
                                            <td><strong>${cr.first_name} ${cr.last_name}</strong></td>
                                            <td>${cr.alias || '-'}</td>
                                            <td><span style="color:#f39c12;">${cr.crime_role}</span></td>
                                            <td>${App.getStatusBadge(cr.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color:#aaa;">No criminals linked to this case</p>'}
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-user-injured" style="color:#9b59b6;"></i> Victims</h4>
                        ${fir.linkedVictims && fir.linkedVictims.length > 0 ? `
                            <table class="table" style="margin-top:8px;font-size:0.88em;">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Occupation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${fir.linkedVictims.map(v => `
                                        <tr style="cursor:pointer;" onclick="Victims.viewVictim(${v.id})">
                                            <td><strong>${v.first_name} ${v.last_name}</strong></td>
                                            <td>${v.phone || '-'}</td>
                                            <td>${v.occupation || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color:#aaa;">No victims linked to this case</p>'}
                    </div>
                `;
                App.showModal(`FIR Details - ${fir.fir_number}`, html);
            }
        } catch (error) {
            App.showToast('Failed to load FIR details', 'error');
        }
    },

    // Delete FIR
    async deleteFir(id) {
        if (!App.confirm('Are you sure you want to delete this FIR?')) {
            return;
        }

        try {
            const response = await API.fir.delete(id);
            if (response.success) {
                App.showToast('FIR deleted successfully', 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to delete FIR', 'error');
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
