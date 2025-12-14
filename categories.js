// categories.js - Category Management

const Categories = {
    currentUser: null,

    listenersAttached: false,
    incomeCategories: [],
    expenseCategories: [],
    unsubscribes: [],

    init(user) {
        this.currentUser = user;
        this.attachEventListeners();

        // Clear previous listeners
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];

        // LOAD DEFAULTS IMMEDIATELY
        if (window.FirebaseDB && FirebaseDB.DEFAULT_CATEGORIES) {
            console.log('Loading defaults immediately');
            this.incomeCategories = FirebaseDB.DEFAULT_CATEGORIES.filter(c => c.type === 'income');
            this.expenseCategories = FirebaseDB.DEFAULT_CATEGORIES.filter(c => c.type === 'expense');
            this.renderCategories();
        }

        if (window.FirebaseDB) {
            // Listen to income categories
            const unsubIncome = FirebaseDB.listenToCategories(user.uid, 'income', (categories) => {
                console.log('Income categories loaded:', categories);
                this.incomeCategories = categories;
                this.renderCategories();
                // Update transaction modal if needed
                if (window.Transactions && Transactions.updateCategoryOptions) {
                    Transactions.updateCategoryOptions();
                }
            });
            this.unsubscribes.push(unsubIncome);

            // Listen to expense categories
            const unsubExpense = FirebaseDB.listenToCategories(user.uid, 'expense', (categories) => {
                console.log('Expense categories loaded:', categories);
                this.expenseCategories = categories;
                this.renderCategories();
                // Update transaction modal if needed
                if (window.Transactions && Transactions.updateCategoryOptions) {
                    Transactions.updateCategoryOptions();
                }
            });
            this.unsubscribes.push(unsubExpense);
        }
    },

    attachEventListeners() {
        if (this.listenersAttached) return;
        this.listenersAttached = true;

        // Add income category button
        document.getElementById('add-income-category-btn').addEventListener('click', () => {
            this.showAddCategoryModal('income');
        });

        // Add expense category button
        document.getElementById('add-expense-category-btn').addEventListener('click', () => {
            this.showAddCategoryModal('expense');
        });

        // Category form submission
        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCategory();
        });

        // Close category modal
        document.getElementById('close-category-modal').addEventListener('click', () => {
            this.hideAddCategoryModal();
        });

        document.getElementById('cancel-category').addEventListener('click', () => {
            this.hideAddCategoryModal();
        });

        // Close modal on overlay click
        document.querySelector('#category-modal .modal-overlay').addEventListener('click', () => {
            this.hideAddCategoryModal();
        });
    },

    showAddCategoryModal(type) {
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        document.getElementById('category-type').value = type;

        title.textContent = type === 'income' ? 'Add Custom Income Source' : 'Add Custom Expense Category';

        // Reset form
        document.getElementById('category-form').reset();

        modal.classList.add('show');
    },

    hideAddCategoryModal() {
        const modal = document.getElementById('category-modal');
        modal.classList.remove('show');
    },

    async handleAddCategory() {
        const type = document.getElementById('category-type').value;
        const name = document.getElementById('category-name').value.trim();
        const icon = document.getElementById('category-icon').value.trim();

        if (!name || !icon) {
            alert('Please fill in all fields');
            return;
        }

        try {
            if (window.UIEnhancements) UIEnhancements.showLoading('Adding category...');

            const category = {
                userId: this.currentUser.uid || this.currentUser.id,
                type: type,
                name: name,
                icon: icon,
                isCustom: true
            };

            await FirebaseDB.saveCategory(category);
            // Rendering handled by listener
            this.hideAddCategoryModal();

            if (window.UIEnhancements) {
                UIEnhancements.showToast('Success', 'Category added successfully', 'success');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Error adding category. Please try again.');
        } finally {
            if (window.UIEnhancements) UIEnhancements.hideLoading();
        }
    },

    renderCategories() {
        this.renderIncomeCategories();
        this.renderExpenseCategories();
    },

    renderIncomeCategories() {
        const container = document.getElementById('income-categories-list');
        const categories = this.incomeCategories; // Use local cache

        container.innerHTML = categories.map(category => `
            <div class="category-item">
                <div class="category-item-info">
                    <span class="category-item-icon">${category.icon}</span>
                    <span class="category-item-name">${category.name}</span>
                    ${category.isCustom ? '<span class="category-item-badge">Custom</span>' : ''}
                </div>
                ${category.isCustom ? `
                    <button class="action-btn" onclick="Categories.deleteCategory('${category.id}')">Delete</button>
                ` : ''}
            </div>
        `).join('');
    },

    renderExpenseCategories() {
        const container = document.getElementById('expense-categories-list');
        const categories = this.expenseCategories; // Use local cache

        container.innerHTML = categories.map(category => `
            <div class="category-item">
                <div class="category-item-info">
                    <span class="category-item-icon">${category.icon}</span>
                    <span class="category-item-name">${category.name}</span>
                    ${category.isCustom ? '<span class="category-item-badge">Custom</span>' : ''}
                </div>
                ${category.isCustom ? `
                    <button class="action-btn" onclick="Categories.deleteCategory('${category.id}')">Delete</button>
                ` : ''}
            </div>
        `).join('');
    },

    async deleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                if (window.UIEnhancements) UIEnhancements.showLoading('Deleting category...');

                await FirebaseDB.deleteCategory(categoryId);
                // Rendering handled by listener

                if (window.UIEnhancements) {
                    UIEnhancements.showToast('Deleted', 'Category deleted successfully', 'success');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Error deleting category.');
            } finally {
                if (window.UIEnhancements) UIEnhancements.hideLoading();
            }
        }
    },

    getCategoryById(categoryId) {
        // Search in both caches
        const foundIncome = this.incomeCategories.find(c => c.id === categoryId);
        if (foundIncome) return foundIncome;

        const foundExpense = this.expenseCategories.find(c => c.id === categoryId);
        return foundExpense;
    },

    getCategoriesByType(type) {
        return type === 'income' ? this.incomeCategories : this.expenseCategories;
    }
};

window.Categories = Categories;
