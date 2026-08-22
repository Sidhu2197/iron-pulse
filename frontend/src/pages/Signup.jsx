import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../api/auth';
import { getEmailValidationStatus } from '../utils/emailValidation';
import Silk from '../components/Silk';
import AccessibleButton from '../components/AccessibleButton';
import {
  Flame, User, Mail, Lock, Cake,
  Check, X, AlertCircle, Eye, EyeOff
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ status: 'empty', message: '' });
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fieldRefs = {
    username: useRef(null),
    email: useRef(null),
    age: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

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

  const invalidAge = form.age !== '' && (Number(form.age) < 10 || Number(form.age) > 120);

  const [submitted, setSubmitted] = useState(false);
  const [hadError, setHadError] = useState({});

  const getFieldState = (field) => {
    let isInvalid = false;
    let isValid = false;

    if (field === 'username') {
      isValid = form.username.trim().length > 0;
      isInvalid = submitted && !isValid;
    } else if (field === 'email') {
      isValid = emailValidation.status === 'valid';
      isInvalid = (submitted || form.email.length > 0) && emailValidation.status === 'invalid';
    } else if (field === 'age') {
      isValid = form.age !== '' && !invalidAge;
      isInvalid = (submitted && !form.age) || invalidAge;
    } else if (field === 'password') {
      isValid = Object.values(checks).every(Boolean);
      isInvalid = (submitted || pw.length > 0) && !isValid;
    } else if (field === 'confirmPassword') {
      isValid = passwordsMatch;
      isInvalid = (submitted || form.confirmPassword.length > 0) && !isValid;
    }

    if (isInvalid) return 'invalid';
    if (isValid && hadError[field]) return 'valid'; // Only green if previously red/error
    return 'neutral';
  };

  const focusField = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);

    const invalidFields = [];
    if (!form.username.trim()) invalidFields.push({ name: 'username', ref: fieldRefs.username, msg: 'Username is required' });
    if (emailValidation.status !== 'valid') invalidFields.push({ name: 'email', ref: fieldRefs.email, msg: emailValidation.message || 'Valid email is required' });
    if (!form.age || invalidAge) invalidFields.push({ name: 'age', ref: fieldRefs.age, msg: invalidAge ? 'Age must be between 10 and 120' : 'Age is required' });
    if (!Object.values(checks).every(Boolean)) invalidFields.push({ name: 'password', ref: fieldRefs.password, msg: 'Password complexity rules not met' });
    if (!passwordsMatch) invalidFields.push({ name: 'confirmPassword', ref: fieldRefs.confirmPassword, msg: 'Passwords do not match' });

    if (invalidFields.length > 0) {
      const newHadError = { ...hadError };
      invalidFields.forEach(item => { newHadError[item.name] = true; });
      setHadError(newHadError);

      const first = invalidFields[0];
      setError(first.msg);
      setLiveAnnouncement(`Form has ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Focused on ${first.name}.`);
      focusField(first.ref);
      return;
    }

    setLoading(true);
    setLiveAnnouncement('Submitting signup form...');
    try {
      await signupUser({
        username: form.username,
        email: form.email,
        password: form.password,
        age: form.age,
      });
      localStorage.setItem(`iron_newly_registered_${form.email.toLowerCase()}`, 'true');
      navigate('/login');
    } catch (err) {
      setError(err.message);
      setLiveAnnouncement(`Signup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ── Input styles ────────────────────────────────────── */
  const iconStyle = (field) => {
    const state = getFieldState(field);
    let color = '#64748b';
    if (state === 'invalid') color = '#ef4444';
    else if (state === 'valid') color = '#10b981';
    else if (focusedField === field) color = '#00f0ff';

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
        noValidate
        className="glass-panel"
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {liveAnnouncement}
        </div>

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
              ref={fieldRefs.username}
              id="signup-username" type="text" placeholder="johndoe"
              value={form.username} onChange={update('username')}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('username')}
              aria-invalid={!form.username.trim() && !!error}
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
              ref={fieldRefs.email}
              id="signup-email" type="email" placeholder="you@example.com"
              value={form.email} onChange={update('email')}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('email')}
              aria-invalid={emailValidation.status === 'invalid'}
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
              ref={fieldRefs.age}
              id="signup-age" type="number" placeholder="25" min="10" max="120"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
              onFocus={() => setFocusedField('age')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle('age'),
                border: invalidAge ? '1px solid #ef4444' : inputStyle('age').border,
                boxShadow: invalidAge ? '0 0 12px rgba(239, 68, 68, 0.35)' : inputStyle('age').boxShadow,
              }}
              aria-invalid={invalidAge}
              required
            />
          </div>
          {invalidAge && <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Age must be between 10 and 120 years</div>}
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="signup-password" style={labelStyle}>Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={18} style={iconStyle('password')} />
            <input
              ref={fieldRefs.password}
              id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={update('password')}
              onFocus={() => { setFocusedField('password'); setIsPasswordFocused(true); }}
              onBlur={() => { setFocusedField(null); setIsPasswordFocused(false); }}
              style={{ ...inputStyle('password'), paddingRight: '44px' }}
              aria-invalid={pw.length > 0 && !Object.values(checks).every(Boolean)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                zIndex: 3,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
              ref={fieldRefs.confirmPassword}
              id="signup-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••"
              value={form.confirmPassword} onChange={update('confirmPassword')}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              style={{ ...inputStyle('confirmPassword'), paddingRight: '44px' }}
              aria-invalid={form.confirmPassword.length > 0 && !passwordsMatch}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                zIndex: 3,
              }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
        <AccessibleButton
          className="btn-futuristic"
          type="submit"
          disabled={loading || !allValid}
          disabledReason={!allValid ? "Complete all required fields and satisfy password criteria before creating an account." : "Creating account..."}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? 'Creating…' : 'Create Account'} <span>→</span>
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
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </div>
    </>
  );
}
