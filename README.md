# Budget Manager App - Firebase Setup Guide

## 🚀 Quick Start

This app now uses Firebase for authentication and cloud database storage. Follow these steps to get it running:

## 📋 Prerequisites

1. A Google account
2. Basic understanding of Firebase Console

## 🔧 Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter project name: `budget-manager-app` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

### Step 2: Register Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. Register app with nickname: `Budget Manager Web`
3. **DO NOT** check "Also set up Firebase Hosting" (we'll do this later if needed)
4. Click "Register app"
5. **COPY** the Firebase configuration object shown

### Step 3: Configure Your App

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 4: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on **"Email/Password"** in the Sign-in method tab
4. **Enable** the "Email/Password" toggle
5. Click "Save"

### Step 5: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select **"Start in test mode"** (we'll add security rules later)
4. Choose a location closest to your users (e.g., `asia-south1` for UAE)
5. Click "Enable"

### Step 6: Deploy Security Rules

1. In Firestore Database, go to the **"Rules"** tab
2. Copy the contents of `firestore.rules` file from your project
3. Paste into the Firebase Console rules editor
4. Click "Publish"

### Step 7: Initialize Default Categories

1. Open your app in a browser (`index.html`)
2. Open browser console (F12)
3. Run this command:
```javascript
FirebaseDB.initializeDefaultCategories()
```
4. You should see "Default categories initialized successfully"
5. This only needs to be done once

## 🎯 Testing Your Setup

1. Open `index.html` in your browser
2. Click "Sign up" and create a test account
3. Add some transactions
4. Open Firebase Console → Firestore Database
5. You should see your data in the collections:
   - `users`
   - `transactions`
   - `categories`

## 🔒 Security

### Current Setup (Development)
- Firestore is in **test mode** initially
- Security rules are configured to protect user data
- Each user can only access their own transactions

### For Production
1. Ensure security rules are deployed (Step 6)
2. Never commit `firebase-config.js` with real credentials to public repos
3. Consider adding `.gitignore`:
```
firebase-config.js
.env
```

## 📱 Features Now Available

✅ **Cloud Authentication**
- Secure signup/login with Firebase Auth
- Password reset (can be added)
- Email verification (can be added)

✅ **Real-time Database**
- All data stored in Firestore
- Automatic sync across devices
- Offline support enabled

✅ **Multi-device Sync**
- Login from any device
- Data syncs automatically
- Real-time updates

## 🐛 Troubleshooting

### "Firebase is not defined"
- Make sure Firebase SDK scripts are loaded before your custom scripts
- Check browser console for script loading errors

### "Permission denied" errors
- Verify security rules are deployed
- Check that you're logged in
- Ensure user owns the data they're trying to access

### Data not showing up
- Check Firebase Console → Firestore Database
- Verify you're logged in with the correct account
- Check browser console for errors

### "Default categories not found"
- Run `FirebaseDB.initializeDefaultCategories()` in console
- Refresh the page

## 📚 Next Steps

### Optional Enhancements
1. **Email Verification**: Require users to verify email
2. **Password Reset**: Add "Forgot Password" functionality
3. **Social Login**: Add Google/Facebook login
4. **Firebase Hosting**: Deploy to Firebase Hosting
5. **Analytics**: Add Firebase Analytics
6. **Budget Goals**: Set monthly budget limits
7. **Data Export**: Export transactions to CSV/PDF

### Deployment to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy
```

## 🎉 You're All Set!

Your budget manager app is now production-ready with Firebase! 

**Important Files:**
- `firebase-config.js` - Your Firebase configuration
- `firebase-db.js` - Database operations
- `firestore.rules` - Security rules
- `.env.example` - Environment template

For questions or issues, check the Firebase documentation at [firebase.google.com/docs](https://firebase.google.com/docs)
