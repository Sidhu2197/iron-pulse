import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { token, user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', color: 'var(--text-muted)', fontSize: 'var(--font-lg)',
            }}>
                Loading...
            </div>
        );
    }

    if (!token && !user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
