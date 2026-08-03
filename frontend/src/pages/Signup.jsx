import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../api/auth';
import { getEmailValidationStatus } from '../utils/emailValidation';
import Silk from '../components/Silk';
import {
  Flame, User, Mail, Lock, Cake,
  Check, X, AlertCircle,
} from 'lucide-react';

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
    { color: 'rgba(124, 58, 237, 0.15)', size: 130, top: '10%', right: '8%', delay: '0s', duration: '9s' },
    { color: 'rgba(0, 240, 255, 0.12)', size: 100, top: '60%', left: '5%', delay: '3s', duration: '11s' },
    { color: 'rgba(236, 72, 153, 0.1)', size: 90, bottom: '15%', right: '20%', delay: '1.5s', duration: '10s' },
    { color: 'rgba(0, 240, 255, 0.08)', size: 70, top: '35%', left: '70%', delay: '5s', duration: '13s' },
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

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', age: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ status: 'empty', message: '' });

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (field === 'email') {
      setEmailValidation(getEmailValidationStatus(e.target.value));
    }
  };

  /* ── Password validation (5 rules) ───────────────────── */
  const pw = form.password;
  const checks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const passwordsMatch = pw.length > 0 && pw === form.confirmPassword;

  const allValid =
    Object.values(checks).every(Boolean) &&
    passwordsMatch &&
    emailValidation.status === 'valid';

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
      setError('Please meet all password requirements');
      return;
    }
    if (!form.username.trim() || !form.age) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signupUser({
        username: form.username,
        email: form.email,
        password: form.password,
        age: form.age,
      });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Input styles ────────────────────────────────────── */
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
    <>
      {/* Background layers */}
      <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
      <FloatingGlows />

      <div className="auth-page page-enter">

      {/* Header */}
      <div className="auth-header" style={{ flexDirection: 'column', alignItems: 'center', zIndex: 2, marginBottom: '1.5rem' }}>
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
          Create Account
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Join thousands achieving their fitness goals
        </p>
      </div>

      {/* Form card */}
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
          gap: '1.125rem',
        }}
      >
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Username */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="signup-username" style={labelStyle}>Username</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <User size={18} style={iconStyle('username')} />
            <input
              id="signup-username" type="text" placeholder="johndoe"
              value={form.username} onChange={update('username')}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('username')}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="signup-email" style={labelStyle}>Email</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={18} style={iconStyle('email')} />
            <input
              id="signup-email" type="email" placeholder="you@example.com"
              value={form.email} onChange={update('email')}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('email')}
              required
            />
          </div>
          {form.email && (
            <div className={`email-validation ${emailValidation.status}`}>
              <span className="check">
                {emailValidation.status === 'valid' ? <Check size={14} /> :
                  emailValidation.status === 'invalid' ? <X size={14} /> : null}
              </span>
              {emailValidation.message}
            </div>
          )}
        </div>

        {/* Age */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="signup-age" style={labelStyle}>Age</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Cake size={18} style={iconStyle('age')} />
            <input
              id="signup-age" type="number" placeholder="25" min="10" max="120"
              value={form.age} onChange={update('age')}
              onFocus={() => setFocusedField('age')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('age')}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="signup-password" style={labelStyle}>Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={18} style={iconStyle('password')} />
            <input
              id="signup-password" type="password" placeholder="••••••••"
              value={form.password} onChange={update('password')}
              onFocus={() => { setFocusedField('password'); setIsPasswordFocused(true); }}
              onBlur={() => { setFocusedField(null); setIsPasswordFocused(false); }}
              style={inputStyle('password')}
              required
            />
          </div>

          {/* Strength bar */}
          {(isPasswordFocused || pw.length > 0) && (
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
                  {pw.length > 0 ? strengthLabel : ''}
                </span>
              </div>

              {/* Checklist */}
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
          <label htmlFor="signup-confirm" style={labelStyle}>Confirm Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={18} style={iconStyle('confirmPassword')} />
            <input
              id="signup-confirm" type="password" placeholder="••••••••"
              value={form.confirmPassword} onChange={update('confirmPassword')}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('confirmPassword')}
              required
            />
          </div>
          {form.confirmPassword.length > 0 && !passwordsMatch && (
            <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <X size={12} /> Passwords do not match
            </span>
          )}
          {passwordsMatch && (
            <span style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> Passwords match
            </span>
          )}
        </div>

        {/* Submit */}
        <button
          className="btn-futuristic"
          type="submit"
          disabled={loading || !allValid}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? 'Creating…' : 'Create Account'} <span>→</span>
        </button>

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
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </div>
    </>
  );
}
