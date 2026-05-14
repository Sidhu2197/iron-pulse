import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../api/auth';
import { validateEmail, getEmailValidationStatus } from '../utils/emailValidation';
import './Auth.css';

const SECURITY_QUESTIONS = [
    'What is your pet\'s name?',
    'What city were you born in?',
    'What is your mother\'s maiden name?',
    'What was the name of your first school?',
    'What is your favorite food?',
];

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '', email: '', password: '', confirmPassword: '',
        age: '', securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailValidation, setEmailValidation] = useState({ status: 'empty', message: '' });

    const update = (field) => (e) => {
        const value = e.target.value;
        setForm({ ...form, [field]: value });
        
        // Real-time email validation
        if (field === 'email') {
            setEmailValidation(getEmailValidationStatus(value));
        }
    };

    // Password validation
    const pw = form.password;
    const checks = {
        length: pw.length >= 8,
        uppercase: /[A-Z]/.test(pw),
        number: /[0-9]/.test(pw),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
        match: pw.length > 0 && pw === form.confirmPassword,
    };
    const allValid = Object.values(checks).every(Boolean) && 
                    form.securityAnswer.trim().length > 0 && 
                    emailValidation.status === 'valid';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!allValid) {
            setError('Please meet all password requirements');
            return;
        }
        if (!form.username.trim() || !form.age || !form.securityAnswer.trim()) {
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
                securityQuestion: form.securityQuestion,
                securityAnswer: form.securityAnswer,
            });
            navigate('/login');
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
                <h1>Create Account</h1>
                <p>Join thousands achieving their fitness goals</p>
            </div>


            <form className="glass-card auth-form" onSubmit={handleSubmit}>
                {error && <div className="auth-error">{error}</div>}

                <div className="input-group">
                    <label htmlFor="signup-username">Username</label>
                    <div className="input-field">
                        <span className="icon">👤</span>
                        <input id="signup-username" type="text" placeholder="johndoe"
                            value={form.username} onChange={update('username')} required />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="signup-email">Email</label>
                    <div className="input-field">
                        <span className="icon">✉</span>
                        <input id="signup-email" type="email" placeholder="you@example.com"
                            value={form.email} onChange={update('email')} required />
                    </div>
                    {form.email && (
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
                    <label htmlFor="signup-age">Age</label>
                    <div className="input-field">
                        <span className="icon">🎂</span>
                        <input id="signup-age" type="number" placeholder="25" min="10" max="120"
                            value={form.age} onChange={update('age')} required />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="signup-password">Password</label>
                    <div className="input-field">
                        <span className="icon">🔒</span>
                        <input id="signup-password" type="password" placeholder="••••••••"
                            value={form.password} onChange={update('password')} required />
                    </div>
                    {pw.length > 0 && (
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
                    <label htmlFor="signup-confirm">Confirm Password</label>
                    <div className="input-field">
                        <span className="icon">🔒</span>
                        <input id="signup-confirm" type="password" placeholder="••••••••"
                            value={form.confirmPassword} onChange={update('confirmPassword')} required />
                    </div>
                    {form.confirmPassword.length > 0 && !checks.match && (
                        <span style={{ color: '#ef4444', fontSize: 'var(--font-xs)' }}>Passwords do not match</span>
                    )}
                </div>


                <div className="auth-row">
                    <div className="input-group">
                        <label htmlFor="signup-security-q">Security Question</label>
                        <div className="input-field">
                            <span className="icon">❓</span>
                            <select id="signup-security-q" value={form.securityQuestion}
                                onChange={update('securityQuestion')}
                                style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none', fontSize: 'inherit' }}>
                                {SECURITY_QUESTIONS.map((q) => (
                                    <option key={q} value={q} style={{ background: '#1a1a2e' }}>{q}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="signup-security-a">Security Answer</label>
                        <div className="input-field">
                            <span className="icon">🔑</span>
                            <input id="signup-security-a" type="text" placeholder="Your answer"
                                value={form.securityAnswer} onChange={update('securityAnswer')} required />
                        </div>
                    </div>
                </div>


                <button className="auth-submit" type="submit" disabled={loading || !allValid}>
                    {loading ? 'Creating…' : 'Create Account'} <span>→</span>
                </button>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </form>
        </div>
    );
}
