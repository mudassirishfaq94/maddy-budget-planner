// ui-enhancements.js - UI/UX Enhancement Utilities

const UIEnhancements = {
    toastCount: 0,
    sessionTimeout: null,
    inactivityTimeout: 15 * 60 * 1000, // 15 minutes

    init() {
        this.setupKeyboardShortcuts();
        this.setupSessionTimeout();
        this.showShortcutsHint();
        this.attachOnboardingListeners();
    },

    attachOnboardingListeners() {
        const startBtn = document.getElementById('start-tour-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.hideOnboarding();
                localStorage.setItem('hasSeenOnboarding', 'true');
                this.showToast('Welcome!', 'You\'re all set! Start by adding your first transaction.', 'success');
            });
        }
    },

    triggerOnboarding() {
        this.showOnboarding();
    },

    // Old method for backward compatibility if needed, but empty now to prevent auto-show
    setupOnboarding() {
        // Disabled auto-show
    },

    showOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    hideOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Session Timeout
    setupSessionTimeout() {
        this.resetSessionTimeout();

        // Reset timeout on user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.resetSessionTimeout();
            });
        });
    },

    resetSessionTimeout() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }

        this.sessionTimeout = setTimeout(() => {
            this.showTimeoutWarning();
        }, this.inactivityTimeout);
    },

    showTimeoutWarning() {
        const warning = document.createElement('div');
        warning.className = 'timeout-warning';
        warning.innerHTML = `
            <span>⏰ You've been inactive for a while. You'll be logged out soon.</span>
            <button onclick="UIEnhancements.dismissTimeoutWarning()">Stay Logged In</button>
        `;
        warning.id = 'timeout-warning';
        document.body.appendChild(warning);

        // Auto-logout after 2 minutes if no response
        setTimeout(() => {
            const warningEl = document.getElementById('timeout-warning');
            if (warningEl) {
                // Trigger logout
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.click();
                }
            }
        }, 2 * 60 * 1000);
    },

    dismissTimeoutWarning() {
        const warning = document.getElementById('timeout-warning');
        if (warning) {
            warning.remove();
        }
        this.resetSessionTimeout();
        this.showToast('Session Extended', 'Your session has been extended', 'success');
    },

    // Improved Empty States
    createEmptyState(icon, title, message, buttonText = null, buttonAction = null) {
        let buttonHtml = '';
        if (buttonText && buttonAction) {
            buttonHtml = `<button class="btn btn-primary" onclick="${buttonAction}">${buttonText}</button>`;
        }

        return `
            <div class="empty-state empty-state-large">
                <div class="empty-icon">${icon}</div>
                <h3>${title}</h3>
                <p>${message}</p>
                ${buttonHtml}
            </div>
        `;
    },

    // Skeleton Loaders
    showSkeletonCards(container, count = 3) {
        const skeletons = Array(count).fill(0).map(() =>
            '<div class="skeleton skeleton-card"></div>'
        ).join('');
        container.innerHTML = skeletons;
    },

    showSkeletonTransactions(container, count = 5) {
        const skeletons = Array(count).fill(0).map(() =>
            '<div class="skeleton skeleton-transaction"></div>'
        ).join('');
        container.innerHTML = skeletons;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UIEnhancements.init();
});

// Export for use in other files
window.UIEnhancements = UIEnhancements;
