import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Silk from '../components/Silk';
import AccessibleButton from '../components/AccessibleButton';
import { Lock as Lock, Check as Check, X as X, WarningCircle as AlertCircle, Eye as Eye, EyeClosed as EyeOff } from '@phosphor-icons/react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '/api' : 'https://iron-pulse-backend.onrender.com/api');

function FloatingGlows() {
    const glows = [
        { color: 'rgba(124, 58, 237, 0.12)', size: 120, top: '15%', right: '10%', delay: '0s', duration: '10s' },
        { color: 'rgba(0, 240, 255, 0.10)', size: 90, top: '55%', left: '8%', delay: '2s', duration: '12s' },
        { color: 'rgba(236, 72, 153, 0.08)', size: 70, bottom: '20%', right: '25%', delay: '4s', duration: '11s' }
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
                        zIndex: 0
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [hadError, setHadError] = useState({});
    const [liveAnnouncement, setLiveAnnouncement] = useState('');

    const passRef = useRef(null);
    const confirmRef = useRef(null);

    const checks = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?"':{}|<>]/.test(newPassword),
        match: newPassword.length > 0 && newPassword === confirmPassword
    };

    const passedCount = Object.entries(checks).filter(
        ([key, value]) => key !== 'match' && value
    ).length;

    const allValid =
        checks.length &&
        checks.uppercase &&
        checks.lowercase &&
        checks.number &&
        checks.special &&
        checks.match;

    const strengthPercent = (passedCount / 5) * 100;

    const strengthColor =
        passedCount <= 2 ? '#ef4444' :
        passedCount === 3 ? '#f59e0b' :
        passedCount === 4 ? '#00f0ff' :
        '#10b981';

    const strengthLabel =
        passedCount <= 2 ? 'Weak' :
        passedCount === 3 ? 'Fair' :
        passedCount === 4 ? 'Good' :
        'Strong';

    const isPassValid =
        checks.length &&
        checks.uppercase &&
        checks.lowercase &&
        checks.number &&
        checks.special;

    const isPassInvalid =
        (submitted || newPassword.length > 0) && !isPassValid;

    const isConfirmValid = checks.match;

    const isConfirmInvalid =
        (submitted || confirmPassword.length > 0) && !checks.match;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitted(true);

        if (!token) {
            setError('Reset token is missing. Please use the link from your email.');
            return;
        }

        const newHadError = { ...hadError };

        if (!isPassValid) {
            newHadError.newPassword = true;
            setHadError(newHadError);
            setError('Please meet all password complexity requirements.');
            setLiveAnnouncement('Password complexity requirements not met.');

            if (passRef.current) {
                passRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                passRef.current.focus();
            }

            return;
        }

        if (!checks.match) {
            newHadError.confirmPassword = true;
            setHadError(newHadError);
            setError('Passwords do not match.');
            setLiveAnnouncement('Passwords do not match.');

            if (confirmRef.current) {
                confirmRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                confirmRef.current.focus();
            }

            return;
        }

        setLoading(true);
        setLiveAnnouncement('Submitting password reset...');

        try {
            const response = await fetch(`${API_BASE}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ token, newPassword })
            });

            const responseText = await response.text();

            let data = {};

            if (responseText.trim()) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        `The server returned an invalid response (HTTP ${response.status}). Please try again.`
                    );
                }
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    `Password reset failed (HTTP ${response.status}).`
                );
            }

            if (data.success === true) {
                setSuccess(
                    data.message || 'Password reset successfully!'
                );
                setLiveAnnouncement(
                    'Password reset successfully. Redirecting to login.'
                );

                setTimeout(() => navigate('/login'), 2500);
            } else {
                setError(
                    data.message ||
                    'The server did not confirm the password reset. Please try again.'
                );
                setLiveAnnouncement(
                    data.message || 'Password reset was not confirmed.'
                );
            }
        } catch (err) {
            console.error('Password reset request failed:', err);

            setError(
                err.message === 'Failed to fetch'
                    ? 'Unable to reach the backend. Check the connection and CORS settings.'
                    : err.message || 'Unable to reset password. Please try again.'
            );

            setLiveAnnouncement(
                err.message || 'Unable to reset password.'
            );
        } finally {
            setLoading(false);
        }
    };

    const iconStyle = (field) => {
        const isInvalid =
            field === 'newPassword' ? isPassInvalid : isConfirmInvalid;

        const isValid =
            field === 'newPassword' ? isPassValid : isConfirmValid;

        let color = '#64748b';

        if (isInvalid) color = '#ef4444';
        else if (isValid && hadError[field]) color = '#10b981';
        else if (focusedField === field) color = '#00f0ff';

        return {
            position: 'absolute',
            left: '14px',
            color,
            transition: 'color 0.25s ease',
            pointerEvents: 'none',
            zIndex: 2
        };
    };

    const inputStyle = (field) => {
        const isInvalid =
            field === 'newPassword' ? isPassInvalid : isConfirmInvalid;

        const isValid =
            field === 'newPassword' ? isPassValid : isConfirmValid;

        let borderColor = 'rgba(255, 255, 255, 0.09)';
        let shadow = 'none';

        if (isInvalid) {
            borderColor = '#ef4444';
            shadow = '0 0 12px rgba(239, 68, 68, 0.4)';
        } else if (isValid && hadError[field]) {
            borderColor = '#10b981';
            shadow = '0 0 12px rgba(16, 185, 129, 0.4)';
        } else if (focusedField === field) {
            borderColor = 'rgba(0, 240, 255, 0.45)';
            shadow = 'var(--shadow-glow-cyan)';
        }

        return {
            width: '100%',
            padding: '13px 16px 13px 44px',
            background: 'var(--bg-input)',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            outline: 'none',
            transition: 'all 0.25s ease',
            boxShadow: shadow
        };
    };

    const labelStyle = {
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        color: '#8f9bb3',
        fontSize: '0.75rem',
        letterSpacing: '0.06em'
    };

    const checklistRules = [
        { key: 'length', label: 'At least 8 characters', passed: checks.length },
        { key: 'uppercase', label: 'One uppercase letter', passed: checks.uppercase },
        { key: 'lowercase', label: 'One lowercase letter', passed: checks.lowercase },
        { key: 'number', label: 'One number', passed: checks.number },
        { key: 'special', label: 'One special character', passed: checks.special }
    ];

    return (
        <div className="auth-page page-enter">
            <Silk
                speed={5}
                scale={1}
                color="#7B7481"
                noiseIntensity={1.5}
                rotation={0}
            />

            <FloatingGlows />

            <div
                className="auth-header"
                style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 2
                }}
            >
                <div className="auth-icon">
                    <Lock size={22} />
                </div>

                <h1
                    style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        background: 'var(--gradient-hero-text)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        marginBottom: '0.5rem'
                    }}
                >
                    Set New Password
                </h1>

                <p
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9375rem'
                    }}
                >
                    Create a strong password for your account
                </p>
            </div>

            <form
                noValidate
                className="glass-panel"
                onSubmit={handleSubmit}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '2rem',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                }}
            >
                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                >
                    {liveAnnouncement}
                </div>

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

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem'
                    }}
                >
                    <label htmlFor="rp-new-pw" style={labelStyle}>
                        New Password
                    </label>

                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Lock size={18} style={iconStyle('newPassword')} />

                        <input
                            ref={passRef}
                            id="rp-new-pw"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onFocus={() => {
                                setFocusedField('newPassword');
                                setIsPasswordFocused(true);
                            }}
                            onBlur={() => {
                                setFocusedField(null);
                                setIsPasswordFocused(false);
                            }}
                            style={{
                                ...inputStyle('newPassword'),
                                paddingRight: '44px'
                            }}
                            aria-invalid={isPassInvalid}
                            required
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                            style={{
                                position: 'absolute',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                color: '#8f9bb3',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                zIndex: 3
                            }}
                        >
                            {showPassword
                                ? <EyeOff size={18} />
                                : <Eye size={18} />}
                        </button>
                    </div>

                    {(isPasswordFocused || newPassword.length > 0) && (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '0.375rem'
                                }}
                            >
                                <div
                                    className="password-strength-bar"
                                    style={{
                                        flex: 1,
                                        marginRight: '12px'
                                    }}
                                >
                                    <div
                                        className="password-strength-bar-fill"
                                        style={{
                                            width: `${strengthPercent}%`,
                                            background: strengthColor
                                        }}
                                    />
                                </div>

                                <span
                                    style={{
                                        fontSize: '0.6875rem',
                                        fontFamily: 'var(--font-mono)',
                                        color: strengthColor,
                                        fontWeight: 600,
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                        flexShrink: 0
                                    }}
                                >
                                    {newPassword.length > 0
                                        ? strengthLabel
                                        : ''}
                                </span>
                            </div>

                            <ul className="password-requirements">
                                {checklistRules.map((rule) => (
                                    <li
                                        key={rule.key}
                                        className={rule.passed ? 'valid' : ''}
                                    >
                                        <span className="check">
                                            {rule.passed
                                                ? <Check
                                                    size={14}
                                                    style={{ color: '#10b981' }}
                                                />
                                                : <X
                                                    size={14}
                                                    style={{ color: '#64748b' }}
                                                />}
                                        </span>
                                        {rule.label}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem'
                    }}
                >
                    <label htmlFor="rp-confirm-pw" style={labelStyle}>
                        Confirm Password
                    </label>

                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Lock size={18} style={iconStyle('confirmPassword')} />

                        <input
                            ref={confirmRef}
                            id="rp-confirm-pw"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setSubmitted(false); }}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField(null)}
                            style={{
                                ...inputStyle('confirmPassword'),
                                paddingRight: '44px'
                            }}
                            aria-invalid={isConfirmInvalid}
                            required
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? 'Hide password'
                                    : 'Show password'
                            }
                            style={{
                                position: 'absolute',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                color: '#8f9bb3',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                zIndex: 3
                            }}
                        >
                            {showConfirmPassword
                                ? <EyeOff size={18} />
                                : <Eye size={18} />}
                        </button>
                    </div>

                    {confirmPassword.length > 0 && !checks.match && (
                        <span
                            style={{
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <X size={12} />
                            Passwords do not match
                        </span>
                    )}

                    {checks.match && (
                        <span
                            style={{
                                color: '#10b981',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <Check size={12} />
                            Passwords match
                        </span>
                    )}
                </div>

                <AccessibleButton
                    className="btn-futuristic"
                    type="submit"
                    disabled={loading || !allValid || !!success}
                    disabledReason={
                        !allValid
                            ? 'Meet all password requirements and ensure passwords match before resetting.'
                            : 'Resetting password...'
                    }
                    style={{
                        width: '100%',
                        marginTop: '0.5rem'
                    }}
                >
                    {loading
                        ? 'Resetting…'
                        : success
                            ? 'Redirecting…'
                            : 'Reset Password'} <span>→</span>
                </AccessibleButton>

                <p className="auth-footer">
                    <Link to="/login">← Back to Login</Link>
                </p>
            </form>
        </div>
    );
}
