import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, resendVerificationEmail } from '../api/auth';
import Silk from '../components/Silk';
import AccessibleButton from '../components/AccessibleButton';
import { Flame, Mail, Lock, AlertCircle, Check, RefreshCw } from 'lucide-react';

/* ── Inline Google SVG logo ───────────────────────────────── */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/* ── Floating ambient glow circles ────────────────────────── */
function FloatingGlows() {
  const glows = [
    { color: 'rgba(0, 240, 255, 0.15)', size: 120, top: '15%', left: '8%', delay: '0s', duration: '8s' },
    { color: 'rgba(124, 58, 237, 0.12)', size: 100, top: '70%', right: '10%', delay: '2s', duration: '10s' },
    { color: 'rgba(236, 72, 153, 0.1)', size: 80, top: '40%', left: '75%', delay: '4s', duration: '12s' },
    { color: 'rgba(0, 240, 255, 0.08)', size: 60, bottom: '20%', left: '20%', delay: '1s', duration: '9s' },
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [submitted, setSubmitted] = useState(false);
  const [hadError, setHadError] = useState({});

  const getFieldState = (field) => {
    let isInvalid = false;
    let isValid = false;

    if (field === 'email') {
      isValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      isInvalid = (submitted || email.length > 0) && !isValid;
    } else if (field === 'password') {
      isValid = password.length >= 6;
      isInvalid = (submitted || password.length > 0) && !isValid;
    }

    if (isInvalid) return 'invalid';
    if (isValid && hadError[field]) return 'valid'; // Only green if previously red/error
    return 'neutral';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setSubmitted(true);

    const invalidFields = [];
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      invalidFields.push({ name: 'email', ref: emailRef, msg: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      invalidFields.push({ name: 'password', ref: passwordRef, msg: 'Password is required (min 6 characters).' });
    }

    if (invalidFields.length > 0) {
      const newHadError = { ...hadError };
      invalidFields.forEach(item => { newHadError[item.name] = true; });
      setHadError(newHadError);

      const first = invalidFields[0];
      setError(first.msg);
      setLiveAnnouncement(`Form has ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Focused on ${first.name}.`);
      if (first.ref && first.ref.current) {
        first.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first.ref.current.focus();
      }
      return;
    }

    setLoading(true);
    setLiveAnnouncement('Submitting credentials, please wait...');
    try {
      const data = await loginUser({ email, password });
      login(data.credentials, data.user);
      setLiveAnnouncement('Login successful. Redirecting to dashboard.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setLiveAnnouncement(`Login failed: ${err.message}`);
      if (emailRef.current) {
        emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    try {
      const data = await resendVerificationEmail(email);
      setResendSuccess(data.message || 'Verification email sent! Check your inbox.');
      setLiveAnnouncement('Verification email sent successfully.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email');
      setLiveAnnouncement(`Resend failed: ${err.message}`);
    } finally {
      setResendLoading(false);
    }
  };

  /* ── Styles ───────────────────────────────────────────── */
  const inputWrapperStyle = (focused) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  });

  const iconStyle = (field) => {
    const state = getFieldState(field);
    let color = '#64748b';
    if (state === 'invalid') color = '#ef4444';
    else if (state === 'valid') color = '#10b981';
    else if ((field === 'email' && emailFocused) || (field === 'password' && passwordFocused)) color = '#00f0ff';

    return {
      position: 'absolute',
      left: '14px',
      color: color,
      transition: 'color 0.25s ease',
      pointerEvents: 'none',
      zIndex: 2,
    };
  };

  const inputStyle = (field) => {
    const state = getFieldState(field);
    let borderColor = 'rgba(255, 255, 255, 0.09)';
    let shadow = 'none';

    if (state === 'invalid') {
      borderColor = '#ef4444';
      shadow = '0 0 12px rgba(239, 68, 68, 0.4)';
    } else if (state === 'valid') {
      borderColor = '#10b981';
      shadow = '0 0 12px rgba(16, 185, 129, 0.4)';
    } else if ((field === 'email' && emailFocused) || (field === 'password' && passwordFocused)) {
      borderColor = 'rgba(0, 240, 255, 0.45)';
      shadow = '0 0 20px rgba(0, 240, 255, 0.12), 0 0 60px rgba(0, 240, 255, 0.05)';
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

  return (
    <>
      {/* Background layers */}
      <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
      <FloatingGlows />

      <div className="auth-page page-enter">
      {/* Header */}
      <div className="auth-header" style={{ flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.75rem' }}>
          <Flame size={28} style={{ color: '#00f0ff', filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.4))' }} />
        </div>
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
          Welcome Back
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Log in to continue your fitness journey
        </p>
      </div>

      {/* Form card */}
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

        {/* Error */}
        {error && (
          <div className="auth-error" style={{ flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
            {error.toLowerCase().includes('verify') && (
              <AccessibleButton
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                disabledReason="Resending verification email..."
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: resendLoading ? 0.6 : 1,
                }}
              >
                <RefreshCw size={12} className={resendLoading ? 'animate-spin' : ''} />
                {resendLoading ? 'Sending link…' : 'Resend Email Verification'}
              </AccessibleButton>
            )}
          </div>
        )}
        {resendSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={16} />
            {resendSuccess}
          </div>
        )}

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="login-email" style={labelStyle}>Email Address</label>
          <div style={inputWrapperStyle(emailFocused)}>
            <Mail size={18} style={iconStyle('email')} />
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={inputStyle('email')}
              aria-invalid={getFieldState('email') === 'invalid'}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="login-password" style={labelStyle}>Password</label>
          <div style={inputWrapperStyle(passwordFocused)}>
            <Lock size={18} style={iconStyle('password')} />
            <input
              ref={passwordRef}
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={inputStyle('password')}
              aria-invalid={getFieldState('password') === 'invalid'}
              required
            />
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <AccessibleButton
          className="btn-futuristic"
          type="submit"
          disabled={loading}
          disabledReason="Logging in..."
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? 'Logging in…' : 'Log In'} <span>→</span>
        </AccessibleButton>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            or
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Google Auth */}
        <a href="/oauth2/authorization/google" className="btn-google" style={{ textDecoration: 'none' }}>
          <GoogleLogo />
          Continue with Google
        </a>

        {/* Footer */}
        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </form>
    </div>
    </>
  );
}
