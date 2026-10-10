import { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserProfile, logoutUser, SESSION_AUTH } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        // Remove JWTs saved by versions before HttpOnly cookie authentication.
        sessionStorage.removeItem('auth_credentials');
        sessionStorage.removeItem('auth_user');

        const handleAuthExpired = () => {
            setUser(null);
        };
        window.addEventListener('auth-expired', handleAuthExpired);

        const restoreSession = async () => {
            try {
                const profile = await fetchUserProfile();
                if (active) {
                    setUser(profile);
                }
            } catch {
                if (active) {
                    setUser(null);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        restoreSession();

        return () => {
            active = false;
            window.removeEventListener('auth-expired', handleAuthExpired);
        };
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token: user ? SESSION_AUTH : null, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
