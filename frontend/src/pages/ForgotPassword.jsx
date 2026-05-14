import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validateEmail, getEmailValidationStatus } from '../utils/emailValidation';
import './Auth.css';

const API_BASE = '/api';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1 = enter email, 2 = answer question, 3 = new password
    const [email, setEmail] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailValidation, setEmailValidation] = useState({ status: 'empty', message: '' });
    const navigate = useNavigate();

    // Step 1: Verify email and get security question
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
            setError(emailCheck.message);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/forgot-password/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setSecurityQuestion(data.securityQuestion);
                setStep(2);
            } else {
                setError(data.message || 'No account found with this email.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2 & 3: Submit answer + new password
    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, securityAnswer, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(data.message || 'Password reset successfully!');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message || 'Reset failed. Check your security answer.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-header">
                <div className="auth-icon">🔑</div>
                <h1>Reset Password</h1>
                <p>
                    {step === 1 && 'Enter your email to get started'}
                    {step === 2 && 'Answer your security question'}
                </p>
            </div>

            {step === 1 && (
                <form className="glass-card auth-form" onSubmit={handleEmailSubmit}>
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
                        {loading ? 'Verifying…' : 'Continue'} <span>→</span>
                    </button>

                    <p className="auth-footer">
                        Remember your password? <Link to="/login">Log In</Link>
                    </p>
                </form>
            )}

            {step === 2 && (
                <form className="glass-card auth-form" onSubmit={handleResetSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    {success && (
                        <div className="auth-error" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}>
                            {success}
                        </div>
                    )}

                    <div className="input-group">
                        <label>Security Question</label>
                        <div className="input-field" style={{ opacity: 0.7, cursor: 'default' }}>
                            <span className="icon">❓</span>
                            <input type="text" value={securityQuestion} disabled />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="fp-answer">Your Answer</label>
                        <div className="input-field">
                            <span className="icon">💬</span>
                            <input
                                id="fp-answer"
                                type="text"
                                placeholder="Enter your answer"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="fp-new-pw">New Password</label>
                        <div className="input-field">
                            <span className="icon">🔒</span>
                            <input
                                id="fp-new-pw"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="fp-confirm-pw">Confirm Password</label>
                        <div className="input-field">
                            <span className="icon">🔒</span>
                            <input
                                id="fp-confirm-pw"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button className="auth-submit" type="submit" disabled={loading || !!success}>
                        {loading ? 'Resetting…' : 'Reset Password'} <span>→</span>
                    </button>

                    <p className="auth-footer">
                        <Link to="/login">← Back to Login</Link>
                    </p>
                </form>
            )}
        </div>
    );
}
