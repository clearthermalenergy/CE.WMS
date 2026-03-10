import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../store/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('ce_wms_token'));
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
                    localStorage.removeItem('ce_wms_token');
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
        localStorage.setItem('ce_wms_token', data.token);
        api.setAuthToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('ce_wms_token');
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
