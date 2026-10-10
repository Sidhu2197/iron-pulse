import { useState } from 'react';
import './RecoveryPredictor.css';
import PageReveal from '../components/PageReveal';
import AccessibleButton from '../components/AccessibleButton';
import { predictRecoveryScore } from '../api/auth';
import { Moon, HeartPulse, Flame, Zap, Droplets, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

const RECOVERY_TIERS = [
    { min: 0, max: 45, label: 'Low Recovery / High Fatigue', color: '#f43f5e', icon: AlertTriangle, statusClass: 'tier-low', advice: 'Prioritize deep sleep, hydration, and light stretching. Avoid heavy compound lifts today.' },
    { min: 45, max: 75, label: 'Moderate Recovery', color: '#38bdf8', icon: Activity, statusClass: 'tier-med', advice: 'Body is well-rested. Suitable for moderate cardio, hypertrophy, or technique work.' },
    { min: 75, max: 100, label: 'Optimal Recovery / Peak Readiness', color: '#10b981', icon: ShieldCheck, statusClass: 'tier-high', advice: 'Prime condition! Excellent opportunity for personal records and intense training.' },
];

function getRecoveryTier(score) {
    return RECOVERY_TIERS.find((t) => score >= t.min && score <= t.max) || RECOVERY_TIERS[1];
}

export default function RecoveryPredictor() {
    const [form, setForm] = useState({
        sleep_hours: '',
        resting_heart_rate: '',
        previous_workout_intensity: '',
        muscle_soreness: '',
        water_intake_liters: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultScore, setResultScore] = useState(null);
    const [animatedScore, setAnimatedScore] = useState(0);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handlePredict = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setAnimatedScore(0);

        try {
            const data = await predictRecoveryScore(form);
            const score = typeof data.recovery_score === 'number' 
                ? data.recovery_score 
                : parseFloat(data.recovery_score || 0);

            setResultScore(score);

            // Animate progress bar and counter smoothly from 0 to target score
            let start = 0;
            const duration = 1200; // ms
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentVal = start + (score - start) * easeProgress;
                
                setAnimatedScore(currentVal);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setAnimatedScore(score);
                }
            };

            requestAnimationFrame(animate);
        } catch (err) {
            setError(err.message || 'Failed to calculate recovery score');
        } finally {
            setLoading(false);
        }
    };

    const currentTier = resultScore !== null ? getRecoveryTier(resultScore) : getRecoveryTier(animatedScore);

    return (
        <PageReveal className="recovery-page">
            <h1>Recovery Score Predictor</h1>
            <p className="subtitle">Predict your body recovery & readiness index</p>

            <div className="recovery-layout">
                {/* Left Panel: Input Form */}
                <div className="glass-card recovery-form-card">
                    <h3>
                        <Activity size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                        Enter Your Details
                    </h3>

                    <form onSubmit={handlePredict} className="recovery-form">
                        {/* Sleep Hours */}
                        <div className="input-group">
                            <label htmlFor="sleep_hours">Sleep Duration</label>
                            <div className="input-field">
                                <span className="icon"><Moon size={20} /></span>
                                <input
                                    id="sleep_hours"
                                    type="number"
                                    step="0.5"
                                    min="1"
                                    max="16"
                                    placeholder="7.5"
                                    value={form.sleep_hours}
                                    onChange={update('sleep_hours')}
                                    required
                                />
                                <span className="recovery-unit">hours</span>
                            </div>
                        </div>

                        {/* Resting Heart Rate */}
                        <div className="input-group">
                            <label htmlFor="resting_heart_rate">Resting Heart Rate</label>
                            <div className="input-field">
                                <span className="icon"><HeartPulse size={20} /></span>
                                <input
                                    id="resting_heart_rate"
                                    type="number"
                                    min="30"
                                    max="150"
                                    placeholder="68"
                                    value={form.resting_heart_rate}
                                    onChange={update('resting_heart_rate')}
                                    required
                                />
                                <span className="recovery-unit">bpm</span>
                            </div>
                        </div>

                        {/* Previous Workout Intensity */}
                        <div className="input-group">
                            <label htmlFor="previous_workout_intensity">Previous Workout Intensity</label>
                            <div className="input-field">
                                <span className="icon"><Flame size={20} /></span>
                                <input
                                    id="previous_workout_intensity"
                                    type="number"
                                    min="1"
                                    max="10"
                                    placeholder="8"
                                    value={form.previous_workout_intensity}
                                    onChange={update('previous_workout_intensity')}
                                    required
                                />
                                <span className="recovery-unit">1-10</span>
                            </div>
                        </div>

                        {/* Muscle Soreness */}
                        <div className="input-group">
                            <label htmlFor="muscle_soreness">Muscle Soreness Level</label>
                            <div className="input-field">
                                <span className="icon"><Zap size={20} /></span>
                                <input
                                    id="muscle_soreness"
                                    type="number"
                                    min="1"
                                    max="10"
                                    placeholder="4"
                                    value={form.muscle_soreness}
                                    onChange={update('muscle_soreness')}
                                    required
                                />
                                <span className="recovery-unit">1-10</span>
                            </div>
                        </div>

                        {/* Water Intake */}
                        <div className="input-group">
                            <label htmlFor="water_intake_liters">Water Intake</label>
                            <div className="input-field">
                                <span className="icon"><Droplets size={20} /></span>
                                <input
                                    id="water_intake_liters"
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="10"
                                    placeholder="3.5"
                                    value={form.water_intake_liters}
                                    onChange={update('water_intake_liters')}
                                    required
                                />
                                <span className="recovery-unit">liters</span>
                            </div>
                        </div>

                        {error && <div className="field-error">{error}</div>}

                        <div className="recovery-actions">
                            <AccessibleButton
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Calculating Score...' : 'Predict Recovery Score'}
                            </AccessibleButton>
                        </div>
                    </form>
                </div>

                {/* Right Panel: Results Display matching BMI Calculator */}
                <div className="glass-card recovery-result-card">
                    {resultScore === null && animatedScore === 0 ? (
                        <div className="recovery-empty">
                            <div className="recovery-empty-icon"><Activity size={48} /></div>
                            <p>Fill in your details and click <span className="accent">"Predict Recovery Score"</span> to see your result</p>
                        </div>
                    ) : (
                        <div className="recovery-result animate-fade-in">
                            {/* Animated Progress Bar from 0 to output number */}
                            <div className="recovery-gauge-container">
                                <div className="recovery-gauge-track">
                                    <div
                                        className="recovery-gauge-fill"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, animatedScore))}%`,
                                            background: `linear-gradient(90deg, #00f0ff, ${currentTier.color})`,
                                            boxShadow: `0 0 16px ${currentTier.color}88`,
                                        }}
                                    />
                                </div>
                                <div className="recovery-gauge-labels">
                                    <span>0</span>
                                    <span>25</span>
                                    <span>50</span>
                                    <span>75</span>
                                    <span>100</span>
                                </div>
                            </div>

                            {/* Hero Score */}
                            <div className="recovery-score">
                                <span className="recovery-number" style={{ color: currentTier.color }}>
                                    {animatedScore.toFixed(2)}
                                </span>
                                <span className="recovery-category-label">
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: currentTier.color, display: 'inline-block', marginRight: '6px' }} />
                                    {currentTier.label}
                                </span>
                            </div>

                            {/* Advice Recommendation */}
                            <div className="recovery-advice">
                                <h4>Recommendation</h4>
                                <p>{currentTier.advice}</p>
                            </div>

                            {/* Summary Metrics */}
                            <div className="metrics-summary">
                                <div className="summary-item">
                                    <Moon size={16} />
                                    <span>Sleep: <strong>{form.sleep_hours || '-'} hrs</strong></span>
                                </div>
                                <div className="summary-item">
                                    <HeartPulse size={16} />
                                    <span>RHR: <strong>{form.resting_heart_rate || '-'} bpm</strong></span>
                                </div>
                                <div className="summary-item">
                                    <Droplets size={16} />
                                    <span>Water: <strong>{form.water_intake_liters || '-'} L</strong></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageReveal>
    );
}
