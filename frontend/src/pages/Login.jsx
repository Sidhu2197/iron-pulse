import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/auth';
import './Auth.css';
import PageReveal from '../components/PageReveal';
import { Flame, Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        setLoading(true);
        try {
            const data = await loginUser({ email, password });
            login(data.credentials, data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageReveal className="auth-page">
            <div className="auth-header">
                <div className="auth-icon" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}><Flame size={20} /></div>
                <h1>Welcome Back</h1>
                <p>Log in to continue your fitness journey</p>
            </div>

            <form className="glass-card auth-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                <div className="input-group">
                    <label htmlFor="login-email">Email</label>
                    <div className="input-field">
                        <span className="icon"><Mail size={20} /></span>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleEmailChange}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="login-password">Password</label>
                    <div className="input-field">
                        <span className="icon"><Lock size={20} /></span>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="forgot-password">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>
                </div>

                <button className="auth-submit" type="submit" disabled={loading}>
                    {loading ? 'Logging in…' : 'Log In'} <span>→</span>
                </button>

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </form>
        </PageReveal>
    );
}
