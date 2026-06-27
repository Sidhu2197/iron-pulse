import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Auth.css';
import { Lock } from 'lucide-react';

const API_BASE = '/api';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Password validation checks
    const checks = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        match: newPassword.length > 0 && newPassword === confirmPassword,
    };
    const allValid = checks.length && checks.uppercase && checks.number && checks.special && checks.match;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!allValid) {
            setError('Please meet all password requirements.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(data.message || 'Password reset successfully!');
                setTimeout(() => navigate('/login'), 2500);
            } else {
                setError(data.message || 'Reset failed. Please try again.');
            }
        } catch {
            setError('Unable to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-header">
                <div className="auth-icon" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}><Lock size={20} /></div>
                <h1>Set New Password</h1>
                <p>Create a strong password for your account</p>
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
                {success && (
                    <div className="auth-success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        {success}
                    </div>
                )}

                <div className="input-group">
                    <label htmlFor="rp-new-pw">New Password</label>
                    <div className="input-field">
                        <span className="icon"><Lock size={20} /></span>
                        <input
                            id="rp-new-pw"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={!!success}
                        />
                    </div>
                    {newPassword.length > 0 && (
                        <ul className="password-requirements">
                            <li className={checks.length ? 'valid' : ''}>
                                <span className="check">{checks.length ? '✓' : '○'}</span> At least 8 characters
                            </li>
                            <li className={checks.uppercase ? 'valid' : ''}>
                                <span className="check">{checks.uppercase ? '✓' : '○'}</span> One uppercase letter
                            </li>
                            <li className={checks.number ? 'valid' : ''}>
                                <span className="check">{checks.number ? '✓' : '○'}</span> One number
                            </li>
                            <li className={checks.special ? 'valid' : ''}>
                                <span className="check">{checks.special ? '✓' : '○'}</span> One special character
                            </li>
                        </ul>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="rp-confirm-pw">Confirm Password</label>
                    <div className="input-field">
                        <span className="icon"><Lock size={20} /></span>
                        <input
                            id="rp-confirm-pw"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={!!success}
                        />
                    </div>
                    {confirmPassword.length > 0 && !checks.match && (
                        <span style={{ color: '#ef4444', fontSize: 'var(--font-xs)' }}>Passwords do not match</span>
                    )}
                </div>

                <button className="auth-submit" type="submit" disabled={loading || !allValid || !!success}>
                    {loading ? 'Resetting…' : success ? 'Redirecting…' : 'Reset Password'} <span>→</span>
                </button>

                <p className="auth-footer">
                    <Link to="/login">← Back to Login</Link>
                </p>
            </form>
        </div>
    );
}
