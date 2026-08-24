import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SESSION_AUTH } from '../api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY_CREDS = 'auth_credentials';
const STORAGE_KEY_USER = 'auth_user';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [loading, setLoading] = useState(true);
    const justLoggedIn = useRef(false);

    useEffect(() => {
        setLoading(true);

        // 1. Try to restore Basic Auth credentials from sessionStorage
        const savedCreds = sessionStorage.getItem(STORAGE_KEY_CREDS);
        const savedUser = sessionStorage.getItem(STORAGE_KEY_USER);

        if (savedCreds && savedCreds !== SESSION_AUTH && savedUser) {
            // Restore JWT session
            const parsed = JSON.parse(savedUser);
            setCredentials(savedCreds);
            setUser(parsed);
            setLoading(false);
        } else {
            // No saved credentials
            setCredentials(null);
            setUser(null);
            setLoading(false);
        }

        const handleAuthExpired = () => {
            sessionStorage.removeItem(STORAGE_KEY_CREDS);
            sessionStorage.removeItem(STORAGE_KEY_USER);
            setCredentials(null);
            setUser(null);
        };
        window.addEventListener('auth-expired', handleAuthExpired);

        return () => {
            window.removeEventListener('auth-expired', handleAuthExpired);
        };
    }, []);



    const login = (creds, userData) => {
        justLoggedIn.current = true;
        const effectiveCreds = creds || SESSION_AUTH;
        setCredentials(effectiveCreds);
        setUser(userData);

        // Persist to sessionStorage
        sessionStorage.setItem(STORAGE_KEY_CREDS, effectiveCreds);
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    };

    const logout = () => {
        setCredentials(null);
        setUser(null);
        sessionStorage.removeItem(STORAGE_KEY_CREDS);
        sessionStorage.removeItem(STORAGE_KEY_USER);
    };

    return (
        <AuthContext.Provider value={{ user, token: credentials, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
