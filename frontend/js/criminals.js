/**
 * Criminals Module
 * Handles criminal record management with photo upload
 */

const Criminals = {
    currentPage: 1,
    filters: {},

    // Load criminals
    async load(page = 1) {
        this.currentPage = page;
        const container = document.getElementById('criminalsGrid');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            const params = {
                page,
                limit: 8,
                ...this.filters
            };

            const response = await API.criminals.getAll(params);

            if (response.success) {
                this.renderGrid(response.criminals);
                this.renderPagination(response.pagination);
            }
        } catch (error) {
            console.error('Load criminals error:', error);
            App.showToast('Failed to load criminals', 'error');
        }

        this.bindEvents();
    },

    // Bind events
    bindEvents() {
        // Search
        const searchInput = document.getElementById('criminalSearch');
        searchInput.onkeyup = this.debounce(() => {
            this.filters.search = searchInput.value;
            this.load(1);
        }, 300);

        // Status filter
        document.getElementById('criminalStatusFilter').onchange = (e) => {
            this.filters.status = e.target.value;
            this.load(1);
        };

        // Add criminal button
        document.getElementById('addCriminalBtn').onclick = () => this.showAddForm();
    },

    // Render grid
    renderGrid(criminals) {
        const container = document.getElementById('criminalsGrid');

        if (!criminals || criminals.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-user-secret"></i>
                    <p>No criminals found</p>
                </div>
            `;
            return;
        }

        let html = '';
        criminals.forEach(criminal => {
            html += `
                <div class="criminal-card">
                    <div class="criminal-photo">
                        ${criminal.photo_path 
                            ? `<img src="${criminal.photo_path}" alt="${criminal.first_name}">`
                            : '<i class="fas fa-user-secret"></i>'
                        }
                    </div>
                    <div class="criminal-info">
                        <h4>${criminal.first_name} ${criminal.last_name}</h4>
                        ${criminal.alias ? `<p><strong>Alias:</strong> ${criminal.alias}</p>` : ''}
                        <p>${App.getStatusBadge(criminal.status)}</p>
                        <p><i class="fas fa-gavel"></i> ${criminal.crime_count || 0} linked crimes</p>
                    </div>
                    <div class="criminal-actions">
                        <button class="btn btn-sm btn-primary" onclick="Criminals.viewCriminal(${criminal.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="Criminals.showEditForm(${criminal.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${App.user.role === 'admin' ? `
                            <button class="btn btn-sm btn-danger" onclick="Criminals.deleteCriminal(${criminal.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // Render pagination
    renderPagination(pagination) {
        document.getElementById('criminalsPagination').innerHTML = 
            App.createPagination(pagination, 'Criminals.load');
    },

    // Show add form
    async showAddForm() {
        try {
            const crimesResponse = await API.crimes.getAll({ limit: 100 });
            const crimes = crimesResponse.success ? crimesResponse.crimes : [];
            const formHtml = this.getCriminalForm(null, crimes);
            App.showModal('Add New Criminal', formHtml);
            document.getElementById('criminalForm').onsubmit = (e) => this.handleSubmit(e);
        } catch (error) {
            App.showToast('Failed to load crimes for selection', 'error');
        }
    },

    // Show edit form
    async showEditForm(id) {
        try {
            const [criminalResponse, crimesResponse] = await Promise.all([
                API.criminals.getOne(id),
                API.crimes.getAll({ limit: 100 })
            ]);
            
            if (criminalResponse.success) {
                const crimes = crimesResponse.success ? crimesResponse.crimes : [];
                const formHtml = this.getCriminalForm(criminalResponse.criminal, crimes);
                App.showModal('Edit Criminal', formHtml);
                document.getElementById('criminalForm').onsubmit = (e) => this.handleSubmit(e, id);
            }
        } catch (error) {
            App.showToast('Failed to load criminal details', 'error');
        }
    },

    // Get criminal form HTML
    getCriminalForm(criminal = null, crimes = []) {
        const linkedCrimeIds = criminal?.crimeHistory?.map(c => c.id) || [];

        return `
            <form id="criminalForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="first_name">First Name *</label>
                        <input type="text" id="first_name" name="first_name" required 
                               value="${criminal?.first_name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="last_name">Last Name *</label>
                        <input type="text" id="last_name" name="last_name" required 
                               value="${criminal?.last_name || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="alias">Alias</label>
                        <input type="text" id="alias" name="alias" value="${criminal?.alias || ''}">
                    </div>
                    <div class="form-group">
                        <label for="status">Status *</label>
                        <select id="status" name="status" required>
                            <option value="wanted" ${criminal?.status === 'wanted' ? 'selected' : ''}>Wanted</option>
                            <option value="arrested" ${criminal?.status === 'arrested' ? 'selected' : ''}>Arrested</option>
                            <option value="released" ${criminal?.status === 'released' ? 'selected' : ''}>Released</option>
                            <option value="deceased" ${criminal?.status === 'deceased' ? 'selected' : ''}>Deceased</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="date_of_birth">Date of Birth</label>
                        <input type="date" id="date_of_birth" name="date_of_birth" 
                               value="${criminal?.date_of_birth ? criminal.date_of_birth.split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender</label>
                        <select id="gender" name="gender">
                            <option value="">Select</option>
                            <option value="male" ${criminal?.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${criminal?.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${criminal?.gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
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

                <div class="form-row">
                    <div class="form-group">
                        <label for="nationality">Nationality</label>
                        <input type="text" id="nationality" name="nationality" value="${criminal?.nationality || ''}">
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="text" id="phone" name="phone" value="${criminal?.phone || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address" rows="2">${criminal?.address || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="height_cm">Height (cm)</label>
                        <input type="number" id="height_cm" name="height_cm" value="${criminal?.height_cm || ''}">
                    </div>
                    <div class="form-group">
                        <label for="weight_kg">Weight (kg)</label>
                        <input type="number" id="weight_kg" name="weight_kg" value="${criminal?.weight_kg || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="eye_color">Eye Color</label>
                        <input type="text" id="eye_color" name="eye_color" value="${criminal?.eye_color || ''}">
                    </div>
                    <div class="form-group">
                        <label for="hair_color">Hair Color</label>
                        <input type="text" id="hair_color" name="hair_color" value="${criminal?.hair_color || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="identification_mark">Identification Marks</label>
                    <textarea id="identification_mark" name="identification_mark" rows="2" 
                               placeholder="Scars, tattoos, or other distinguishing features">${criminal?.identification_mark || ''}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${criminal ? 'Update' : 'Create'} Criminal
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
                response = await API.criminals.update(id, data);
            } else {
                response = await API.criminals.create(data);
            }

            if (response.success) {
                App.closeModal();
                App.showToast(response.message, 'success');
                
                // If new criminal created, offer to upload photo
                if (!id && response.criminalId) {
                    this.showPhotoUpload(response.criminalId);
                } else {
                    this.load(this.currentPage);
                }
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to save criminal', 'error');
        }
    },

    // Show photo upload modal
    showPhotoUpload(criminalId) {
        const html = `
            <form id="photoUploadForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Upload Criminal Photo</label>
                    <input type="file" id="photo" name="photo" accept="image/*" required>
                    <small>Accepted formats: JPEG, PNG, GIF (max 5MB)</small>
                </div>
                <div id="photoPreview" style="text-align: center; margin: 20px 0;"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Criminals.load();">Skip</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload"></i> Upload Photo
                    </button>
                </div>
            </form>
        `;
        App.showModal('Upload Photo', html);

        // Preview image
        document.getElementById('photo').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('photoPreview').innerHTML = 
                        `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 10px;">`;
                };
                reader.readAsDataURL(file);
            }
        };

        document.getElementById('photoUploadForm').onsubmit = (e) => this.handlePhotoUpload(e, criminalId);
    },

    // Handle photo upload
    async handlePhotoUpload(e, criminalId) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const response = await API.criminals.uploadPhoto(criminalId, formData);
            if (response.success) {
                App.closeModal();
                App.showToast('Photo uploaded successfully', 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to upload photo', 'error');
        }
    },

    // View criminal details
    async viewCriminal(id) {
        try {
            const response = await API.criminals.getOne(id);
            if (response.success) {
                const criminal = response.criminal;
                const html = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        ${criminal.photo_path 
                            ? `<img src="${criminal.photo_path}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 10px;">`
                            : '<i class="fas fa-user-secret" style="font-size: 100px; color: #ddd;"></i>'
                        }
                        <div style="margin-top: 10px;">
                            <button class="btn btn-sm btn-secondary" onclick="Criminals.showPhotoUpload(${criminal.id})">
                                <i class="fas fa-camera"></i> ${criminal.photo_path ? 'Change' : 'Add'} Photo
                            </button>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Personal Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Full Name</label>
                                <span>${criminal.first_name} ${criminal.last_name}</span>
                            </div>
                            <div class="detail-item">
                                <label>Alias</label>
                                <span>${criminal.alias || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Status</label>
                                <span>${App.getStatusBadge(criminal.status)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Date of Birth</label>
                                <span>${App.formatDate(criminal.date_of_birth)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Gender</label>
                                <span>${criminal.gender || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Nationality</label>
                                <span>${criminal.nationality || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Physical Description</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Height</label>
                                <span>${criminal.height_cm ? criminal.height_cm + ' cm' : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Weight</label>
                                <span>${criminal.weight_kg ? criminal.weight_kg + ' kg' : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Eye Color</label>
                                <span>${criminal.eye_color || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Hair Color</label>
                                <span>${criminal.hair_color || '-'}</span>
                            </div>
                        </div>
                        <div class="detail-item" style="margin-top: 15px;">
                            <label>Identification Marks</label>
                            <span>${criminal.identification_mark || 'None recorded'}</span>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4>Contact & Location</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Phone</label>
                                <span>${criminal.phone || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Email</label>
                                <span>${criminal.email || '-'}</span>
                            </div>
                        </div>
                        <div class="detail-item" style="margin-top: 15px;">
                            <label>Address</label>
                            <span>${criminal.address || 'Unknown'}</span>
                        </div>
                    </div>

                    ${criminal.associatedVictims && criminal.associatedVictims.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-user-injured" style="color:#f39c12;"></i> Associated Victims (${criminal.associatedVictims.length})</h4>
                            <p style="font-size:0.85em;color:#777;margin-bottom:10px;">Victims linked to the same cases as this criminal.</p>
                            <table class="table" style="font-size:0.88em;">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Occupation</th>
                                        <th>Case #</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${criminal.associatedVictims.map(victim => `
                                        <tr style="cursor:pointer;" onclick="Victims.viewVictim(${victim.id})">
                                            <td><strong>${victim.first_name} ${victim.last_name}</strong></td>
                                            <td>${victim.phone || '-'}</td>
                                            <td>${victim.occupation || '-'}</td>
                                            <td><span style="color:#3498db;">${victim.crime_number}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}

                    ${criminal.crimeHistory && criminal.crimeHistory.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-gavel" style="color:#e74c3c;"></i> Crime History (${criminal.crimeHistory.length})</h4>
                            <table class="table" style="margin-top:10px;font-size:0.88em;">
                                <thead>
                                    <tr>
                                        <th>Case #</th>
                                        <th>Crime Type</th>
                                        <th>Date</th>
                                        <th>Role</th>
                                        <th>FIR #</th>
                                        <th>FIR Status</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${criminal.crimeHistory.map(crime => `
                                        <tr style="cursor:pointer;" onclick="Crimes.viewCrime(${crime.id})">
                                            <td><strong>${crime.crime_number}</strong></td>
                                            <td>${crime.crime_type.replace(/_/g, ' ')}</td>
                                            <td>${App.formatDate(crime.date_occurred)}</td>
                                            <td><span class="badge" style="background:rgba(255,165,0,0.15);color:#f39c12;border:1px solid #f39c12;">${crime.criminal_role}</span></td>
                                            <td>${crime.fir_number ? `<strong style="color:#3498db;">${crime.fir_number}</strong>` : '<em style="color:#aaa;">No FIR</em>'}</td>
                                            <td>${crime.fir_status ? App.getStatusBadge(crime.fir_status) : '-'}</td>
                                            <td>${App.getStatusBadge(crime.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="detail-section">
                            <h4>Crime History</h4>
                            <p class="empty-state">No crime records linked</p>
                        </div>
                    `}
                `;
                App.showModal(`Criminal Profile - ${criminal.first_name} ${criminal.last_name}`, html);
            }
        } catch (error) {
            App.showToast('Failed to load criminal details', 'error');
        }
    },

    // Delete criminal
    async deleteCriminal(id) {
        if (!App.confirm('Are you sure you want to delete this criminal record?')) {
            return;
        }

        try {
            const response = await API.criminals.delete(id);
            if (response.success) {
                App.showToast('Criminal deleted successfully', 'success');
                this.load(this.currentPage);
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to delete criminal', 'error');
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
