import { Link } from 'react-router-dom';
import './Landing.css';
import PageReveal from '../components/PageReveal';
import Silk from '../components/Silk';
import { Flame } from 'lucide-react';

/* ── Floating ambient glow circles ────────────────────────── */
function FloatingGlows() {
    const glows = [
        { color: 'rgba(0, 240, 255, 0.12)', size: 140, top: '10%', left: '5%', delay: '0s', duration: '9s' },
        { color: 'rgba(124, 58, 237, 0.10)', size: 110, top: '65%', right: '8%', delay: '2.5s', duration: '11s' },
        { color: 'rgba(236, 72, 153, 0.08)', size: 90, top: '35%', right: '25%', delay: '4s', duration: '13s' },
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

export default function Landing() {
    return (
        <>
            {/* Background layers */}
            <Silk speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
            <FloatingGlows />

            <PageReveal className="landing">
                <section className="landing-hero">
                    <div className="hero-badge">
                        <span className="badge-icon"><Flame size={20} /></span>
                        AI-Powered Fitness Companion
                    </div>

                    <h1 className="hero-title">
                        Train Smarter,<br />
                        <span className="accent">Not Harder</span>
                    </h1>

                    <p className="hero-subtitle">
                        Personalized workouts, real-time posture correction, and intelligent
                        food tracking — all in one app.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/signup" className="btn-primary">
                            Get Started Free <span>→</span>
                        </Link>
                        <Link to="/login" className="btn-secondary">
                            Log In
                        </Link>
                    </div>
                </section>

                <section className="landing-features">
                    <div className="glass-card feature-card">
                        <div className="feature-icon green">💪</div>
                        <h3>Smart Workouts</h3>
                        <p>AI-powered exercise recommendations based on your goals and body stats.</p>
                    </div>

                    <div className="glass-card feature-card">
                        <div className="feature-icon red">📷</div>
                        <h3>Live Posture Check</h3>
                        <p>Real-time form correction using MediaPipe during your exercises.</p>
                    </div>

                    <div className="glass-card feature-card">
                        <div className="feature-icon yellow">🍽️</div>
                        <h3>Food Tracking</h3>
                        <p>Log meals by text or photo. AI recognizes food and calculates macros.</p>
                    </div>

                    <div className="glass-card feature-card">
                        <div className="feature-icon purple">⚡</div>
                        <h3>Streak System</h3>
                        <p>Stay consistent with daily workout streaks and progress tracking.</p>
                    </div>
                </section>
            </PageReveal>
        </>
    );
}
