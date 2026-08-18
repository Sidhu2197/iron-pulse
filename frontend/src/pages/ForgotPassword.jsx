import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { validateEmail, getEmailValidationStatus } from '../utils/emailValidation';
import Silk from '../components/Silk';
import AccessibleButton from '../components/AccessibleButton';
import { Timer, Mail, Key, Check, X } from 'lucide-react';

const API_BASE = '/api';

/* ── Floating ambient glow circles ────────────────────────── */
function FloatingGlows() {
    const glows = [
        { color: 'rgba(0, 240, 255, 0.12)', size: 110, top: '20%', left: '10%', delay: '0s', duration: '9s' },
        { color: 'rgba(124, 58, 237, 0.10)', size: 90, top: '60%', right: '12%', delay: '2s', duration: '11s' },
        { color: 'rgba(236, 72, 153, 0.08)', size: 70, bottom: '25%', left: '25%', delay: '3.5s', duration: '10s' },
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

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailValidation, setEmailValidation] = useState({ status: 'empty', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [hadError, setHadError] = useState(false);
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    const emailRef = useRef(null);

    const isEmailValid = emailValidation.status === 'valid';
    const isEmailInvalid = (submitted || email.length > 0) && emailValidation.status === 'invalid';
    const showGreen = isEmailValid && hadError; // Only green if previously red/error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitted(true);

        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
            setHadError(true);
            setError(emailCheck.message);
            setLiveAnnouncement(`Validation error: ${emailCheck.message}`);
            if (emailRef.current) {
                emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                emailRef.current.focus();
            }
            return;
        }

        setLoading(true);
        setLiveAnnouncement('Sending password reset email...');
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (data.success) {
                setSent(true);
                setLiveAnnouncement('Password reset email sent successfully.');
            } else {
                setHadError(true);
                setError(data.message || 'Something went wrong. Please try again.');
                setLiveAnnouncement(`Error: ${data.message || 'Something went wrong.'}`);
                if (emailRef.current) {
                    emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    emailRef.current.focus();
                }
            }
        } catch {
            setError('Unable to connect to server. Please try again.');
            setLiveAnnouncement('Error: Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        setSent(false);
        setError('');
    };

    /* ── Input styles ───────────────────────────────────── */
    const iconStyle = (focused) => {
        let color = '#64748b';
        if (isEmailInvalid) color = '#ef4444';
        else if (showGreen) color = '#10b981';
        else if (focused) color = '#00f0ff';

        return {
            position: 'absolute',
            left: '14px',
            color: color,
            transition: 'color 0.25s ease',
            pointerEvents: 'none',
            zIndex: 2,
        };
    };

    const inputStyle = (focused) => {
        let borderColor = 'rgba(255, 255, 255, 0.09)';
        let shadow = 'none';

        if (isEmailInvalid) {
            borderColor = '#ef4444';
            shadow = '0 0 12px rgba(239, 68, 68, 0.4)';
        } else if (showGreen) {
            borderColor = '#10b981';
            shadow = '0 0 12px rgba(16, 185, 129, 0.4)';
        } else if (focused) {
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
            boxShadow: shadow,
        };
    };

    const labelStyle = {
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        color: '#8f9bb3',
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
    };

    // State 2: Check your inbox
    if (sent) {
        return (
            <div className="auth-page page-enter">
                <Silk color="#10b981" speed={0.3} scale={3.5} />
                <FloatingGlows />

                <div className="auth-header" style={{ flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    <div className="auth-icon inbox-icon"><Mail size={22} /></div>
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
                        Check Your Inbox
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                        We've sent a password reset link to
                    </p>
                </div>

                <div className="glass-panel auth-form inbox-card" style={{ zIndex: 2 }}>
                    <div className="inbox-email">{email}</div>
                    <div className="inbox-info">
                        <div className="inbox-info-item">
                            <span className="inbox-info-icon"><Timer size={18} /></span>
                            <span>Link expires in <strong>30 minutes</strong></span>
                        </div>
                        <div className="inbox-info-item">
                            <span className="inbox-info-icon"><Mail size={18} /></span>
                            <span>Check spam folder if you don't see it</span>
                        </div>
                    </div>

                    <button className="btn-futuristic" onClick={handleResend} style={{ width: '100%' }}>
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
        <div className="auth-page page-enter">
            <Silk color="#00f0ff" speed={0.3} scale={3.5} />
            <FloatingGlows />

            <div className="auth-header" style={{ flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div className="auth-icon"><Key size={22} /></div>
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
                    Reset Password
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    Enter your email to receive a reset link
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
                    gap: '1.25rem',
                }}
            >
                <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                    {liveAnnouncement}
                </div>

                {error && (
                    <div className="auth-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label htmlFor="fp-email" style={labelStyle}>Email</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Mail size={18} style={iconStyle(emailFocused)} />
                        <input
                            ref={emailRef}
                            id="fp-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailValidation(getEmailValidationStatus(e.target.value));
                            }}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            style={inputStyle(emailFocused)}
                            aria-invalid={isEmailInvalid}
                            required
                        />
                    </div>
                    {email && (
                        <div className={`email-validation ${emailValidation.status}`}>
                            <span className="check">
                                {emailValidation.status === 'valid' ? <Check size={14} /> :
                                 emailValidation.status === 'invalid' ? <X size={14} /> : null}
                            </span>
                            {emailValidation.message}
                        </div>
                    )}
                </div>

                <AccessibleButton 
                    className="btn-futuristic" 
                    type="submit" 
                    disabled={loading || emailValidation.status !== 'valid'} 
                    disabledReason="Enter a valid email address to request password reset."
                    style={{ width: '100%' }}
                >
                    {loading ? 'Sending…' : 'Continue'} <span>→</span>
                </AccessibleButton>

                <p className="auth-footer">
                    Remember your password? <Link to="/login">Log In</Link>
                </p>
            </form>
        </div>
    );
}
