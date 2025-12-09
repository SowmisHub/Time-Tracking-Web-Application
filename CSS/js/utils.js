// ============================================
// Utility Functions
// ============================================

const Utils = {
    // Format minutes to hours and minutes
    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    },

    // Get category emoji
    getCategoryEmoji(category) {
        const emojis = {
            'Work': '💼',
            'Study': '📚',
            'Sleep': '😴',
            'Entertainment': '🎮',
            'Exercise': '🏃',
            'Others': '📌'
        };
        return emojis[category] || '📌';
    },

    // Get category color
    getCategoryColor(category) {
        const colors = {
            'Work': '#3b82f6',
            'Study': '#8b5cf6',
            'Sleep': '#6366f1',
            'Entertainment': '#ec4899',
            'Exercise': '#10b981',
            'Others': '#6b7280'
        };
        return colors[category] || '#6b7280';
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');

        // Set content
        toastIcon.textContent = type === 'success' ? '✓' : '✕';
        toastMessage.textContent = message;

        // Set type class
        toast.classList.remove('success', 'error', 'hidden');
        toast.classList.add(type);

        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Validate activity data
    validateActivity(name, category, duration, remainingMinutes, editingDuration = 0) {
        if (!name || name.trim().length === 0) {
            return { valid: false, error: 'Please enter an activity name' };
        }

        if (name.trim().length > 100) {
            return { valid: false, error: 'Activity name must be less than 100 characters' };
        }

        if (!category) {
            return { valid: false, error: 'Please select a category' };
        }

        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum < 1) {
            return { valid: false, error: 'Duration must be at least 1 minute' };
        }

        if (durationNum > 1440) {
            return { valid: false, error: 'Duration cannot exceed 1440 minutes (24 hours)' };
        }

        const effectiveRemaining = remainingMinutes + editingDuration;
        if (durationNum > effectiveRemaining) {
            return { 
                valid: false, 
                error: `Duration exceeds remaining time. You have ${effectiveRemaining} minutes left.`
            };
        }

        return { valid: true };
    }
};
