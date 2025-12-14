// app.js - Main Application Logic

const App = {
    currentUser: null,

    init() {
        this.checkAuth();
        this.attachAuthListeners();
    },

    checkAuth() {
        // Use Firebase Auth listener
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                // Fetch additional user profile data from Firestore
                try {
                    const userProfile = await FirebaseDB.getUserProfile(user.uid);
                    if (userProfile) {
                        this.currentUser = { ...user, ...userProfile };
                    }
                } catch (e) {
                    console.error("Error fetching user profile", e);
                }
                this.showDashboard();
            } else {
                this.currentUser = null;
                this.showAuth();
            }
        });
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

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');

        if (!email || !password) {
            this.showError(errorDiv, 'Please fill in all fields');
            return;
        }

        try {
            if (window.UIEnhancements) UIEnhancements.showLoading('Signing in...');
            await firebase.auth().signInWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error('Login error:', error);
            let message = 'Failed to login. Please check your credentials.';
            if (error.code === 'auth/user-not-found') message = 'User not found. Please sign up.';
            if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
            this.showError(errorDiv, message);
        } finally {
            if (window.UIEnhancements) UIEnhancements.hideLoading();
        }
    },

    async handleSignup() {
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

        try {
            if (window.UIEnhancements) UIEnhancements.showLoading('Creating account...');

            // Create user in Firebase Auth
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save additional profile info to Firestore
            await FirebaseDB.saveUserProfile(user.uid, {
                name: name,
                email: email
            });

            // Trigger onboarding
            if (window.UIEnhancements) {
                UIEnhancements.triggerOnboarding();
            }

            // onAuthStateChanged will handle the redirect
        } catch (error) {
            console.error('Signup error:', error);
            let message = 'Failed to create account.';
            if (error.code === 'auth/email-already-in-use') message = 'Email already in use. Please login.';
            if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
            this.showError(errorDiv, message);
        } finally {
            if (window.UIEnhancements) UIEnhancements.hideLoading();
        }
    },

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await firebase.auth().signOut();
                if (window.UIEnhancements) {
                    UIEnhancements.showToast('Logged Out', 'You have been logged out successfully', 'info');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error logging out');
            }
        }
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
        // Note: currentUser might be Firebase User object or merged object
        const name = this.currentUser.displayName || this.currentUser.name || this.currentUser.email.split('@')[0];
        const email = this.currentUser.email;

        document.getElementById('user-name').textContent = name;
        document.getElementById('user-email').textContent = email;
        const avatarText = name.charAt(0).toUpperCase();
        document.getElementById('user-avatar-text').textContent = avatarText;

        // Update mobile avatar
        const mobileAvatar = document.getElementById('mobile-user-avatar');
        if (mobileAvatar) {
            mobileAvatar.textContent = avatarText;
        }

        // Initialize modules with Firebase User ID
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
            if (window.Settings) {
                Settings.init(this.currentUser);
            }
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
