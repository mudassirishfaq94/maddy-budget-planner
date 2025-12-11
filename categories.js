// categories.js - Category Management

const Categories = {
    currentUser: null,

    init(user) {
        this.currentUser = user;
        this.renderCategories();
        this.attachEventListeners();
    },

    attachEventListeners() {
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

    handleAddCategory() {
        const type = document.getElementById('category-type').value;
        const name = document.getElementById('category-name').value.trim();
        const icon = document.getElementById('category-icon').value.trim();

        if (!name || !icon) {
            alert('Please fill in all fields');
            return;
        }

        const category = {
            id: Storage.generateId(),
            userId: this.currentUser.id,
            type: type,
            name: name,
            icon: icon,
            isCustom: true
        };

        Storage.saveCategory(category);
        this.renderCategories();
        this.hideAddCategoryModal();

        // Update transaction modal categories if it's open
        if (Transactions) {
            Transactions.updateCategoryOptions();
        }
    },

    renderCategories() {
        this.renderIncomeCategories();
        this.renderExpenseCategories();
    },

    renderIncomeCategories() {
        const container = document.getElementById('income-categories-list');
        const categories = Storage.getCategories(this.currentUser.id, 'income');

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
        const categories = Storage.getCategories(this.currentUser.id, 'expense');

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

    deleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category?')) {
            Storage.deleteCategory(categoryId);
            this.renderCategories();

            // Update transaction modal categories if it's open
            if (Transactions) {
                Transactions.updateCategoryOptions();
            }
        }
    },

    getCategoryById(categoryId) {
        const categories = Storage.getCategories();
        return categories.find(c => c.id === categoryId);
    }
};
