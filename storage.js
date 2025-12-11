// storage.js - Local Storage Management

const Storage = {
    // Keys
    USERS_KEY: 'budgetapp_users',
    CURRENT_USER_KEY: 'budgetapp_current_user',
    TRANSACTIONS_KEY: 'budgetapp_transactions',
    CATEGORIES_KEY: 'budgetapp_categories',

    // User Management
    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    },

    setCurrentUser(user) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    },

    getCurrentUser() {
        const user = localStorage.getItem(this.CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    clearCurrentUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    },

    // Transaction Management
    saveTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.push(transaction);
        localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
    },

    getTransactions(userId = null) {
        const transactions = localStorage.getItem(this.TRANSACTIONS_KEY);
        const allTransactions = transactions ? JSON.parse(transactions) : [];
        
        if (userId) {
            return allTransactions.filter(t => t.userId === userId);
        }
        return allTransactions;
    },

    updateTransaction(transactionId, updatedData) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === transactionId);
        
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedData, updatedAt: Date.now() };
            localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
            return true;
        }
        return false;
    },

    deleteTransaction(transactionId) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== transactionId);
        localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(filtered));
    },

    // Category Management
    saveCategory(category) {
        const categories = this.getCategories();
        categories.push(category);
        localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
    },

    getCategories(userId = null, type = null) {
        const categories = localStorage.getItem(this.CATEGORIES_KEY);
        let allCategories = categories ? JSON.parse(categories) : [];
        
        if (userId) {
            allCategories = allCategories.filter(c => c.userId === userId || !c.isCustom);
        }
        
        if (type) {
            allCategories = allCategories.filter(c => c.type === type);
        }
        
        return allCategories;
    },

    deleteCategory(categoryId) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== categoryId);
        localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(filtered));
    },

    // Utility
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Simple password hashing (for demo purposes - use proper hashing in production)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
};

// Initialize default categories if none exist
if (!localStorage.getItem(Storage.CATEGORIES_KEY)) {
    const defaultCategories = [
        // Income categories
        { id: 'income_salary', type: 'income', name: 'Salary', icon: '💼', isCustom: false },
        { id: 'income_freelance', type: 'income', name: 'Freelance', icon: '💻', isCustom: false },
        { id: 'income_investment', type: 'income', name: 'Investment', icon: '📈', isCustom: false },
        { id: 'income_business', type: 'income', name: 'Business', icon: '🏢', isCustom: false },
        { id: 'income_gift', type: 'income', name: 'Gift', icon: '🎁', isCustom: false },
        { id: 'income_other', type: 'income', name: 'Other', icon: '💰', isCustom: false },
        
        // Expense categories
        { id: 'expense_food', type: 'expense', name: 'Food & Dining', icon: '🍔', isCustom: false },
        { id: 'expense_transport', type: 'expense', name: 'Transport', icon: '🚗', isCustom: false },
        { id: 'expense_housing', type: 'expense', name: 'Housing', icon: '🏠', isCustom: false },
        { id: 'expense_entertainment', type: 'expense', name: 'Entertainment', icon: '🎬', isCustom: false },
        { id: 'expense_healthcare', type: 'expense', name: 'Healthcare', icon: '⚕️', isCustom: false },
        { id: 'expense_shopping', type: 'expense', name: 'Shopping', icon: '🛍️', isCustom: false },
        { id: 'expense_bills', type: 'expense', name: 'Bills & Utilities', icon: '📄', isCustom: false },
        { id: 'expense_education', type: 'expense', name: 'Education', icon: '📚', isCustom: false },
        { id: 'expense_other', type: 'expense', name: 'Other', icon: '💸', isCustom: false }
    ];
    
    localStorage.setItem(Storage.CATEGORIES_KEY, JSON.stringify(defaultCategories));
}
