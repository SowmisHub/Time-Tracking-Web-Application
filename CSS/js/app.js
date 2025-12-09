// ============================================
// Main Application - Dashboard
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const datePicker = document.getElementById('datePicker');
    const activityForm = document.getElementById('activityForm');
    const activitiesContainer = document.getElementById('activitiesContainer');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');

    // Stats elements
    const totalMinutesEl = document.getElementById('totalMinutes');
    const activityCountEl = document.getElementById('activityCount');
    const remainingMinutesEl = document.getElementById('remainingMinutes');

    // Form elements
    const activityName = document.getElementById('activityName');
    const category = document.getElementById('category');
    const duration = document.getElementById('duration');
    const formError = document.getElementById('formError');

    // Modal elements
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const editError = document.getElementById('editError');

    // State
    let currentDate = Utils.getTodayDate();
    let activities = [];
    let unsubscribe = null;
    let editingActivityId = null;

    // Constants
    const MAX_MINUTES = 1440;

    // Initialize
    init();

    function init() {
        // Check authentication
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            // Set user name
            userName.textContent = user.displayName || user.email?.split('@')[0] || 'User';
            
            // Set date picker to today
            datePicker.value = currentDate;
            datePicker.max = Utils.getTodayDate();
            
            // Load activities
            loadActivities();
        });
    }

    // Load activities for selected date
    function loadActivities() {
        if (unsubscribe) {
            unsubscribe();
        }

        showLoading(true);

        unsubscribe = DB.subscribeToActivities(currentDate, (loadedActivities) => {
            activities = loadedActivities;
            renderActivities();
            updateStats();
            showLoading(false);
        });
    }

    // Render activities
    function renderActivities() {
        if (activities.length === 0) {
            activitiesContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        activitiesContainer.innerHTML = activities.map((activity, index) => `
            <div class="activity-card ${activity.category} scale-in" style="animation-delay: ${index * 0.05}s">
                <div class="activity-header">
                    <div>
                        <h4 class="activity-name">${Utils.escapeHtml(activity.name)}</h4>
                        <span class="category-badge ${activity.category}">
                            ${Utils.getCategoryEmoji(activity.category)} ${activity.category}
                        </span>
                    </div>
                    <div class="activity-actions">
                        <button class="action-btn edit" onclick="editActivity('${activity.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="action-btn delete" onclick="deleteActivity('${activity.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="activity-duration">
                    <span class="duration-icon">⏱️</span>
                    <span class="duration-value">${Utils.formatDuration(activity.duration)}</span>
                </div>
            </div>
        `).join('');
    }

    // Update stats
    function updateStats() {
        const totalMinutes = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
        const remaining = MAX_MINUTES - totalMinutes;

        totalMinutesEl.textContent = totalMinutes;
        activityCountEl.textContent = activities.length;
        remainingMinutesEl.textContent = remaining;

        // Enable/disable analyze button
        analyzeBtn.disabled = activities.length === 0;
    }

    // Get remaining minutes
    function getRemainingMinutes() {
        const totalMinutes = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
        return MAX_MINUTES - totalMinutes;
    }

    // Show/hide loading
    function showLoading(show) {
        if (show) {
            loadingState.classList.remove('hidden');
            activitiesContainer.classList.add('hidden');
            emptyState.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
            activitiesContainer.classList.remove('hidden');
        }
    }

    // Show form error
    function showFormError(message, container = formError) {
        container.textContent = message;
        container.classList.remove('hidden');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
    }

    // Hide form error
    function hideFormError(container = formError) {
        container.classList.add('hidden');
        container.textContent = '';
    }

    // Event Listeners

    // Date picker change
    datePicker.addEventListener('change', (e) => {
        currentDate = e.target.value;
        loadActivities();
    });

    // Add activity form submit
    activityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFormError();

        const name = activityName.value.trim();
        const cat = category.value;
        const dur = parseInt(duration.value);

        // Validate
        const validation = Utils.validateActivity(name, cat, dur, getRemainingMinutes());
        if (!validation.valid) {
            showFormError(validation.error);
            return;
        }

        try {
            await DB.addActivity(currentDate, {
                name: name,
                category: cat,
                duration: dur
            });

            // Reset form
            activityForm.reset();
            Utils.showToast('Activity added successfully!');
        } catch (error) {
            console.error('Error adding activity:', error);
            showFormError('Failed to add activity. Please try again.');
        }
    });

    // Edit activity - Make global
    window.editActivity = function(activityId) {
        const activity = activities.find(a => a.id === activityId);
        if (!activity) return;

        editingActivityId = activityId;

        // Populate form
        document.getElementById('editActivityId').value = activityId;
        document.getElementById('editName').value = activity.name;
        document.getElementById('editCategory').value = activity.category;
        document.getElementById('editDuration').value = activity.duration;

        // Show modal
        editModal.classList.remove('hidden');
        hideFormError(editError);
    };

    // Delete activity - Make global
    window.deleteActivity = async function(activityId) {
        if (!confirm('Are you sure you want to delete this activity?')) {
            return;
        }

        try {
            await DB.deleteActivity(currentDate, activityId);
            Utils.showToast('Activity deleted');
        } catch (error) {
            console.error('Error deleting activity:', error);
            Utils.showToast('Failed to delete activity', 'error');
        }
    };

    // Edit form submit
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFormError(editError);

        const name = document.getElementById('editName').value.trim();
        const cat = document.getElementById('editCategory').value;
        const dur = parseInt(document.getElementById('editDuration').value);

        // Get current activity duration for validation
        const currentActivity = activities.find(a => a.id === editingActivityId);
        const currentDuration = currentActivity ? currentActivity.duration : 0;

        // Validate
        const validation = Utils.validateActivity(name, cat, dur, getRemainingMinutes(), currentDuration);
        if (!validation.valid) {
            showFormError(validation.error, editError);
            return;
        }

        try {
            await DB.updateActivity(currentDate, editingActivityId, {
                name: name,
                category: cat,
                duration: dur
            });

            closeEditModal();
            Utils.showToast('Activity updated!');
        } catch (error) {
            console.error('Error updating activity:', error);
            showFormError('Failed to update activity', editError);
        }
    });

    // Close modal
    function closeEditModal() {
        editModal.classList.add('hidden');
        editingActivityId = null;
    }

    closeModal.addEventListener('click', closeEditModal);
    cancelEdit.addEventListener('click', closeEditModal);

    // Close modal on backdrop click
    editModal.querySelector('.modal-backdrop').addEventListener('click', closeEditModal);

    // Analyze button
    analyzeBtn.addEventListener('click', () => {
        window.location.href = `analytics.html?date=${currentDate}`;
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            if (unsubscribe) {
                unsubscribe();
            }
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
            Utils.showToast('Failed to sign out', 'error');
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
            closeEditModal();
        }
    });
});
