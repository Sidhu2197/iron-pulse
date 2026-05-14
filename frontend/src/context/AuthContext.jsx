import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchProfile, SESSION_AUTH } from '../api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY_CREDS = 'auth_credentials';
const STORAGE_KEY_USER = 'auth_user';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [loading, setLoading] = useState(true);
    const justLoggedIn = useRef(false);

    useEffect(() => {
        let active = true;
        setLoading(true);

        // 1. Try to restore Basic Auth credentials from sessionStorage
        const savedCreds = sessionStorage.getItem(STORAGE_KEY_CREDS);
        const savedUser = sessionStorage.getItem(STORAGE_KEY_USER);

        if (savedCreds && savedCreds !== SESSION_AUTH && savedUser) {
            // Restore Basic Auth session
            const parsed = JSON.parse(savedUser);
            setCredentials(savedCreds);
            setUser(parsed);
            // Verify the credentials are still valid
            fetchProfile(savedCreds)
                .then((data) => {
                    if (!active) return;
                    setUser(data);
                })
                .catch(() => {
                    if (!active) return;
                    // Credentials are invalid — clear everything
                    sessionStorage.removeItem(STORAGE_KEY_CREDS);
                    sessionStorage.removeItem(STORAGE_KEY_USER);
                    setCredentials(null);
                    setUser(null);
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        } else {
            // No saved credentials
            setCredentials(null);
            setUser(null);
            setLoading(false);
        }

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (credentials && credentials !== SESSION_AUTH) {
            if (justLoggedIn.current) {
                justLoggedIn.current = false;
                return;
            }
            setLoading(true);
            fetchProfile(credentials)
                .then((data) => {
                    setUser(data);
                    setLoading(false);
                })
                .catch(() => {
                    setCredentials(null);
                    setUser(null);
                    sessionStorage.removeItem(STORAGE_KEY_CREDS);
                    sessionStorage.removeItem(STORAGE_KEY_USER);
                    setLoading(false);
                });
        }
    }, [credentials]);

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
