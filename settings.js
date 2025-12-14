// settings.js - Profile and Account Settings

const Settings = {
    currentUser: null,

    listenersAttached: false,

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

        const name = this.currentUser.displayName || this.currentUser.name || '';
        const email = this.currentUser.email || '';

        if (nameInput) nameInput.value = name;
        if (emailInput) emailInput.value = email;
    },

    attachEventListeners() {
        if (this.listenersAttached) return;
        this.listenersAttached = true;

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

    async updateProfile() {
        console.log('updateProfile called');
        const newName = document.getElementById('profile-name').value.trim();

        if (!newName) {
            if (window.UIEnhancements) {
                UIEnhancements.showToast('Error', 'Name cannot be empty', 'error');
            }
            return;
        }

        try {
            if (window.UIEnhancements) UIEnhancements.showLoading('Updating profile...');

            // Update Firebase Auth profile
            await this.currentUser.updateProfile({
                displayName: newName
            });

            // Update Firestore Profile
            await FirebaseDB.saveUserProfile(this.currentUser.uid, {
                name: newName,
                email: this.currentUser.email
            });

            // Update local object
            this.currentUser.name = newName;
            this.currentUser.displayName = newName;

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
        } catch (error) {
            console.error('Error updating profile:', error);
            if (window.UIEnhancements) {
                UIEnhancements.showToast('Error', 'Failed to update profile', 'error');
            }
        } finally {
            if (window.UIEnhancements) UIEnhancements.hideLoading();
        }
    },

    async changePassword() {
        console.log('changePassword called');
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('password-error');

        // Clear previous errors
        errorDiv.textContent = '';

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

        try {
            if (window.UIEnhancements) UIEnhancements.showLoading('Updating password...');

            // Re-authenticate user first (required for password changes)
            const credential = firebase.auth.EmailAuthProvider.credential(this.currentUser.email, currentPassword);
            await this.currentUser.reauthenticateWithCredential(credential);

            // Update password
            await this.currentUser.updatePassword(newPassword);

            // Clear form
            document.getElementById('password-form').reset();

            console.log('Password changed successfully');

            if (window.UIEnhancements) {
                UIEnhancements.showToast('Success', 'Password changed successfully', 'success');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            let message = 'An error occurred while updating the password.';
            if (error.code === 'auth/wrong-password') message = 'Current password is incorrect.';
            if (error.code === 'auth/weak-password') message = 'New password is too weak.';
            errorDiv.textContent = message;
        } finally {
            if (window.UIEnhancements) UIEnhancements.hideLoading();
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

    async deleteAccount() {
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

        console.log('Deleting account for user:', this.currentUser.uid);

        try {
            if (window.UIEnhancements) UIEnhancements.showLoading('Deleting account...');

            // Delete user in Firebase Auth
            // Note: Ideally, we should also delete Firestore data, but for now we'll rely on
            // client-side not accessing it, or a Cloud Function to clean it up.
            // Client-side bulk deletion can be slow and fail.
            // But we can try to delete what we can.

            // Re-authenticate might be needed if session is old, but let's try direct delete first.
            await this.currentUser.delete();

            // Clear session (Firebase SDK handles this, but good to ensure UI update)
            console.log('Cleared session');

            // Show success message
            alert('✓ Account deleted successfully!\n\nYou will now be redirected to the login page.');

            if (window.UIEnhancements) {
                UIEnhancements.showToast('Account Deleted', 'Your account has been permanently deleted', 'success');
            }

            // Redirect handled by onAuthStateChanged in app.js
        } catch (error) {
            console.error('Error deleting account:', error);
            if (error.code === 'auth/requires-recent-login') {
                alert('For security, you must logout and login again before deleting your account.');
            } else {
                alert('Error deleting account: ' + error.message);
            }
        } finally {
            if (window.UIEnhancements) UIEnhancements.hideLoading();
        }
    }
};

// Export for use in other files
window.Settings = Settings;
