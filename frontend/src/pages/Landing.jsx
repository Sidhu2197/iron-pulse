import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
    return (
        <div className="landing">
            <section className="landing-hero">
                <div className="hero-badge">
                    <span className="badge-icon">🔥</span>
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
        </div>
    );
}
