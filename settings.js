// settings.js - Profile and Account Settings

const Settings = {
    currentUser: null,

    init(user) {
        console.log('Settings.init called with user:', user);
        this.currentUser = user;
        this.loadUserData();
        this.attachEventListeners();
        console.log('Settings initialized successfully');
    },

    loadUserData() {
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');

        if (nameInput) nameInput.value = this.currentUser.name;
        if (emailInput) emailInput.value = this.currentUser.email;
    },

    attachEventListeners() {
        console.log('Attaching event listeners...');

        // Profile form
        const profileForm = document.getElementById('profile-form');
        console.log('Profile form found:', !!profileForm);
        if (profileForm) {
            // Remove old listener by replacing with clone
            const newForm = profileForm.cloneNode(true);
            profileForm.parentNode.replaceChild(newForm, profileForm);

            newForm.addEventListener('submit', (e) => {
                console.log('Profile form submitted');
                e.preventDefault();
                this.updateProfile();
            });
            console.log('Profile form listener attached');
        }

        // Password form
        const passwordForm = document.getElementById('password-form');
        console.log('Password form found:', !!passwordForm);
        if (passwordForm) {
            const newPasswordForm = passwordForm.cloneNode(true);
            passwordForm.parentNode.replaceChild(newPasswordForm, passwordForm);

            newPasswordForm.addEventListener('submit', (e) => {
                console.log('Password form submitted');
                e.preventDefault();
                this.changePassword();
            });

            // Password strength
            const newPassword = newPasswordForm.querySelector('#new-password');
            if (newPassword) {
                newPassword.addEventListener('input', (e) => {
                    this.updatePasswordStrength(e.target.value, 'new-password-strength-bar');
                });
            }
            console.log('Password form listener attached');
        }

        // Delete account button
        const deleteBtn = document.getElementById('delete-account-btn');
        console.log('Delete button found:', !!deleteBtn);
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

            newDeleteBtn.addEventListener('click', () => {
                console.log('Delete button clicked!');
                this.deleteAccount();
            });
            console.log('Delete button listener attached');
        }

        console.log('All event listeners attached');
    },

    updateProfile() {
        console.log('updateProfile called');
        const newName = document.getElementById('profile-name').value.trim();

        if (!newName) {
            if (window.UIEnhancements) {
                UIEnhancements.showToast('Error', 'Name cannot be empty', 'error');
            }
            return;
        }

        console.log('Updating name from', this.currentUser.name, 'to', newName);

        // Update in storage
        this.currentUser.name = newName;
        const users = Storage.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].name = newName;
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Updated users in localStorage');
        }

        // CRITICAL: Update currentUser in session storage
        Storage.setCurrentUser(this.currentUser);
        console.log('Updated currentUser in session storage');

        // Update UI
        const userName = document.getElementById('user-name');
        if (userName) userName.textContent = newName;

        const avatarText = newName.charAt(0).toUpperCase();
        const userAvatar = document.getElementById('user-avatar-text');
        if (userAvatar) userAvatar.textContent = avatarText;

        const mobileAvatar = document.getElementById('mobile-user-avatar');
        if (mobileAvatar) mobileAvatar.textContent = avatarText;

        console.log('UI updated successfully');

        if (window.UIEnhancements) {
            UIEnhancements.showToast('Success', 'Profile updated successfully', 'success');
        }
    },

    changePassword() {
        console.log('changePassword called');
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('password-error');

        // Clear previous errors
        errorDiv.textContent = '';

        console.log('Validating password...');

        // Validate current password
        const users = Storage.getUsers();
        const user = users.find(u => u.id === this.currentUser.id);

        const hashedCurrentPassword = Storage.hashPassword(currentPassword);
        if (!user || user.password !== hashedCurrentPassword) {
            console.log('Current password incorrect');
            errorDiv.textContent = 'Current password is incorrect';
            return;
        }

        // Validate new password
        if (newPassword.length < 6) {
            console.log('New password too short');
            errorDiv.textContent = 'New password must be at least 6 characters';
            return;
        }

        if (newPassword !== confirmPassword) {
            console.log('Passwords do not match');
            errorDiv.textContent = 'Passwords do not match';
            return;
        }

        console.log('Password validation passed, updating...');

        try {
            // Update password
            const hashedNewPassword = Storage.hashPassword(newPassword);
            user.password = hashedNewPassword;
            this.currentUser.password = hashedNewPassword;
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Password updated in localStorage');

            // CRITICAL: Update currentUser in session storage
            Storage.setCurrentUser(this.currentUser);
            console.log('Updated currentUser in session storage');

            // Clear form
            document.getElementById('password-form').reset();

            console.log('Password changed successfully');

            if (window.UIEnhancements) {
                UIEnhancements.showToast('Success', 'Password changed successfully', 'success');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            errorDiv.textContent = 'An error occurred while updating the password.';
        }
    },

    updatePasswordStrength(password, barId) {
        const strengthBar = document.getElementById(barId);
        if (!strengthBar) return;

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const percentage = (strength / 5) * 100;
        strengthBar.style.width = percentage + '%';

        if (strength <= 2) {
            strengthBar.style.background = 'var(--danger)';
        } else if (strength <= 3) {
            strengthBar.style.background = 'var(--warning)';
        } else {
            strengthBar.style.background = 'var(--success)';
        }
    },

    deleteAccount() {
        // First confirmation
        const confirmed = confirm(
            '⚠️ DELETE ACCOUNT WARNING ⚠️\n\n' +
            'This will PERMANENTLY delete:\n' +
            '✗ All your transactions\n' +
            '✗ All your custom categories\n' +
            '✗ Your profile information\n\n' +
            'This action CANNOT be undone!\n\n' +
            'Click OK to continue, or Cancel to go back.'
        );

        if (!confirmed) {
            console.log('Account deletion cancelled by user');
            return;
        }

        // Second confirmation - type DELETE
        const typedConfirmation = prompt(
            'To confirm deletion, type DELETE in CAPITAL letters:'
        );

        if (typedConfirmation !== 'DELETE') {
            alert('Account deletion cancelled. You did not type DELETE correctly.');
            if (window.UIEnhancements) {
                UIEnhancements.showToast('Cancelled', 'Account deletion cancelled', 'info');
            }
            return;
        }

        console.log('Deleting account for user:', this.currentUser.id);

        // Delete all user data
        const userId = this.currentUser.id;

        try {
            // Delete transactions
            const transactions = Storage.getTransactions();
            const remainingTransactions = transactions.filter(t => t.userId !== userId);
            localStorage.setItem('transactions', JSON.stringify(remainingTransactions));
            console.log('Deleted transactions');

            // Delete custom categories
            const categories = Storage.getCategories();
            const remainingCategories = categories.filter(c => !c.userId || c.userId !== userId);
            localStorage.setItem('categories', JSON.stringify(remainingCategories));
            console.log('Deleted categories');

            // Delete user
            const users = Storage.getUsers();
            const remainingUsers = users.filter(u => u.id !== userId);
            localStorage.setItem('users', JSON.stringify(remainingUsers));
            console.log('Deleted user');

            // Clear session
            Storage.clearCurrentUser();
            console.log('Cleared session');

            // Show success message
            alert('✓ Account deleted successfully!\n\nYou will now be redirected to the login page.');

            if (window.UIEnhancements) {
                UIEnhancements.showToast('Account Deleted', 'Your account has been permanently deleted', 'success');
            }

            // Redirect to login after short delay
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account: ' + error.message);
        }
    }
};

// Export for use in other files
window.Settings = Settings;
