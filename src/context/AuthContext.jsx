import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../store/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => sessionStorage.getItem('ce_wms_token'));
    const [loading, setLoading] = useState(true);

    // On mount, verify token
    useEffect(() => {
        if (token) {
            api.setAuthToken(token);
            api.fetchMe()
                .then(data => {
                    setUser(data.user);
                    setLoading(false);
                })
                .catch(() => {
                    // Token invalid/expired
                    sessionStorage.removeItem('ce_wms_token');
                    setToken(null);
                    api.setAuthToken(null);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await api.loginUser(email, password);
        // `data.token` is returned for mobile (Capacitor WebView) where cross-origin
        // httpOnly cookies are blocked. The web version relies on the cookie automatically.
        if (data.token) {
            sessionStorage.setItem('ce_wms_token', data.token);
            api.setAuthToken(data.token);
            setToken(data.token);
        }
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logoutUser();
        } catch (e) {
            console.error('Logout error', e);
        }
        sessionStorage.removeItem('ce_wms_token');
        localStorage.removeItem('ce_wms_token'); // Clear legacy token if someone still has it cached
        api.setAuthToken(null);
        setToken(null);
        setUser(null);
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default AuthContext;
