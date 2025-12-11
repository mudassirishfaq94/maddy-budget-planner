// firebase-db.js - Firestore Database Operations

const FirebaseDB = {
    // User Profile Operations
    async saveUserProfile(userId, userData) {
        try {
            await db.collection('users').doc(userId).set({
                name: userData.name,
                email: userData.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw error;
        }
    },

    async getUserProfile(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    },

    // Transaction Operations
    async saveTransaction(transaction) {
        try {
            const docRef = await db.collection('transactions').add({
                ...transaction,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error saving transaction:', error);
            throw error;
        }
    },

    listenToTransactions(userId, callback) {
        return db.collection('transactions')
            .where('userId', '==', userId)
            .orderBy('date', 'desc')
            .onSnapshot((snapshot) => {
                const transactions = [];
                snapshot.forEach((doc) => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().date?.toMillis() || Date.now(),
                        createdAt: doc.data().createdAt?.toMillis() || Date.now(),
                        updatedAt: doc.data().updatedAt?.toMillis() || Date.now()
                    });
                });
                callback(transactions);
            }, (error) => {
                console.error('Error listening to transactions:', error);
            });
    },

    async updateTransaction(transactionId, updates) {
        try {
            await db.collection('transactions').doc(transactionId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    },

    async deleteTransaction(transactionId) {
        try {
            await db.collection('transactions').doc(transactionId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    },

    // Category Operations
    async saveCategory(category) {
        try {
            const docRef = await db.collection('categories').add(category);
            return docRef.id;
        } catch (error) {
            console.error('Error saving category:', error);
            throw error;
        }
    },

    listenToCategories(userId, type, callback) {
        // Get default categories (userId is null) and user's custom categories
        return db.collection('categories')
            .where('type', '==', type)
            .onSnapshot((snapshot) => {
                const categories = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Include if it's a default category or belongs to the user
                    if (!data.userId || data.userId === userId) {
                        categories.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });
                callback(categories);
            }, (error) => {
                console.error('Error listening to categories:', error);
            });
    },

    async deleteCategory(categoryId) {
        try {
            await db.collection('categories').doc(categoryId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    // Initialize default categories (run once)
    async initializeDefaultCategories() {
        try {
            // Check if defaults already exist
            const snapshot = await db.collection('categories')
                .where('isCustom', '==', false)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                console.log('Default categories already initialized');
                return;
            }

            const defaultCategories = [
                // Income categories
                { type: 'income', name: 'Salary', icon: '💼', isCustom: false, userId: null },
                { type: 'income', name: 'Freelance', icon: '💻', isCustom: false, userId: null },
                { type: 'income', name: 'Investment', icon: '📈', isCustom: false, userId: null },
                { type: 'income', name: 'Business', icon: '🏢', isCustom: false, userId: null },
                { type: 'income', name: 'Gift', icon: '🎁', isCustom: false, userId: null },
                { type: 'income', name: 'Other', icon: '💰', isCustom: false, userId: null },

                // Expense categories
                { type: 'expense', name: 'Food & Dining', icon: '🍔', isCustom: false, userId: null },
                { type: 'expense', name: 'Transport', icon: '🚗', isCustom: false, userId: null },
                { type: 'expense', name: 'Housing', icon: '🏠', isCustom: false, userId: null },
                { type: 'expense', name: 'Entertainment', icon: '🎬', isCustom: false, userId: null },
                { type: 'expense', name: 'Healthcare', icon: '⚕️', isCustom: false, userId: null },
                { type: 'expense', name: 'Shopping', icon: '🛍️', isCustom: false, userId: null },
                { type: 'expense', name: 'Bills & Utilities', icon: '📄', isCustom: false, userId: null },
                { type: 'expense', name: 'Education', icon: '📚', isCustom: false, userId: null },
                { type: 'expense', name: 'Other', icon: '💸', isCustom: false, userId: null }
            ];

            const batch = db.batch();
            defaultCategories.forEach((category) => {
                const docRef = db.collection('categories').doc();
                batch.set(docRef, category);
            });

            await batch.commit();
            console.log('Default categories initialized successfully');
        } catch (error) {
            console.error('Error initializing default categories:', error);
            throw error;
        }
    },

    // Utility function to generate Firestore-compatible timestamp
    timestamp() {
        return firebase.firestore.Timestamp.now();
    },

    // Convert Firestore timestamp to milliseconds
    toMillis(timestamp) {
        return timestamp?.toMillis() || Date.now();
    }
};

// Export for use in other files
window.FirebaseDB = FirebaseDB;
