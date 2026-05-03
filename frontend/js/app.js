/**
 * Main Application Module
 * Handles authentication, navigation, and global functionality
 */

const App = {
    currentPage: 'dashboard',
    user: null,

    // Initialize the application
    init() {
        this.checkAuth();
        this.bindEvents();
    },

    // Check if user is authenticated
    checkAuth() {
        const token = localStorage.getItem('crms_token');
        const user = API.getUser();

        if (token && user) {
            this.user = user;
            this.showMainApp();
        } else {
            this.showLoginPage();
        }
    },

    // Show login page
    showLoginPage() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    },

    // Show main application
    showMainApp() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';

        // Update UI with user info
        document.getElementById('userFullName').textContent = this.user.full_name;
        document.getElementById('userRole').textContent = this.user.role.replace('_', ' ').toUpperCase();
        document.getElementById('userRole').className = 'badge ' + 
            (this.user.role === 'admin' ? 'badge-danger' : 'badge-primary');

        // Show/hide admin-only elements
        if (this.user.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }

        // Load initial page
        this.navigateTo('dashboard');
    },

    // Bind event listeners
    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    },

    // Handle login
    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            errorDiv.textContent = '';
            const response = await API.auth.login({ username, password });

            if (response.success) {
                API.setToken(response.token);
                API.setUser(response.user);
                this.user = response.user;
                this.showMainApp();
                this.showToast('Login successful!', 'success');
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Login failed';
        }
    },

    // Handle logout
    handleLogout() {
        API.clearToken();
        this.user = null;
        this.showLoginPage();
        document.getElementById('loginForm').reset();
        this.showToast('Logged out successfully', 'success');
    },

    // Navigate to page
    navigateTo(page) {
        // Check admin access
        if (page === 'users' && this.user.role !== 'admin') {
            this.showToast('Access denied', 'error');
            return;
        }

        this.currentPage = page;

        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            crimes: 'Crime Records',
            criminals: 'Criminal Records',
            victims: 'Victim Records',
            fir: 'FIR Management',
            police: 'Police Officers',
            users: 'User Management'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        // Show selected page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}Page`).classList.add('active');

        // Load page data
        this.loadPageData(page);
    },

    // Load page data
    loadPageData(page) {
        switch (page) {
            case 'dashboard':
                Dashboard.load();
                break;
            case 'crimes':
                Crimes.load();
                break;
            case 'criminals':
                Criminals.load();
                break;
            case 'victims':
                Victims.load();
                break;
            case 'fir':
                FIR.load();
                break;
            case 'police':
                Police.load();
                break;
            case 'users':
                Users.load();
                break;
        }
    },

    // Show modal
    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modal').classList.add('active');
    },

    // Close modal
    closeModal() {
        document.getElementById('modal').classList.remove('active');
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Get status badge
    getStatusBadge(status) {
        const classes = {
            open: 'badge-primary',
            investigating: 'badge-warning',
            closed: 'badge-secondary',
            solved: 'badge-success',
            wanted: 'badge-danger',
            arrested: 'badge-warning',
            released: 'badge-success',
            deceased: 'badge-secondary',
            registered: 'badge-info',
            under_investigation: 'badge-warning',
            chargesheet_filed: 'badge-primary',
            active: 'badge-success',
            completed: 'badge-secondary',
            critical: 'badge-danger',
            high: 'badge-warning',
            medium: 'badge-info',
            low: 'badge-secondary'
        };
        const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `<span class="badge ${classes[status] || 'badge-secondary'}">${displayText}</span>`;
    },

    // Create pagination HTML
    createPagination(pagination, callback) {
        const { page, totalPages } = pagination;
        let html = '';

        // Previous button
        html += `<button ${page <= 1 ? 'disabled' : ''} onclick="${callback}(${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;

        // Page numbers
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, page + 2);

        if (start > 1) {
            html += `<button onclick="${callback}(1)">1</button>`;
            if (start > 2) html += `<button disabled>...</button>`;
        }

        for (let i = start; i <= end; i++) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="${callback}(${i})">${i}</button>`;
        }

        if (end < totalPages) {
            if (end < totalPages - 1) html += `<button disabled>...</button>`;
            html += `<button onclick="${callback}(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        html += `<button ${page >= totalPages ? 'disabled' : ''} onclick="${callback}(${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        return html;
    },

    // Show loading state
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="10" class="loading">
                        <div class="spinner"></div>
                    </td>
                </tr>
            `;
        }
    },

    // Show empty state
    showEmpty(containerId, message = 'No records found') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="10">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>${message}</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    // Confirm action
    confirm(message) {
        return window.confirm(message);
    },

    // Filter searchable checkboxes
    filterCheckboxes(input) {
        const searchText = input.value.toLowerCase();
        const container = input.closest('.searchable-checkbox-group');
        const items = container.querySelectorAll('.checkbox-item');
        
        items.forEach(item => {
            const label = item.textContent.toLowerCase();
            if (label.includes(searchText)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
