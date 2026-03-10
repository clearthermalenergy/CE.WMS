import { useState, useEffect, useCallback } from 'react';
import { store } from '../store/data';

export function useStore() {
    const [data, setData] = useState(store.getData());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = store.subscribe(setData);

        // Load data from API on mount
        store.init()
            .then(() => setLoading(false))
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });

        return unsubscribe;
    }, []);

    const update = useCallback((updater) => {
        store.setData(updater);
    }, []);

    return { data, loading, error, update, store };
}

export function useNotifications() {
    const { data } = useStore();
    const unread = data.notifications.filter(n => !n.read);
    return {
        notifications: data.notifications,
        unread,
        unreadCount: unread.length,
        markRead: (id) => store.markNotificationRead(id),
        markAllRead: () => store.markAllNotificationsRead(),
    };
}
