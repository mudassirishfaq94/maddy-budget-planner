// quick-wins.js - Date Range Filter, Sort, and Bulk Actions

const QuickWins = {
    currentDateRange: 'all',
    customStartDate: null,
    customEndDate: null,
    sortField: 'date',
    sortDirection: 'desc',
    selectedTransactions: new Set(),

    init() {
        this.setupDateFilters();
        this.setupSortControls();
        this.setupBulkActions();
        this.loadPreferences();
    },

    // Date Range Filtering
    setupDateFilters() {
        // Quick filter buttons
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const range = btn.dataset.range;
                this.setDateRange(range);

                // Update active state
                document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show/hide custom date range
                const customRange = document.getElementById('custom-date-range');
                if (range === 'custom') {
                    customRange.classList.remove('hidden');
                } else {
                    customRange.classList.add('hidden');
                    Transactions.renderTransactions();
                }
            });
        });

        // Custom date range apply button
        const applyBtn = document.getElementById('apply-date-range');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;

                if (startDate && endDate) {
                    this.customStartDate = new Date(startDate).getTime();
                    this.customEndDate = new Date(endDate).setHours(23, 59, 59, 999);
                    Transactions.renderTransactions();

                    if (window.UIEnhancements) {
                        UIEnhancements.showToast('Date Filter Applied', `Showing transactions from ${startDate} to ${endDate}`, 'success');
                    }
                }
            });
        }
    },

    setDateRange(range) {
        this.currentDateRange = range;
        const now = new Date();

        switch (range) {
            case 'today':
                this.customStartDate = new Date(now.setHours(0, 0, 0, 0)).getTime();
                this.customEndDate = new Date(now.setHours(23, 59, 59, 999)).getTime();
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                this.customStartDate = weekStart.getTime();
                this.customEndDate = Date.now();
                break;
            case 'month':
                this.customStartDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                this.customEndDate = Date.now();
                break;
            case 'year':
                this.customStartDate = new Date(now.getFullYear(), 0, 1).getTime();
                this.customEndDate = Date.now();
                break;
            case 'all':
            default:
                this.customStartDate = null;
                this.customEndDate = null;
                break;
        }

        localStorage.setItem('dateRange', range);
    },

    filterByDateRange(transactions) {
        if (!this.customStartDate || !this.customEndDate) {
            return transactions;
        }

        return transactions.filter(t => {
            return t.date >= this.customStartDate && t.date <= this.customEndDate;
        });
    },

    // Sort Controls
    setupSortControls() {
        const sortField = document.getElementById('sort-field');
        const sortDirection = document.getElementById('sort-direction');

        if (sortField) {
            sortField.addEventListener('change', (e) => {
                this.sortField = e.target.value;
                this.savePreferences();
                Transactions.renderTransactions();
            });
        }

        if (sortDirection) {
            sortDirection.addEventListener('click', () => {
                this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
                sortDirection.dataset.direction = this.sortDirection;
                this.savePreferences();
                Transactions.renderTransactions();
            });
        }
    },

    sortTransactions(transactions) {
        return transactions.sort((a, b) => {
            let aVal, bVal;

            switch (this.sortField) {
                case 'amount':
                    aVal = a.amount;
                    bVal = b.amount;
                    break;
                case 'category':
                    const aCat = Categories.getCategoryById(a.category);
                    const bCat = Categories.getCategoryById(b.category);
                    aVal = aCat ? aCat.name : '';
                    bVal = bCat ? bCat.name : '';
                    break;
                case 'description':
                    aVal = a.description.toLowerCase();
                    bVal = b.description.toLowerCase();
                    break;
                case 'date':
                default:
                    aVal = a.date;
                    bVal = b.date;
                    break;
            }

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    },

    // Bulk Actions
    setupBulkActions() {
        const selectAll = document.getElementById('select-all-transactions');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');

        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectAllVisible();
                } else {
                    this.deselectAll();
                }
            });
        }

        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.bulkDelete();
            });
        }
    },

    toggleSelection(transactionId) {
        if (this.selectedTransactions.has(transactionId)) {
            this.selectedTransactions.delete(transactionId);
        } else {
            this.selectedTransactions.add(transactionId);
        }

        this.updateBulkActionsUI();
    },

    selectAllVisible() {
        const checkboxes = document.querySelectorAll('.transaction-checkbox');
        checkboxes.forEach(checkbox => {
            const id = checkbox.dataset.id;
            this.selectedTransactions.add(id);
            checkbox.checked = true;
            const item = checkbox.closest('.transaction-item');
            if (item) item.classList.add('selected');
        });

        this.updateBulkActionsUI();
    },

    deselectAll() {
        this.selectedTransactions.clear();

        const checkboxes = document.querySelectorAll('.transaction-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const item = checkbox.closest('.transaction-item');
            if (item) item.classList.remove('selected');
        });

        const selectAll = document.getElementById('select-all-transactions');
        if (selectAll) selectAll.checked = false;

        this.updateBulkActionsUI();
    },

    updateBulkActionsUI() {
        const count = this.selectedTransactions.size;
        const countSpan = document.getElementById('selection-count');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');

        if (countSpan) countSpan.textContent = count;

        if (bulkDeleteBtn) {
            if (count > 0) {
                bulkDeleteBtn.classList.remove('hidden');
            } else {
                bulkDeleteBtn.classList.add('hidden');
            }
        }
    },

    bulkDelete() {
        if (this.selectedTransactions.size === 0) return;

        const count = this.selectedTransactions.size;
        const confirmed = confirm(`Are you sure you want to delete ${count} transaction(s)? This action cannot be undone.`);

        if (confirmed) {
            this.selectedTransactions.forEach(id => {
                Storage.deleteTransaction(id);
            });

            this.deselectAll();
            Transactions.renderTransactions();
            Transactions.updateSummary();

            if (window.UIEnhancements) {
                UIEnhancements.showToast('Bulk Delete', `${count} transaction(s) deleted successfully`, 'success');
            }
        }
    },

    // Preferences
    savePreferences() {
        localStorage.setItem('sortField', this.sortField);
        localStorage.setItem('sortDirection', this.sortDirection);
    },

    loadPreferences() {
        const savedSortField = localStorage.getItem('sortField');
        const savedSortDirection = localStorage.getItem('sortDirection');
        const savedDateRange = localStorage.getItem('dateRange');

        if (savedSortField) {
            this.sortField = savedSortField;
            const sortSelect = document.getElementById('sort-field');
            if (sortSelect) sortSelect.value = savedSortField;
        }

        if (savedSortDirection) {
            this.sortDirection = savedSortDirection;
            const sortBtn = document.getElementById('sort-direction');
            if (sortBtn) sortBtn.dataset.direction = savedSortDirection;
        }

        if (savedDateRange && savedDateRange !== 'all') {
            this.setDateRange(savedDateRange);
            const btn = document.querySelector(`[data-range="${savedDateRange}"]`);
            if (btn) {
                document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    QuickWins.init();
});

// Export for use in other files
window.QuickWins = QuickWins;
