/**
 * Users Module
 * Handles user management (Admin only)
 */

const Users = {
    // Load users
    async load() {
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div></td></tr>';

        try {
            const response = await API.auth.getUsers();

            if (response.success) {
                this.renderTable(response.users);
            }
        } catch (error) {
            console.error('Load users error:', error);
            App.showToast('Failed to load users', 'error');
        }

        // Bind events
        document.getElementById('addUserBtn').onclick = () => this.showAddForm();
    },

    // Render table
    renderTable(users) {
        const tbody = document.getElementById('usersTable');

        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>No users found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        users.forEach(user => {
            const isCurrentUser = user.id === App.user.id;
            html += `
                <tr>
                    <td><strong>${user.username}</strong></td>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>
                        <span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}">
                            ${user.role.replace('_', ' ')}
                        </span>
                    </td>
                    <td>${user.department || '-'}</td>
                    <td>
                        <span class="badge ${user.is_active ? 'badge-success' : 'badge-secondary'}">
                            ${user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        ${!isCurrentUser ? `
                            <button class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'} btn-icon" 
                                    onclick="Users.toggleStatus(${user.id}, ${!user.is_active})" 
                                    title="${user.is_active ? 'Deactivate' : 'Activate'}">
                                <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                            </button>
                        ` : `
                            <span class="badge badge-info">You</span>
                        `}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    // Show add user form
    showAddForm() {
        const html = `
            <form id="userForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="username">Username *</label>
                        <input type="text" id="username" name="username" required minlength="3" maxlength="50">
                    </div>
                    <div class="form-group">
                        <label for="password">Password *</label>
                        <input type="password" id="password" name="password" required minlength="6">
                    </div>
                </div>
                <div class="form-group">
                    <label for="full_name">Full Name *</label>
                    <input type="text" id="full_name" name="full_name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="role">Role *</label>
                        <select id="role" name="role" required>
                            <option value="police_officer">Police Officer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="badge_number">Badge Number</label>
                        <input type="text" id="badge_number" name="badge_number">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="department">Department</label>
                        <input type="text" id="department" name="department">
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="text" id="phone" name="phone">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i> Create User
                    </button>
                </div>
            </form>
        `;

        App.showModal('Add New User', html);
        document.getElementById('userForm').onsubmit = (e) => this.handleSubmit(e);
    },

    // Handle form submit
    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await API.auth.register(data);
            if (response.success) {
                App.closeModal();
                App.showToast('User created successfully', 'success');
                this.load();
            }
        } catch (error) {
            App.showToast(error.message || 'Failed to create user', 'error');
        }
    },

    // Toggle user status
    async toggleStatus(userId, newStatus) {
        const action = newStatus ? 'activate' : 'deactivate';
        if (!App.confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        try {
            const response = await API.auth.updateUserStatus(userId, newStatus);
            if (response.success) {
                App.showToast(response.message, 'success');
                this.load();
            }
        } catch (error) {
            App.showToast(error.message || `Failed to ${action} user`, 'error');
        }
    }
};
