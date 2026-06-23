import { useState } from 'react';
import { Link } from 'react-router-dom';
import { validateEmail, getEmailValidationStatus } from '../utils/emailValidation';
import './Auth.css';

const API_BASE = '/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailValidation, setEmailValidation] = useState({ status: 'empty', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
            setError(emailCheck.message);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (data.success) {
                setSent(true);
            } else {
                setError(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setError('Unable to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        setSent(false);
        setError('');
    };

    // State 2: Check your inbox
    if (sent) {
        return (
            <div className="auth-page">
                <div className="auth-header">
                    <div className="auth-icon inbox-icon">✉️</div>
                    <h1>Check Your Inbox</h1>
                    <p>We've sent a password reset link to</p>
                </div>

                <div className="glass-card auth-form inbox-card">
                    <div className="inbox-email">{email}</div>
                    <div className="inbox-info">
                        <div className="inbox-info-item">
                            <span className="inbox-info-icon">⏱</span>
                            <span>Link expires in <strong>30 minutes</strong></span>
                        </div>
                        <div className="inbox-info-item">
                            <span className="inbox-info-icon">📧</span>
                            <span>Check spam folder if you don't see it</span>
                        </div>
                    </div>

                    <button className="auth-submit resend-btn" onClick={handleResend}>
                        Resend Email <span>↻</span>
                    </button>

                    <p className="auth-footer">
                        <Link to="/login">← Back to Login</Link>
                    </p>
                </div>
            </div>
        );
    }

    // State 1: Email input
    return (
        <div className="auth-page">
            <div className="auth-header">
                <div className="auth-icon">🔑</div>
                <h1>Reset Password</h1>
                <p>Enter your email to receive a reset link</p>
            </div>

            <form className="glass-card auth-form" onSubmit={handleSubmit}>
                {error && <div className="auth-error">{error}</div>}

                <div className="input-group">
                    <label htmlFor="fp-email">Email</label>
                    <div className="input-field">
                        <span className="icon">✉</span>
                        <input
                            id="fp-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailValidation(getEmailValidationStatus(e.target.value));
                            }}
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

                <button className="auth-submit" type="submit" disabled={loading}>
                    {loading ? 'Sending…' : 'Continue'} <span>→</span>
                </button>

                <p className="auth-footer">
                    Remember your password? <Link to="/login">Log In</Link>
                </p>
            </form>
        </div>
    );
}
