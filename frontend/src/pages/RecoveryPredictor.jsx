import { useState, useRef } from 'react';
import './RecoveryPredictor.css';
import PageReveal from '../components/PageReveal';
import AccessibleButton from '../components/AccessibleButton';
import { predictRecoveryScore } from '../api/auth';
import { Moon as Moon, Heartbeat as HeartPulse, Fire as Flame, Lightning as Zap, Drop as Droplets, Pulse as Activity, Warning as AlertTriangle, ShieldCheck as ShieldCheck } from '@phosphor-icons/react';

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

    const [submitted, setSubmitted] = useState(false);
    const [hadError, setHadError] = useState({});
    const [touched, setTouched] = useState({});
    const [focused, setFocused] = useState({});

    const handleBlur = (field) => () => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setFocused((prev) => ({ ...prev, [field]: false }));
    };

    const handleFocus = (field) => () => {
        setFocused((prev) => ({ ...prev, [field]: true }));
    };

    const sleepRef = useRef(null);
    const rhrRef = useRef(null);
    const intensityRef = useRef(null);
    const sorenessRef = useRef(null);
    const waterRef = useRef(null);

    const update = (field, regex) => (e) => {
        const v = e.target.value;
        if (v === '' || regex.test(v)) {
            setForm({ ...form, [field]: v });
            setSubmitted(false);
        }
    };

    const invalidSleep = form.sleep_hours !== '' && (Number(form.sleep_hours) < 1 || Number(form.sleep_hours) > 16);
    const invalidRhr = form.resting_heart_rate !== '' && (Number(form.resting_heart_rate) < 30 || Number(form.resting_heart_rate) > 150);
    const invalidIntensity = form.previous_workout_intensity !== '' && (Number(form.previous_workout_intensity) < 1 || Number(form.previous_workout_intensity) > 10);
    const invalidSoreness = form.muscle_soreness !== '' && (Number(form.muscle_soreness) < 1 || Number(form.muscle_soreness) > 10);
    const invalidWater = form.water_intake_liters !== '' && (Number(form.water_intake_liters) < 0.5 || Number(form.water_intake_liters) > 10);

    const isSleepValid = form.sleep_hours !== '' && !invalidSleep;
    const isRhrValid = form.resting_heart_rate !== '' && !invalidRhr;
    const isIntensityValid = form.previous_workout_intensity !== '' && !invalidIntensity;
    const isSorenessValid = form.muscle_soreness !== '' && !invalidSoreness;
    const isWaterValid = form.water_intake_liters !== '' && !invalidWater;

    const canCalculate = isSleepValid && isRhrValid && isIntensityValid && isSorenessValid && isWaterValid;

    const getFieldClass = (field) => {
        let isInvalid = false;
        let isValid = false;

        if (field === 'sleep_hours') {
            isValid = isSleepValid;
            isInvalid = (submitted && !form.sleep_hours) || invalidSleep;
        } else if (field === 'resting_heart_rate') {
            isValid = isRhrValid;
            isInvalid = (submitted && !form.resting_heart_rate) || invalidRhr;
        } else if (field === 'previous_workout_intensity') {
            isValid = isIntensityValid;
            isInvalid = (submitted && !form.previous_workout_intensity) || invalidIntensity;
        } else if (field === 'muscle_soreness') {
            isValid = isSorenessValid;
            isInvalid = (submitted && !form.muscle_soreness) || invalidSoreness;
        } else if (field === 'water_intake_liters') {
            isValid = isWaterValid;
            isInvalid = (submitted && !form.water_intake_liters) || invalidWater;
        }

        if (focused[field] && !submitted) {
            isInvalid = false;
            isValid = false;
        } else if (!submitted && !touched[field]) {
            isInvalid = false;
            isValid = false;
        }

        if (isInvalid) return 'invalid';
        if (isValid && hadError[field]) return 'valid';
        return '';
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        setSubmitted(true);

        const invalidFields = [];
        if (!isSleepValid) invalidFields.push({ name: 'sleep_hours', ref: sleepRef });
        if (!isRhrValid) invalidFields.push({ name: 'resting_heart_rate', ref: rhrRef });
        if (!isIntensityValid) invalidFields.push({ name: 'previous_workout_intensity', ref: intensityRef });
        if (!isSorenessValid) invalidFields.push({ name: 'muscle_soreness', ref: sorenessRef });
        if (!isWaterValid) invalidFields.push({ name: 'water_intake_liters', ref: waterRef });

        if (invalidFields.length > 0) {
            const newHadError = { ...hadError };
            invalidFields.forEach(item => { newHadError[item.name] = true; });
            setHadError(newHadError);

            const first = invalidFields[0];
            if (first.ref && first.ref.current) {
                first.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                first.ref.current.focus();
            }
            return;
        }

        setError('');
        setLoading(true);
        setAnimatedScore(0);

        try {
            const data = await predictRecoveryScore(form);
            const score = typeof data.recovery_score === 'number' 
                ? data.recovery_score 
                : parseFloat(data.recovery_score || 0);

            setResultScore(score);

            let start = 0;
            const duration = 2500; // Slow down the progress bar animation
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
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

                    <form onSubmit={handlePredict} className="recovery-form" noValidate>
                        {/* Sleep Hours */}
                        <div className="input-group">
                            <label htmlFor="sleep_hours">Sleep Duration</label>
                            <div className={`input-field ${getFieldClass('sleep_hours')}`}>
                                <span className="icon"><Moon size={20} /></span>
                                <input
                                    ref={sleepRef}
                                    id="sleep_hours"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="7.5"
                                    value={form.sleep_hours}
                                    onChange={update('sleep_hours', /^\d{0,2}(\.\d{0,1})?$/)}
                                    onBlur={handleBlur('sleep_hours')}
                                    onFocus={handleFocus('sleep_hours')}
                                    required
                                />
                                <span className="recovery-unit">hours</span>
                            </div>
                            {getFieldClass('sleep_hours') === 'invalid' && (
                                <div className="field-error">{invalidSleep ? 'Sleep must be 1 to 16 hours' : 'Sleep is required'}</div>
                            )}
                        </div>

                        {/* Resting Heart Rate */}
                        <div className="input-group">
                            <label htmlFor="resting_heart_rate">Resting Heart Rate</label>
                            <div className={`input-field ${getFieldClass('resting_heart_rate')}`}>
                                <span className="icon"><HeartPulse size={20} /></span>
                                <input
                                    ref={rhrRef}
                                    id="resting_heart_rate"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="68"
                                    value={form.resting_heart_rate}
                                    onChange={update('resting_heart_rate', /^\d{0,3}$/)}
                                    onBlur={handleBlur('resting_heart_rate')}
                                    onFocus={handleFocus('resting_heart_rate')}
                                    required
                                />
                                <span className="recovery-unit">bpm</span>
                            </div>
                            {getFieldClass('resting_heart_rate') === 'invalid' && (
                                <div className="field-error">{invalidRhr ? 'RHR must be 30 to 150 bpm' : 'RHR is required'}</div>
                            )}
                        </div>

                        {/* Previous Workout Intensity */}
                        <div className="input-group">
                            <label htmlFor="previous_workout_intensity">Previous Workout Intensity</label>
                            <div className={`input-field ${getFieldClass('previous_workout_intensity')}`}>
                                <span className="icon"><Flame size={20} /></span>
                                <input
                                    ref={intensityRef}
                                    id="previous_workout_intensity"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="8"
                                    value={form.previous_workout_intensity}
                                    onChange={update('previous_workout_intensity', /^\d{0,2}(\.\d{0,1})?$/)}
                                    onBlur={handleBlur('previous_workout_intensity')}
                                    onFocus={handleFocus('previous_workout_intensity')}
                                    required
                                />
                                <span className="recovery-unit">1-10</span>
                            </div>
                            {getFieldClass('previous_workout_intensity') === 'invalid' && (
                                <div className="field-error">{invalidIntensity ? 'Intensity must be 1 to 10' : 'Intensity is required'}</div>
                            )}
                        </div>

                        {/* Muscle Soreness */}
                        <div className="input-group">
                            <label htmlFor="muscle_soreness">Muscle Soreness Level</label>
                            <div className={`input-field ${getFieldClass('muscle_soreness')}`}>
                                <span className="icon"><Zap size={20} /></span>
                                <input
                                    ref={sorenessRef}
                                    id="muscle_soreness"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="4"
                                    value={form.muscle_soreness}
                                    onChange={update('muscle_soreness', /^\d{0,2}(\.\d{0,1})?$/)}
                                    onBlur={handleBlur('muscle_soreness')}
                                    onFocus={handleFocus('muscle_soreness')}
                                    required
                                />
                                <span className="recovery-unit">1-10</span>
                            </div>
                            {getFieldClass('muscle_soreness') === 'invalid' && (
                                <div className="field-error">{invalidSoreness ? 'Soreness must be 1 to 10' : 'Soreness is required'}</div>
                            )}
                        </div>

                        {/* Water Intake */}
                        <div className="input-group">
                            <label htmlFor="water_intake_liters">Water Intake</label>
                            <div className={`input-field ${getFieldClass('water_intake_liters')}`}>
                                <span className="icon"><Droplets size={20} /></span>
                                <input
                                    ref={waterRef}
                                    id="water_intake_liters"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="3.5"
                                    value={form.water_intake_liters}
                                    onChange={update('water_intake_liters', /^\d{0,2}(\.\d{0,1})?$/)}
                                    onBlur={handleBlur('water_intake_liters')}
                                    onFocus={handleFocus('water_intake_liters')}
                                    required
                                />
                                <span className="recovery-unit">liters</span>
                            </div>
                            {getFieldClass('water_intake_liters') === 'invalid' && (
                                <div className="field-error">{invalidWater ? 'Water must be 0.5 to 10 liters' : 'Water is required'}</div>
                            )}
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
