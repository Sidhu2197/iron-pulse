import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Silk from '../components/Silk';
import { Lock, Check, X, AlertCircle } from 'lucide-react';

const API_BASE = '/api';

/* ── Floating ambient glow circles ────────────────────────── */
function FloatingGlows() {
    const glows = [
        { color: 'rgba(124, 58, 237, 0.12)', size: 120, top: '15%', right: '10%', delay: '0s', duration: '10s' },
        { color: 'rgba(0, 240, 255, 0.10)', size: 90, top: '55%', left: '8%', delay: '2s', duration: '12s' },
        { color: 'rgba(236, 72, 153, 0.08)', size: 70, bottom: '20%', right: '25%', delay: '4s', duration: '11s' },
    ];

    return (
        <>
            {glows.map((g, i) => (
                <div
                    key={i}
                    style={{
                        position: 'fixed',
                        width: g.size,
                        height: g.size,
                        borderRadius: '50%',
                        background: g.color,
                        filter: 'blur(30px)',
                        top: g.top,
                        left: g.left,
                        right: g.right,
                        bottom: g.bottom,
                        animation: `floatGlow ${g.duration} ease-in-out ${g.delay} infinite`,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />
            ))}
        </>
    );
}

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Password validation checks
    const checks = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?"':{}|<>]/.test(newPassword),
        match: newPassword.length > 0 && newPassword === confirmPassword,
    };
    const passedCount = Object.entries(checks).filter(([k, v]) => k !== 'match' && v).length;
    const allValid = checks.length && checks.uppercase && checks.number && checks.special && checks.match;

    /* ── Strength bar ────────────────────────────────────── */
    const strengthPercent = (passedCount / 5) * 100;
    const strengthColor =
        passedCount <= 1 ? '#ef4444' :
        passedCount <= 2 ? '#ef4444' :
        passedCount <= 3 ? '#f59e0b' :
        passedCount <= 4 ? '#00f0ff' :
        '#10b981';
    const strengthLabel =
        passedCount <= 1 ? 'Weak' :
        passedCount <= 2 ? 'Weak' :
        passedCount <= 3 ? 'Fair' :
        passedCount <= 4 ? 'Good' :
        'Strong';

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

    /* ── Input styles ───────────────────────────────────── */
    const iconStyle = (field) => ({
        position: 'absolute',
        left: '14px',
        color: focusedField === field ? '#00f0ff' : '#64748b',
        transition: 'color 0.25s ease',
        pointerEvents: 'none',
        zIndex: 2,
    });

    const inputStyle = (field) => ({
        width: '100%',
        padding: '13px 16px 13px 44px',
        background: 'var(--bg-input)',
        border: `1px solid ${focusedField === field ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 255, 255, 0.09)'}`,
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9375rem',
        outline: 'none',
        transition: 'all 0.25s ease',
        boxShadow: focusedField === field ? 'var(--shadow-glow-cyan)' : 'none',
    });

    const labelStyle = {
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        color: '#8f9bb3',
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
    };

    const checklistRules = [
        { key: 'length', label: 'At least 8 characters', passed: checks.length },
        { key: 'uppercase', label: 'One uppercase letter', passed: checks.uppercase },
        { key: 'lowercase', label: 'One lowercase letter', passed: checks.lowercase },
        { key: 'number', label: 'One number', passed: checks.number },
        { key: 'special', label: 'One special character', passed: checks.special },
    ];

    return (
        <div className="auth-page page-enter">
            <Silk color="#7c3aed" speed={0.3} scale={3.5} />
            <FloatingGlows />

            <div className="auth-header" style={{ flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div className="auth-icon"><Lock size={22} /></div>
                <h1
                    style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        background: 'var(--gradient-hero-text)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        marginBottom: '0.5rem',
                    }}
                >
                    Set New Password
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    Create a strong password for your account
                </p>
            </div>

            <form
                className="glass-panel"
                onSubmit={handleSubmit}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '2rem',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                }}
            >
                {error && (
                    <div className="auth-error">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="auth-success">
                        <Check size={16} />
                        {success}
                    </div>
                )}

                {/* New Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label htmlFor="rp-new-pw" style={labelStyle}>New Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Lock size={18} style={iconStyle('newPassword')} />
                        <input
                            id="rp-new-pw"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onFocus={() => { setFocusedField('newPassword'); setIsPasswordFocused(true); }}
                            onBlur={() => { setFocusedField(null); setIsPasswordFocused(false); }}
                            style={inputStyle('newPassword')}
                            required
                            disabled={!!success}
                        />
                    </div>

                    {/* Strength bar + checklist */}
                    {(isPasswordFocused || newPassword.length > 0) && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.375rem' }}>
                                <div className="password-strength-bar" style={{ flex: 1, marginRight: '12px' }}>
                                    <div
                                        className="password-strength-bar-fill"
                                        style={{
                                            width: `${strengthPercent}%`,
                                            background: strengthColor,
                                        }}
                                    />
                                </div>
                                <span style={{
                                    fontSize: '0.6875rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: strengthColor,
                                    fontWeight: 600,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    flexShrink: 0,
                                }}>
                                    {newPassword.length > 0 ? strengthLabel : ''}
                                </span>
                            </div>

                            <ul className="password-requirements">
                                {checklistRules.map((rule) => (
                                    <li key={rule.key} className={rule.passed ? 'valid' : ''}>
                                        <span className="check">
                                            {rule.passed
                                                ? <Check size={14} style={{ color: '#10b981' }} />
                                                : <X size={14} style={{ color: '#64748b' }} />
                                            }
                                        </span>
                                        {rule.label}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                {/* Confirm Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label htmlFor="rp-confirm-pw" style={labelStyle}>Confirm Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Lock size={18} style={iconStyle('confirmPassword')} />
                        <input
                            id="rp-confirm-pw"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField(null)}
                            style={inputStyle('confirmPassword')}
                            required
                            disabled={!!success}
                        />
                    </div>
                    {confirmPassword.length > 0 && !checks.match && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <X size={12} /> Passwords do not match
                        </span>
                    )}
                    {checks.match && (
                        <span style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> Passwords match
                        </span>
                    )}
                </div>

                <button
                    className="btn-futuristic"
                    type="submit"
                    disabled={loading || !allValid || !!success}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                >
                    {loading ? 'Resetting…' : success ? 'Redirecting…' : 'Reset Password'} <span>→</span>
                </button>

                <p className="auth-footer">
                    <Link to="/login">← Back to Login</Link>
                </p>
            </form>
        </div>
    );
}
