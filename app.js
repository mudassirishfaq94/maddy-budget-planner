// app.js - Main Application Logic

const App = {
    currentUser: null,

    init() {
        this.checkAuth();
        this.attachAuthListeners();
    },

    checkAuth() {
        const user = Storage.getCurrentUser();

        if (user) {
            this.currentUser = user;
            this.showDashboard();
        } else {
            this.showAuth();
        }
    },

    attachAuthListeners() {
        // Toggle between login and signup
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        });

        // Login form submission
        document.getElementById('login-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Signup form submission
        document.getElementById('signup-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Password strength indicator
        document.getElementById('signup-password').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateToSection(section);
                // Close sidebar on mobile after navigation
                this.closeMobileSidebar();
            });
        });

        // Hamburger menu toggle
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }
    },

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        sidebar.classList.toggle('open');
        hamburgerBtn.classList.toggle('active');
    },

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const hamburgerBtn = document.getElementById('hamburger-btn');
        sidebar.classList.remove('open');
        hamburgerBtn.classList.remove('active');
    },

    handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');

        if (!email || !password) {
            this.showError(errorDiv, 'Please fill in all fields');
            return;
        }

        const user = Storage.findUserByEmail(email);

        if (!user) {
            this.showError(errorDiv, 'User not found. Please sign up.');
            return;
        }

        const hashedPassword = Storage.hashPassword(password);

        if (user.password !== hashedPassword) {
            this.showError(errorDiv, 'Incorrect password');
            return;
        }

        // Login successful
        this.currentUser = user;
        Storage.setCurrentUser(user);
        this.showDashboard();
    },

    handleSignup() {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const errorDiv = document.getElementById('signup-error');

        if (!name || !email || !password) {
            this.showError(errorDiv, 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showError(errorDiv, 'Password must be at least 6 characters');
            return;
        }

        // Check if user already exists
        const existingUser = Storage.findUserByEmail(email);

        if (existingUser) {
            this.showError(errorDiv, 'User already exists. Please login.');
            return;
        }

        // Create new user
        const user = {
            id: Storage.generateId(),
            name: name,
            email: email,
            password: Storage.hashPassword(password),
            createdAt: Date.now()
        };

        Storage.saveUser(user);
        this.currentUser = user;
        Storage.setCurrentUser(user);
        this.showDashboard();
    },

    handleLogout() {
        console.log('Logout button clicked');
        // Use setTimeout to ensure dialog shows properly
        setTimeout(() => {
            if (confirm('Are you sure you want to logout?')) {
                console.log('User confirmed logout');
                Storage.clearCurrentUser();
                this.currentUser = null;
                console.log('Session cleared, showing auth screen');
                this.showAuth();

                // Show success message
                if (window.UIEnhancements) {
                    UIEnhancements.showToast('Logged Out', 'You have been logged out successfully', 'info');
                }
            } else {
                console.log('User cancelled logout');
            }
        }, 100);
    },

    showError(errorDiv, message) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');

        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    },

    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('password-strength-bar');

        if (password.length === 0) {
            strengthBar.className = 'strength-bar';
            return;
        }

        let strength = 0;

        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        if (strength <= 2) {
            strengthBar.className = 'strength-bar weak';
        } else if (strength <= 4) {
            strengthBar.className = 'strength-bar medium';
        } else {
            strengthBar.className = 'strength-bar strong';
        }
    },

    showAuth() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');

        // Reset forms
        document.getElementById('login-form-element').reset();
        document.getElementById('signup-form-element').reset();
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    },

    showDashboard() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');

        // Update user info
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-email').textContent = this.currentUser.email;
        const avatarText = this.currentUser.name.charAt(0).toUpperCase();
        document.getElementById('user-avatar-text').textContent = avatarText;

        // Update mobile avatar
        const mobileAvatar = document.getElementById('mobile-user-avatar');
        if (mobileAvatar) {
            mobileAvatar.textContent = avatarText;
        }

        // Initialize modules
        Categories.init(this.currentUser);
        Transactions.init(this.currentUser);

        // Show overview section by default
        this.navigateToSection('overview');
    },

    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.add('hidden');
        });

        document.getElementById(`${section}-section`).classList.remove('hidden');

        // Refresh data if needed
        if (section === 'overview' || section === 'transactions') {
            Transactions.renderTransactions();
            Transactions.updateSummary();
        } else if (section === 'categories') {
            Categories.renderCategories();
        } else if (section === 'settings') {
            // Initialize Settings module
            console.log('Navigating to settings, Settings module exists:', !!window.Settings);
            if (window.Settings) {
                console.log('Calling Settings.init with user:', this.currentUser);
                Settings.init(this.currentUser);
            } else {
                console.error('Settings module not found!');
            }
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
