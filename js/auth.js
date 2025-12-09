// auth.js
// Assumes firebase-config.js loaded before this file

// Helper mapping for friendly messages
function getAuthErrorMessage(code) {
    const map = {
        'auth/user-not-found': 'No account found with this email. Please sign up.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/popup-closed-by-user': 'Sign in cancelled.',
        'auth/invalid-action-code': 'Invalid or expired action code.',
        'auth/missing-email': 'Please provide an email address.'
    };
    return map[code] || 'Authentication failed. Please try again.';
}

function showAuthError(message) {
    const el = document.getElementById('authError');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}

function hideAuthError() {
    const el = document.getElementById('authError');
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
}

function setFormLoading(formEl, loading) {
    if (!formEl) return;
    const btn = formEl.querySelector('button[type="submit"]');
    if (!btn) return;
    const text = btn.querySelector('span:first-child');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (text) text.classList.toggle('hidden', loading);
    if (loader) loader.classList.toggle('hidden', !loading);
}

// Ensure Firestore user doc exists (merge mode)
async function ensureUserDoc(user) {
    if (!user) return;
    const userRef = db.collection('users').doc(user.uid);
    try {
        await userRef.set({
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            photoURL: user.photoURL || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.error('ensureUserDoc error', err);
    }
}

// Forgot password
async function resetPassword(email) {
    const msgEl = document.getElementById('resetMessage');
    if (!email) {
        if (msgEl) {
            msgEl.textContent = 'Please enter your email first.';
            msgEl.classList.remove('hidden');
            setTimeout(() => msgEl.classList.add('hidden'), 4000);
        }
        return;
    }

    // basic client-side validation
    const trimmed = (email || '').trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
        if (msgEl) {
            msgEl.textContent = 'Please enter a valid email address.';
            msgEl.classList.remove('hidden');
            setTimeout(() => msgEl.classList.add('hidden'), 4000);
        }
        return;
    }

    try {
        // Use Firebase Auth to send password reset email
        await auth.sendPasswordResetEmail(trimmed);
        if (msgEl) {
            msgEl.textContent = 'Password reset link sent to your email.';
            msgEl.classList.remove('hidden');
            // show success style if you have style variations
            msgEl.classList.add('show', 'success');
            setTimeout(() => {
                msgEl.classList.remove('show', 'success');
                msgEl.classList.add('hidden');
            }, 5000);
        }
    } catch (error) {
        console.error('resetPassword error', error);
        if (msgEl) {
            msgEl.textContent = getAuthErrorMessage(error.code);
            msgEl.classList.remove('hidden');
            msgEl.classList.add('show', 'error');
            setTimeout(() => {
                msgEl.classList.remove('show', 'error');
                msgEl.classList.add('hidden');
            }, 6000);
        }
    }
}

// DOM actions
document.addEventListener('DOMContentLoaded', () => {
    // Elements (index.html)
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const googleBtn = document.getElementById('googleBtn');
    const forgotLink = document.getElementById('forgotPasswordLink');

    // redirect if already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            // ensure DB doc exists
            ensureUserDoc(user).then(() => {
                // if on login page, go to dashboard
                const path = window.location.pathname;
                if (path.endsWith('index.html') || path === '/' || path.includes('index')) {
                    window.location.href = 'dashboard.html';
                }
            });
        }
    });

    // Toggle forms
    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        hideAuthError();
    });
    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        hideAuthError();
    });

    // Forgot password: improved behaviour
    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();

            // If the email input in the login form has a value, use it.
            // Otherwise prompt the user to enter an email (non-intrusive).
            const emailInput = document.getElementById('email');
            let emailValue = emailInput?.value?.trim() || '';

            if (!emailValue) {
                // Use a browser prompt so we don't alter your HTML structure.
                // This avoids adding new UI elements while still allowing the user to provide an email.
                const promptEmail = window.prompt('Please enter your email to receive the password reset link:');
                if (!promptEmail) {
                    // user cancelled prompt — show a small message
                    const msgEl = document.getElementById('resetMessage');
                    if (msgEl) {
                        msgEl.textContent = 'Password reset cancelled.';
                        msgEl.classList.remove('hidden');
                        setTimeout(() => msgEl.classList.add('hidden'), 3000);
                    }
                    return;
                }
                emailValue = promptEmail.trim();
            }

            // call resetPassword (handles validation/messages)
            await resetPassword(emailValue);
        });
    }

    // Login submit
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAuthError();
        setFormLoading(loginForm, true);
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        if (!email || !password) {
            showAuthError('Please enter email and password.');
            setFormLoading(loginForm, false);
            return;
        }
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged handles redirect
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error('signIn error', err);
            showAuthError(getAuthErrorMessage(err.code));
        } finally {
            setFormLoading(loginForm, false);
        }
    });

    // Signup submit
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAuthError();
        setFormLoading(signupForm, true);
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        if (!name) { showAuthError('Please enter your name'); setFormLoading(signupForm, false); return; }
        if (!email || !password) { showAuthError('Please fill all fields'); setFormLoading(signupForm, false); return; }
        try {
            const uc = await auth.createUserWithEmailAndPassword(email, password);
            // update displayName
            await uc.user.updateProfile({ displayName: name });
            // ensure Firestore doc
            await db.collection('users').doc(uc.user.uid).set({
                name,
                email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error('signup error', err);
            showAuthError(getAuthErrorMessage(err.code));
        } finally {
            setFormLoading(signupForm, false);
        }
    });

    // Google sign in
    googleBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        hideAuthError();
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            // ensure Firestore doc
            await db.collection('users').doc(user.uid).set({
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error('google signin error', err);
            showAuthError(getAuthErrorMessage(err.code));
        }
    });
});
