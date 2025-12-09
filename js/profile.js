// profile.js
// requires firebase-config.js loaded earlier (auth & db)

document.addEventListener('DOMContentLoaded', () => {
    // inject sidebar if not present
    if (!document.getElementById('profileSidebar')) {
        const sidebar = document.createElement('aside');
        sidebar.id = 'profileSidebar';
        sidebar.className = 'profile-sidebar';
        sidebar.innerHTML = `
            <div class="close-btn"><button id="profileCloseBtn" aria-label="Close sidebar">✖</button></div>
            <div class="profile-card">
                <div class="avatar" id="sidebarAvatar">U</div>
                <div class="info">
                    <div class="name-row">
                        <h3 id="sidebarName">User</h3>
                        <button class="edit-name-btn" id="startEditName" title="Edit name">✎</button>
                    </div>
                    <p id="sidebarEmail">email@example.com</p>
                    <input id="editNameInput" class="edit-name-input hidden" placeholder="Enter name" />
                    <div id="editActions" class="hidden" style="margin-top:8px; display:flex; gap:8px;">
                        <button id="saveNameBtn" class="btn btn-primary">Save</button>
                        <button id="cancelNameBtn" class="btn btn-outline">Cancel</button>
                    </div>
                </div>
            </div>

            <nav class="profile-menu">
                <a href="dashboard.html"><span>📋</span><span class="menu-label">Dashboard <span class="small">Go to dashboard</span></span></a>
                <a href="analytics.html"><span>📊</span><span class="menu-label">Analytics <span class="small">View analytics</span></span></a>
                <div style="height:8px"></div>
                <div class="sidebar-footer">
                    <!-- IMPORTANT: id matches analytics.js expectation -->
                    <button id="sidebarLogout" class="btn btn-outline">Logout</button>
                </div>
            </nav>
        `;
        document.body.appendChild(sidebar);
    }

    const sidebar = document.getElementById('profileSidebar');
    const openBtnArea = document.querySelector('.user-profile');
    const closeBtn = document.getElementById('profileCloseBtn');
    const startEditBtn = document.getElementById('startEditName');
    const editInput = document.getElementById('editNameInput');
    const saveBtn = document.getElementById('saveNameBtn');
    const cancelBtn = document.getElementById('cancelNameBtn');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    const avatarEl = document.getElementById('sidebarAvatar');
    const logoutBtn = document.getElementById('sidebarLogout');

    function openSidebar() {
        sidebar.classList.add('open');
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        hideEditUI();
    }

    openBtnArea?.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) closeSidebar();
        else openSidebar();
    });

    closeBtn?.addEventListener('click', closeSidebar);

    // Edit name UI
    function showEditUI(currentName) {
        editInput.classList.remove('hidden');
        editInput.value = currentName || '';
        document.getElementById('editActions').classList.remove('hidden');
        sidebarName.classList.add('hidden');
        startEditBtn.classList.add('hidden');
        editInput.focus();
    }
    function hideEditUI() {
        editInput.classList.add('hidden');
        document.getElementById('editActions').classList.add('hidden');
        sidebarName.classList.remove('hidden');
        startEditBtn.classList.remove('hidden');
    }

    startEditBtn?.addEventListener('click', () => {
        const current = sidebarName.textContent || '';
        showEditUI(current);
    });

    cancelBtn?.addEventListener('click', hideEditUI);

    // Save name: update Auth + Firestore
    saveBtn?.addEventListener('click', async () => {
        const newName = editInput.value.trim();
        if (!newName || newName.length < 2) {
            alert('Name must be at least 2 characters.');
            return;
        }
        saveBtn.disabled = true;
        try {
            const user = auth.currentUser;
            if (!user) { alert('Please sign in again.'); return; }
            await user.updateProfile({ displayName: newName });
            await db.collection('users').doc(user.uid).set({
                name: newName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // update UI
            sidebarName.textContent = newName;
            avatarEl.textContent = newName[0].toUpperCase();

            const navName = document.getElementById('navUserName');
            if (navName) navName.textContent = newName;
            const navInitial = document.getElementById('navUserInitial');
            if (navInitial) navInitial.textContent = newName[0].toUpperCase();

            hideEditUI();
        } catch (err) {
            console.error('update name error', err);
            alert('Failed to update name. Try again.');
        } finally {
            saveBtn.disabled = false;
        }
    });

    // Logout
    logoutBtn?.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (err) {
            console.error('logout error', err);
            alert('Failed to logout');
        }
    });

    // populate on auth changes
    auth.onAuthStateChanged(user => {
        if (!user) {
            const path = window.location.pathname;
            if (path.includes('dashboard.html') || path.includes('analytics.html') || path.includes('profile.html')) {
                window.location.href = 'index.html';
            }
            return;
        }
        const displayName = user.displayName || user.email.split('@')[0];
        sidebarName.textContent = displayName;
        sidebarEmail.textContent = user.email;
        avatarEl.textContent = (displayName[0] || 'U').toUpperCase();

        const navUserName = document.getElementById('navUserName');
        const navUserInitial = document.getElementById('navUserInitial');
        if (navUserName) navUserName.textContent = displayName;
        if (navUserInitial) navUserInitial.textContent = (displayName[0] || 'U').toUpperCase();
    });

    // close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
    });
});
