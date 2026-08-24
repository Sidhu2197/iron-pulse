import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import Silk from '../components/Silk';
import { MailCheck, XCircle, Loader2 } from 'lucide-react';
import './Auth.css';

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

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        verifyEmail(token)
            .then(data => {
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
            })
            .catch(err => {
                setStatus('error');
                setMessage(err.message || 'Verification failed. The link might be expired or invalid.');
            });
    }, [token]);

    return (
        <>
            <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
            <FloatingGlows />
            <div className="auth-page page-enter">
                <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '3rem 2rem', textAlign: 'center', zIndex: 2 }}>
                    
                    {status === 'verifying' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Loader2 size={48} color="#00f0ff" style={{ animation: 'spin 1s linear infinite' }} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Verifying your email...</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we confirm your email address.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                                <MailCheck size={48} color="#10b981" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>Email Verified!</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
                            <Link to="/login" className="btn-futuristic" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
                                Go to Login <span>→</span>
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                                <XCircle size={48} color="#ef4444" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>Verification Failed</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
                            <Link to="/login" className="btn-futuristic" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
                                Back to Login <span>→</span>
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
