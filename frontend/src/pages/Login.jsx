import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/auth';
import { validateEmail, getEmailValidationStatus } from '../utils/emailValidation';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailValidation, setEmailValidation] = useState({ status: 'empty', message: '' });
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        setEmailValidation(getEmailValidationStatus(value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validate email format before submitting
        const emailValidationResult = validateEmail(email);
        if (!emailValidationResult.isValid) {
            setError(emailValidationResult.message);
            return;
        }
        
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
        <div className="auth-page">
            <div className="auth-header">
                <div className="auth-icon">🔥</div>
                <h1>Welcome Back</h1>
                <p>Log in to continue your fitness journey</p>
            </div>

            <form className="glass-card auth-form" onSubmit={handleSubmit}>
                {error && <div className="auth-error">{error}</div>}

                <div className="input-group">
                    <label htmlFor="login-email">Email</label>
                    <div className="input-field">
                        <span className="icon">✉</span>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleEmailChange}
                            required
                        />
                    </div>
                    {email && (
                        <div className={`email-validation ${emailValidation.status}`}>
                            <span className="check">
                                {emailValidation.status === 'valid' ? '✓' : 
                                 emailValidation.status === 'invalid' ? '✗' : ''}
                            </span>
                            {emailValidation.message}
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="login-password">Password</label>
                    <div className="input-field">
                        <span className="icon">🔒</span>
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
        </div>
    );
}
