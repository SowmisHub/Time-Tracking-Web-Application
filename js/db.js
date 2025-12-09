// ============================================
// Database Module - Firestore Operations
// ============================================

const DB = {
    // Get current user ID
    getUserId() {
        return auth.currentUser?.uid;
    },

    // Format date as YYYY-MM-DD
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    // Get activities collection reference
    getActivitiesRef(date) {
        const userId = this.getUserId();
        if (!userId) return null;
        
        const dateStr = typeof date === 'string' ? date : this.formatDate(date);
        return db.collection('users')
            .doc(userId)
            .collection('days')
            .doc(dateStr)
            .collection('activities');
    },

    // Get all activities for a date
    async getActivities(date) {
        const ref = this.getActivitiesRef(date);
        if (!ref) return [];

        try {
            const snapshot = await ref.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting activities:', error);
            return [];
        }
    },

    // Add new activity
    async addActivity(date, activity) {
        const ref = this.getActivitiesRef(date);
        if (!ref) throw new Error('User not authenticated');

        const docRef = await ref.add({
            ...activity,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return docRef.id;
    },

    // Update activity
    async updateActivity(date, activityId, updates) {
        const ref = this.getActivitiesRef(date);
        if (!ref) throw new Error('User not authenticated');

        await ref.doc(activityId).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    // Delete activity
    async deleteActivity(date, activityId) {
        const ref = this.getActivitiesRef(date);
        if (!ref) throw new Error('User not authenticated');

        await ref.doc(activityId).delete();
    },

    // Calculate total minutes for a date
    async getTotalMinutes(date) {
        const activities = await this.getActivities(date);
        return activities.reduce((sum, act) => sum + (act.duration || 0), 0);
    },

    // Listen to activities in real-time
    subscribeToActivities(date, callback) {
        const ref = this.getActivitiesRef(date);
        if (!ref) return () => {};

        return ref.orderBy('createdAt', 'desc').onSnapshot(
            (snapshot) => {
                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(activities);
            },
            (error) => {
                console.error('Error listening to activities:', error);
            }
        );
    }
};
