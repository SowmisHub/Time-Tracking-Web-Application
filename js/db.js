// db.js - Firestore operations (compat)

const DB = {
    getUserId() {
        return auth.currentUser?.uid || null;
    },

    formatDate(date) {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0];
    },

    getUserRef() {
        const uid = this.getUserId();
        if (!uid) return null;
        return db.collection('users').doc(uid);
    },

    getActivitiesRef(date) {
        const uid = this.getUserId();
        if (!uid) return null;
        const dateStr = typeof date === 'string' ? date : this.formatDate(date);
        return db.collection('users').doc(uid).collection('days').doc(dateStr).collection('activities');
    },

    async getActivities(date) {
        const ref = this.getActivitiesRef(date);
        if (!ref) return [];
        try {
            const snap = await ref.orderBy('createdAt', 'desc').get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (err) {
            console.error('getActivities error', err);
            return [];
        }
    },

    async addActivity(date, activity) {
        const ref = this.getActivitiesRef(date);
        if (!ref) throw new Error('User not authenticated');
        const docRef = await ref.add({
            ...activity,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    },

    async updateActivity(date, id, updates) {
        const ref = this.getActivitiesRef(date);
        if (!ref) throw new Error('User not authenticated');
        await ref.doc(id).update({ ...updates, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    },

    async deleteActivity(date, id) {
        const ref = this.getActivitiesRef(date);
        if (!ref) throw new Error('User not authenticated');
        await ref.doc(id).delete();
    },

    async getTotalMinutes(date) {
        const activities = await this.getActivities(date);
        return activities.reduce((s, a) => s + (a.duration || 0), 0);
    },

    subscribeToActivities(date, callback) {
        const ref = this.getActivitiesRef(date);
        if (!ref) return () => {};
        return ref.orderBy('createdAt', 'desc').onSnapshot(snap => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(items);
        }, err => console.error('subscribe error', err));
    },

    // Utility: ensure user doc exists (call after signup/signin if needed)
    async ensureUserDoc(user) {
        if (!user) return;
        const uRef = db.collection('users').doc(user.uid);
        await uRef.set({
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
};
