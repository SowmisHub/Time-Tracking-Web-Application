// ============================================
// Authentication Module
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const googleBtn = document.getElementById('googleBtn');
    const authError = document.getElementById('authError');

    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });

    // Toggle between login and signup forms
    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        hideError();
    });

    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        hideError();
    });

    // Email/Password Login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        setLoading(loginForm, true);
        hideError();

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoading(loginForm, false);
        }
    });

    // Email/Password Signup
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!name) {
            showError('Please enter your name');
            return;
        }

        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        setLoading(signupForm, true);
        hideError();

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile with name
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Create user document in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.location.href = 'dashboard.html';
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoading(signupForm, false);
        }
    });

    // Google Sign In
    googleBtn?.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        hideError();

        try {
            const result = await auth.signInWithPopup(provider);
            
            // Create/update user document
            const user = result.user;
            await db.collection('users').doc(user.uid).set({
                name: user.displayName || 'User',
                email: user.email,
                photoURL: user.photoURL || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            window.location.href = 'dashboard.html';
        } catch (error) {
            handleAuthError(error);
        }
    });

    // Helper Functions
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showError(message) {
        authError.textContent = message;
        authError.classList.remove('hidden');
        authError.classList.add('shake');
        setTimeout(() => authError.classList.remove('shake'), 500);
    }

    function hideError() {
        authError.classList.add('hidden');
        authError.textContent = '';
    }

    function setLoading(form, loading) {
        const btn = form.querySelector('button[type="submit"]');
        const btnText = btn.querySelector('span:first-child');
        const btnLoader = btn.querySelector('.btn-loader');

        if (loading) {
            btn.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            btn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    function handleAuthError(error) {
        let message = 'An error occurred. Please try again.';

        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No account found with this email';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password';
                break;
            case 'auth/email-already-in-use':
                message = 'An account already exists with this email';
                break;
            case 'auth/weak-password':
                message = 'Password should be at least 6 characters';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later';
                break;
            case 'auth/popup-closed-by-user':
                message = 'Sign in cancelled';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Check your connection';
                break;
        }

        showError(message);
    }
});
