// transactions.js - Transaction Management

const Transactions = {
    currentUser: null,
    currentFilter: 'all',
    currentTransaction: null,
    currentTransactionType: 'income',
    listenersAttached: false,
    transactions: [], // Local cache
    unsubscribe: null,

    init(user) {
        console.log('Transactions.init called', user);
        this.currentUser = user;
        this.attachEventListeners();

        // Initial update attempt in case categories are already there
        setTimeout(() => {
            this.updateCategoryOptions();
        }, 500);

        // Setup real-time listener
        if (this.unsubscribe) this.unsubscribe();

        if (window.FirebaseDB) {
            this.unsubscribe = FirebaseDB.listenToTransactions(user.uid, (transactions) => {
                this.transactions = transactions;
                this.renderTransactions();
                this.updateSummary();
            });
        }
    },

    attachEventListeners() {
        console.log('attachEventListeners called. Already attached:', this.listenersAttached);
        if (this.listenersAttached) {
            console.warn('Listeners already attached, skipping.');
            return;
        }
        this.listenersAttached = true;

        const addBtn = document.getElementById('add-transaction-btn');
        console.log('Add Transaction Button:', addBtn);

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                console.log('Add Transaction Button Clicked');
                this.showTransactionModal();
            });
        } else {
            console.error('CRITICAL: add-transaction-btn NOT FOUND');
        }

        // Transaction form submission

        // Transaction form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveTransaction();
        });

        // Type toggle buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.dataset.type;
                this.setTransactionType(type);
            });
        });

        // Close transaction modal
        document.getElementById('close-transaction-modal').addEventListener('click', () => {
            this.hideTransactionModal();
        });

        document.getElementById('cancel-transaction').addEventListener('click', () => {
            this.hideTransactionModal();
        });

        // Close modal on overlay click
        document.querySelector('#transaction-modal .modal-overlay').addEventListener('click', () => {
            this.hideTransactionModal();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTransactions();
            });
        });

        // Search functionality
        const overviewSearch = document.getElementById('search-transactions');
        if (overviewSearch) {
            overviewSearch.addEventListener('input', (e) => {
                this.searchTransactions(e.target.value, 'transactions-list');
            });
        }

        // Search in all transactions section
        const allTransactionsSearch = document.querySelector('#transactions-section .search-input');
        if (allTransactionsSearch) {
            allTransactionsSearch.addEventListener('input', (e) => {
                this.searchTransactions(e.target.value, 'all-transactions-list');
            });
        }

        // Delete confirmation
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('close-delete-modal').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.querySelector('#delete-modal .modal-overlay').addEventListener('click', () => {
            this.hideDeleteModal();
        });
    },

    showTransactionModal(transaction = null) {
        try {
            console.log('Opening transaction modal', transaction);
            const modal = document.getElementById('transaction-modal');
            const title = document.getElementById('transaction-modal-title');

            if (transaction) {
                // Edit mode
                this.currentTransaction = transaction;
                title.textContent = 'Edit Transaction';

                document.getElementById('transaction-id').value = transaction.id;
                document.getElementById('transaction-amount').value = transaction.amount;
                document.getElementById('transaction-description').value = transaction.description;
                document.getElementById('transaction-date').value = new Date(transaction.date).toISOString().split('T')[0];

                this.setTransactionType(transaction.type);

                // Set category after type is set
                setTimeout(() => {
                    document.getElementById('transaction-category').value = transaction.category;
                }, 0);
            } else {
                // Add mode
                this.currentTransaction = null;
                title.textContent = 'Add Transaction';

                document.getElementById('transaction-form').reset();
                document.getElementById('transaction-id').value = '';

                // Set default date to today
                document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];

                this.setTransactionType('income');
            }

            modal.classList.add('show');
            console.log('Modal class added');
        } catch (error) {
            console.error('Error opening transaction modal:', error);
            alert('Error opening modal: ' + error.message);
        }
    },

    hideTransactionModal() {
        const modal = document.getElementById('transaction-modal');
        modal.classList.remove('show');
        this.currentTransaction = null;
    },

    setTransactionType(type) {
        this.currentTransactionType = type;

        // Update type buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Update category options
        this.updateCategoryOptions();
    },

    updateCategoryOptions() {
        try {
            console.log('updateCategoryOptions called. Type:', this.currentTransactionType);
            const select = document.getElementById('transaction-category');

            if (!select) {
                console.error('Transaction category select element not found');
                return;
            }

            // Check if Categories is available
            if (!window.Categories || !Categories.getCategoriesByType) {
                console.error('Categories module not loaded or missing getCategoriesByType');
                return;
            }

            const categories = Categories.getCategoriesByType(this.currentTransactionType);
            console.log('Categories retrieved:', categories);

            if (!categories || categories.length === 0) {
                console.warn('No categories found for type:', this.currentTransactionType);
                select.innerHTML = '<option value="">Select category</option>';
                return;
            }

            select.innerHTML = '<option value="">Select category</option>' +
                categories.map(cat => `
                    <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                `).join('');

            console.log('Category options updated. Count:', categories.length);
        } catch (error) {
            console.error('Error updating category options:', error);
        }
    },

    async handleSaveTransaction() {
        const id = document.getElementById('transaction-id').value;
        const category = document.getElementById('transaction-category').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const description = document.getElementById('transaction-description').value.trim();
        const dateString = document.getElementById('transaction-date').value;
        const [year, month, day] = dateString.split('-').map(Number);

        // Create date object for local time 00:00:00
        const dateObj = new Date(year, month - 1, day);

        // Convert to Firestore Timestamp
        const dateTimestamp = firebase.firestore.Timestamp.fromDate(dateObj);

        if (!category || !amount || !description) {
            alert('Please fill in all fields');
            return;
        }

        try {
            if (window.UIEnhancements) UIEnhancements.showLoading('Saving transaction...');

            const transactionData = {
                userId: this.currentUser.uid || this.currentUser.id, // Handle both Firebase User and local object
                type: this.currentTransactionType,
                category: category,
                amount: amount,
                description: description,
                date: dateTimestamp
            };

            if (id) {
                // Update existing transaction
                await FirebaseDB.updateTransaction(id, transactionData);
            } else {
                // Create new transaction
                await FirebaseDB.saveTransaction(transactionData);
            }

            this.hideTransactionModal();
            // Rendering happens automatically via listener

            // Show success notification
            if (window.UIEnhancements) {
                const action = id ? 'updated' : 'added';
                UIEnhancements.showToast(
                    'Success!',
                    `Transaction ${action} successfully`,
                    'success'
                );
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Error saving transaction. Please try again.');
        } finally {
            if (window.UIEnhancements) UIEnhancements.hideLoading();
        }
    },

    renderTransactions() {
        this.renderTransactionList('transactions-list');
        this.renderTransactionList('all-transactions-list');
    },

    renderTransactionList(containerId) {
        const container = document.getElementById(containerId);
        let transactions = [...this.transactions]; // Use local cache

        // Apply type filter
        if (this.currentFilter !== 'all') {
            transactions = transactions.filter(t => t.type === this.currentFilter);
        }

        // Apply date range filter (QuickWins)
        if (window.QuickWins) {
            transactions = QuickWins.filterByDateRange(transactions);
        }

        // Apply sort (QuickWins)
        if (window.QuickWins) {
            transactions = QuickWins.sortTransactions(transactions);
        } else {
            // Fallback: Sort by date (newest first)
            transactions.sort((a, b) => b.date - a.date);
        }

        // Limit to 5 for overview section
        if (containerId === 'transactions-list') {
            transactions = transactions.slice(0, 5);
        }

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>No transactions yet</p>
                    <p class="empty-subtitle">Start by adding your first transaction</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => {
            const category = Categories.getCategoryById(transaction.category);
            const categoryName = category ? category.name : 'Unknown';
            const categoryIcon = category ? category.icon : '❓';
            const date = new Date(transaction.date).toLocaleDateString();
            const isSelected = window.QuickWins && QuickWins.selectedTransactions.has(transaction.id);

            return `
                <div class="transaction-item ${isSelected ? 'selected' : ''}" data-id="${transaction.id}">
                    ${containerId === 'all-transactions-list' ? `
                        <input type="checkbox" 
                               class="transaction-checkbox" 
                               data-id="${transaction.id}"
                               ${isSelected ? 'checked' : ''}
                               onclick="QuickWins.toggleSelection('${transaction.id}'); Transactions.renderTransactions();">
                    ` : ''}
                    <div class="transaction-info">
                        <div class="transaction-icon ${transaction.type}">
                            ${categoryIcon}
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-category">${categoryName}</div>
                            <div class="transaction-description">${transaction.description} • ${date}</div>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}د.إ ${transaction.amount.toFixed(2)}
                    </div>
                    <div class="transaction-actions">
                        <button class="action-btn" onclick="Transactions.editTransaction('${transaction.id}')">Edit</button>
                        <button class="action-btn" onclick="Transactions.deleteTransaction('${transaction.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    searchTransactions(query, containerId = 'all-transactions-list') {
        const container = document.getElementById(containerId);
        let transactions = [...this.transactions]; // Use local cache

        // Apply filter
        if (this.currentFilter !== 'all') {
            transactions = transactions.filter(t => t.type === this.currentFilter);
        }

        // Apply search
        if (query && query.trim()) {
            const lowerQuery = query.toLowerCase();
            transactions = transactions.filter(t => {
                const category = Categories.getCategoryById(t.category);
                const categoryName = category ? category.name.toLowerCase() : '';
                return t.description.toLowerCase().includes(lowerQuery) ||
                    categoryName.includes(lowerQuery);
            });
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => b.date - a.date);

        // Limit to 5 for overview section
        if (containerId === 'transactions-list') {
            transactions = transactions.slice(0, 5);
        }

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p>No transactions found</p>
                    <p class="empty-subtitle">Try a different search term</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => {
            const category = Categories.getCategoryById(transaction.category);
            const categoryName = category ? category.name : 'Unknown';
            const categoryIcon = category ? category.icon : '❓';
            const date = new Date(transaction.date).toLocaleDateString();

            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon ${transaction.type}">
                            ${categoryIcon}
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-category">${categoryName}</div>
                            <div class="transaction-description">${transaction.description} • ${date}</div>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}د.إ ${transaction.amount.toFixed(2)}
                    </div>
                    <div class="transaction-actions">
                        <button class="action-btn" onclick="Transactions.editTransaction('${transaction.id}')">Edit</button>
                        <button class="action-btn" onclick="Transactions.deleteTransaction('${transaction.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateSummary() {
        const transactions = this.transactions;

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpenses;

        document.getElementById('total-income').textContent = `د.إ ${totalIncome.toFixed(2)}`;
        document.getElementById('total-expenses').textContent = `د.إ ${totalExpenses.toFixed(2)}`;
        document.getElementById('balance').textContent = `د.إ ${balance.toFixed(2)}`;
    },

    editTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);

        if (transaction) {
            this.showTransactionModal(transaction);
        }
    },

    deleteTransaction(transactionId) {
        this.transactionToDelete = transactionId;
        const modal = document.getElementById('delete-modal');
        document.getElementById('delete-message').textContent = 'Are you sure you want to delete this transaction?';
        modal.classList.add('show');
    },

    async confirmDelete() {
        if (this.transactionToDelete) {
            try {
                if (window.UIEnhancements) UIEnhancements.showLoading('Deleting transaction...');

                await FirebaseDB.deleteTransaction(this.transactionToDelete);

                this.transactionToDelete = null;
                this.hideDeleteModal();
                // Rendering handled by listener

                // Show success notification
                if (window.UIEnhancements) {
                    UIEnhancements.showToast(
                        'Deleted',
                        'Transaction deleted successfully',
                        'success'
                    );
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Error deleting transaction. Please try again.');
            } finally {
                if (window.UIEnhancements) UIEnhancements.hideLoading();
            }
        }
    },

    hideDeleteModal() {
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
        this.transactionToDelete = null;
    }
};

window.Transactions = Transactions;
