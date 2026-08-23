import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { predictCalories, saveCaloriePrediction, fetchCaloriePredictions, checkMLHealth, getSupportedExercises } from '../api/auth';
import './CaloriePredictor.css';
import PageReveal from '../components/PageReveal';
import AccessibleButton from '../components/AccessibleButton';
import { Dumbbell, Timer, Ruler, Activity, Scale, Cake, Heart, BarChart2, Calendar, CheckCircle, XCircle, Target, Utensils, Save, RotateCcw, Sparkles, Zap, Bike, Waves, Footprints, Flame, Repeat, User, ClipboardList, AlertCircle } from 'lucide-react';

const DEFAULT_EXERCISE_TYPES = [
    { value: 'Running', emoji: <Activity size={20} />, label: 'Running' },
    { value: 'Cycling', emoji: <Bike size={20} />, label: 'Cycling' },
    { value: 'Swimming', emoji: <Waves size={20} />, label: 'Swimming' },
    { value: 'Walking', emoji: <Footprints size={20} />, label: 'Walking' },
    { value: 'HIIT', emoji: <Zap size={20} />, label: 'HIIT' },
    { value: 'Weight Training', emoji: <Dumbbell size={20} />, label: 'Weights' },
    { value: 'Yoga', emoji: <Activity size={20} />, label: 'Yoga' },
    { value: 'Jump Rope', emoji: <Zap size={20} />, label: 'Jump Rope' },
    { value: 'Rowing', emoji: <Activity size={20} />, label: 'Rowing' },
    { value: 'Elliptical', emoji: <Repeat size={20} />, label: 'Elliptical' },
];

const EXERCISE_EMOJI_MAP = {
    'Running': <Activity size={20} />, 'Cycling': <Bike size={20} />, 'Swimming': <Waves size={20} />, 'Walking': <Footprints size={20} />,
    'HIIT': <Zap size={20} />, 'Weight Training': <Dumbbell size={20} />, 'Yoga': <Activity size={20} />, 'Jump Rope': <Zap size={20} />,
    'Rowing': <Activity size={20} />, 'Elliptical': <Repeat size={20} />,
};

const INTENSITY_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };

export default function CaloriePredictor() {
    const { token } = useAuth();
    const {
        caloriePrediction: result,
        caloriePredictionLoading: loading,
        caloriePredictionError: error,
        triggerPredictCalories,
        clearCaloriePrediction,
    } = usePlan();

    const [form, setForm] = useState({
        age: '', gender: 1, weight_kg: '', height_cm: '',
        body_fat_pct: '20', exercise_type: '', duration_min: '',
        heart_rate: '120', intensity: 2,
    });

    const [saveMsg, setSaveMsg] = useState('');
    const [saving, setSaving] = useState(false);

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [mlHealth, setMlHealth] = useState(null);
    const [supportedExercises, setSupportedExercises] = useState(DEFAULT_EXERCISE_TYPES);
    const [healthLoading, setHealthLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchCaloriePredictions(token)
                .then(setHistory)
                .catch(() => { })
                .finally(() => setHistoryLoading(false));
        } else {
            setHistoryLoading(false);
        }
    }, [token]);

    useEffect(() => {
        // Check ML health and get supported exercises on mount
        Promise.all([
            checkMLHealth().catch(() => ({ healthy: false, message: 'Health check failed' })),
            getSupportedExercises().catch(() => ({ exercises: [] }))
        ]).then(([health, exercises]) => {
            setMlHealth(health);
            if (exercises.exercises && exercises.exercises.length > 0) {
                const exerciseOptions = exercises.exercises.map(ex => ({
                    value: ex,
                    emoji: EXERCISE_EMOJI_MAP[ex] || <Dumbbell size={20} />,
                    label: ex
                }));
                setSupportedExercises(exerciseOptions);
            }
        }).catch(() => {
            setMlHealth({ healthy: false, message: 'ML service unavailable' });
        }).finally(() => {
            setHealthLoading(false);
        });
    }, []);

    const updateField = (field, value) => setForm({ ...form, [field]: value });

    const [submitted, setSubmitted] = useState(false);
    const [hadError, setHadError] = useState({});
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    const ageRef = useRef(null);
    const weightRef = useRef(null);
    const heightRef = useRef(null);
    const durationRef = useRef(null);
    const heartRateRef = useRef(null);
    const exerciseRef = useRef(null);

    const invalidAge = form.age !== '' && (Number(form.age) < 10 || Number(form.age) > 120);
    const invalidWeight = form.weight_kg !== '' && (Number(form.weight_kg) < 20 || Number(form.weight_kg) > 300);
    const invalidHeight = form.height_cm !== '' && (Number(form.height_cm) < 50 || Number(form.height_cm) > 250);

    const isAgeValid = form.age !== '' && !invalidAge;
    const isWeightValid = form.weight_kg !== '' && !invalidWeight;
    const isHeightValid = form.height_cm !== '' && !invalidHeight;
    const isDurationValid = form.duration_min !== '' && Number(form.duration_min) > 0;
    const isHeartRateValid = form.heart_rate !== '' && Number(form.heart_rate) >= 40 && Number(form.heart_rate) <= 220;
    const isExerciseValid = !!form.exercise_type;

    const canSubmit = isAgeValid && isWeightValid && isHeightValid &&
        isDurationValid && isHeartRateValid && isExerciseValid;

    const getFieldClass = (field) => {
        let isInvalid = false;
        let isValid = false;

        if (field === 'age') {
            isValid = isAgeValid;
            isInvalid = (submitted && !form.age) || invalidAge;
        } else if (field === 'weight_kg') {
            isValid = isWeightValid;
            isInvalid = (submitted && !form.weight_kg) || invalidWeight;
        } else if (field === 'height_cm') {
            isValid = isHeightValid;
            isInvalid = (submitted && !form.height_cm) || invalidHeight;
        } else if (field === 'duration_min') {
            isValid = isDurationValid;
            isInvalid = submitted && !isDurationValid;
        } else if (field === 'heart_rate') {
            isValid = isHeartRateValid;
            isInvalid = (submitted && !form.heart_rate) || (form.heart_rate !== '' && !isHeartRateValid);
        } else if (field === 'exercise_type') {
            isValid = isExerciseValid;
            isInvalid = submitted && !isExerciseValid;
        }

        if (isInvalid) return 'invalid';
        if (isValid && hadError[field]) return 'valid'; // Only green if previously red/error
        return '';
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        setSubmitted(true);

        const invalidFields = [];
        if (!isAgeValid) invalidFields.push({ name: 'age', ref: ageRef, msg: invalidAge ? 'Age must be 10–120' : 'Age is required' });
        if (!isWeightValid) invalidFields.push({ name: 'weight_kg', ref: weightRef, msg: invalidWeight ? 'Weight must be 20–300 kg' : 'Weight is required' });
        if (!isHeightValid) invalidFields.push({ name: 'height_cm', ref: heightRef, msg: invalidHeight ? 'Height must be 50–250 cm' : 'Height is required' });
        if (!isDurationValid) invalidFields.push({ name: 'duration_min', ref: durationRef, msg: 'Duration is required' });
        if (!isHeartRateValid) invalidFields.push({ name: 'heart_rate', ref: heartRateRef, msg: 'Heart rate must be between 40 and 220 BPM' });
        if (!isExerciseValid) invalidFields.push({ name: 'exercise_type', ref: exerciseRef, msg: 'Exercise type is required' });

        if (invalidFields.length > 0) {
            const newHadError = { ...hadError };
            invalidFields.forEach(item => { newHadError[item.name] = true; });
            setHadError(newHadError);

            const first = invalidFields[0];
            setLiveAnnouncement(`Form has ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Focused on ${first.name}.`);
            if (first.ref && first.ref.current) {
                first.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                first.ref.current.focus();
            }
            return;
        }

        setSaveMsg('');
        const payload = {
            age: parseInt(form.age),
            gender: form.gender,
            weight_kg: parseInt(form.weight_kg),
            height_cm: parseInt(form.height_cm),
            body_fat_pct: parseInt(form.body_fat_pct) || 20,
            exercise_type: form.exercise_type,
            duration_min: parseInt(form.duration_min),
            heart_rate: parseInt(form.heart_rate),
            intensity: form.intensity,
        };

        triggerPredictCalories(payload)
            .then((data) => {
                setLiveAnnouncement(`Prediction ready: ${data.calories_burned?.toFixed(1)} calories burned.`);
            })
            .catch((err) => {
                setLiveAnnouncement(`Prediction failed: ${err.message || 'Please try again.'}`);
            });
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);
        setSaveMsg('');
        try {
            await saveCaloriePrediction(token, {
                exercise_type: result.exercise_type || form.exercise_type,
                duration_min: result.duration_min || parseInt(form.duration_min),
                intensity: form.intensity,
                heart_rate: parseInt(form.heart_rate),
                calories_burned: result.calories_burned,
                calories_per_min: result.calories_per_min,
                bmi: result.bmi,
                met_value: result.met_value,
                date: new Date().toISOString().split('T')[0],
            });
            setSaveMsg('Prediction saved!');
            // Refresh history
            const updated = await fetchCaloriePredictions(token);
            setHistory(updated);
        } catch (err) {
            setSaveMsg('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        clearCaloriePrediction();
        setSaveMsg('');
    };

    return (
        <PageReveal className="calorie-predictor-page">
            <div className="calorie-header">
                <h1>Calorie AI</h1>
                <p className="subtitle">Estimate calories burned based on exercise intensity and user metrics</p>
            </div>

            {error && <div className="predictor-error">{error}</div>}
            {saveMsg && <div className="predictor-success">{saveMsg}</div>}

            {/* ========== RESULTS ========== */}
            {result && (
                <div className="glass-card results-card">
                    <h3><Target size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Prediction Results</h3>

                    <div className="results-hero">
                        <div className="hero-value">{result.calories_burned?.toFixed(1)}</div>
                        <div className="hero-label">Calories Burned</div>
                    </div>

                    <div className="results-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        <div className="result-stat">
                            <div className="stat-val">{result.calories_per_min?.toFixed(1)}</div>
                            <div className="stat-lbl">Cal / min</div>
                        </div>
                        <div className="result-stat">
                            <div className="stat-val">{result.bmi?.toFixed(1)}</div>
                            <div className="stat-lbl">BMI</div>
                        </div>
                    </div>

                    {result.food_equivalents && result.food_equivalents.length > 0 && (
                        <div className="food-equivalents">
                            <h4><Utensils size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> That's equivalent to…</h4>
                            <div className="food-grid">
                                {result.food_equivalents.map((food, i) => (
                                    <div key={i} className="food-item">
                                        <div className="food-emoji">{food.item?.split(' ')[0]}</div>
                                        <div className="food-count">{food.count?.toFixed(1)}</div>
                                        <div className="food-name">{food.item?.split(' ').slice(1).join(' ')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="result-actions">
                        <AccessibleButton
                            className="save-btn"
                            onClick={handleSave}
                            disabled={saving}
                            disabledReason="Saving prediction..."
                        >
                            {saving ? 'Saving…' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Save size={16} /> Save Prediction</span>}
                        </AccessibleButton>
                        <button className="reset-btn" onClick={handleReset}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RotateCcw size={16} /> New Prediction</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ========== FORM ========== */}
            {!result && (
                <form noValidate className="glass-card predictor-form-card" onSubmit={handlePredict}>
                    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                        {liveAnnouncement}
                    </div>

                    <h3><Sparkles size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Enter Your Details</h3>

                    {loading ? (
                        <div className="predictor-loading">
                            <div className="spinner" />
                            <p>Crunching numbers with AI…</p>
                        </div>
                    ) : (
                        <div className="form-grid">
                            {/* Age */}
                            <div className="input-group">
                                <label>Age</label>
                                <div className={`input-field ${getFieldClass('age')}`}>
                                    <span className="icon"><Cake size={20} /></span>
                                    <input ref={ageRef} type="number" placeholder="25" value={form.age}
                                        onChange={(e) => updateField('age', e.target.value.slice(0, 2))}
                                        onKeyDown={(e) => {
                                            if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                                            if (e.target.value.length >= 2 && /^[0-9]$/.test(e.key)) e.preventDefault();
                                        }}
                                        min="10" max="99"
                                        aria-invalid={getFieldClass('age') === 'invalid'}
                                        required />
                                </div>
                                {getFieldClass('age') === 'invalid' && (
                                    <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {invalidAge ? 'Age must be between 10 and 120 years' : 'Age is required'}</div>
                                )}
                            </div>

                            {/* Gender */}
                            <div className="input-group">
                                <label>Gender</label>
                                <div className="gender-toggle">
                                    <button type="button" className={`gender-btn ${form.gender === 0 ? 'selected' : ''}`}
                                        onClick={() => updateField('gender', 0)}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><User size={16} /> Female</span>
                                    </button>
                                    <button type="button" className={`gender-btn ${form.gender === 1 ? 'selected' : ''}`}
                                        onClick={() => updateField('gender', 1)}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><User size={16} /> Male</span>
                                    </button>
                                </div>
                            </div>

                            {/* Weight */}
                            <div className="input-group">
                                <label>Weight (kg)</label>
                                <div className={`input-field ${getFieldClass('weight_kg')}`}>
                                    <span className="icon"><Scale size={20} /></span>
                                    <input ref={weightRef} type="number" placeholder="70" value={form.weight_kg}
                                        onChange={(e) => updateField('weight_kg', e.target.value.slice(0, 3))}
                                        onKeyDown={(e) => {
                                            if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                                            if (e.target.value.length >= 3 && /^[0-9]$/.test(e.key)) e.preventDefault();
                                        }}
                                        min="20" max="300"
                                        aria-invalid={getFieldClass('weight_kg') === 'invalid'}
                                        required />
                                </div>
                                {getFieldClass('weight_kg') === 'invalid' && (
                                    <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {invalidWeight ? 'Weight must be between 20 and 300 kg' : 'Weight is required'}</div>
                                )}
                            </div>

                            {/* Height */}
                            <div className="input-group">
                                <label>Height (cm)</label>
                                <div className={`input-field ${getFieldClass('height_cm')}`}>
                                    <span className="icon"><Ruler size={20} /></span>
                                    <input ref={heightRef} type="number" placeholder="170" value={form.height_cm}
                                        onChange={(e) => updateField('height_cm', e.target.value.slice(0, 3))}
                                        onKeyDown={(e) => {
                                            if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                                            if (e.target.value.length >= 3 && /^[0-9]$/.test(e.key)) e.preventDefault();
                                        }}
                                        min="50" max="250"
                                        aria-invalid={getFieldClass('height_cm') === 'invalid'}
                                        required />
                                </div>
                                {getFieldClass('height_cm') === 'invalid' && (
                                    <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {invalidHeight ? 'Height must be between 50 and 250 cm' : 'Height is required'}</div>
                                )}
                            </div>

                            {/* Body Fat % */}
                            <div className="input-group">
                                <label>Body Fat % (optional)</label>
                                <div className="input-field">
                                    <span className="icon"><BarChart2 size={20} /></span>
                                    <input type="number" placeholder="20" value={form.body_fat_pct}
                                        onChange={(e) => updateField('body_fat_pct', e.target.value)} min="1" max="60" />
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="input-group">
                                <label>Duration (min)</label>
                                <div className={`input-field ${getFieldClass('duration_min')}`}>
                                    <span className="icon"><Timer size={20} /></span>
                                    <input ref={durationRef} type="number" placeholder="30" value={form.duration_min}
                                        onChange={(e) => updateField('duration_min', e.target.value)} min="1"
                                        aria-invalid={getFieldClass('duration_min') === 'invalid'}
                                        required />
                                </div>
                                {getFieldClass('duration_min') === 'invalid' && (
                                    <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Duration is required</div>
                                )}
                            </div>

                            {/* Heart Rate */}
                            <div className="input-group">
                                <label>Heart Rate (BPM)</label>
                                <div className={`input-field ${getFieldClass('heart_rate')}`}>
                                    <span className="icon"><Heart size={20} /></span>
                                    <input ref={heartRateRef} type="number" placeholder="120" value={form.heart_rate}
                                        onChange={(e) => updateField('heart_rate', e.target.value)} min="40" max="220"
                                        aria-invalid={getFieldClass('heart_rate') === 'invalid'}
                                        required />
                                </div>
                                {getFieldClass('heart_rate') === 'invalid' && (
                                    <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Heart rate is required (40–220 BPM)</div>
                                )}
                            </div>

                            {/* Exercise Type */}
                            <div className="exercise-section" ref={exerciseRef}>
                                <label>Exercise Type</label>
                                <div className="exercise-grid">
                                    {supportedExercises.map((ex) => (
                                        <button key={ex.value} type="button"
                                            className={`exercise-card ${form.exercise_type === ex.value ? 'selected' : ''}`}
                                            onClick={() => updateField('exercise_type', ex.value)}>
                                            <span className="exercise-emoji">{ex.emoji}</span>
                                            {ex.label}
                                        </button>
                                    ))}
                                </div>
                                {getFieldClass('exercise_type') === 'invalid' && (
                                    <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select an exercise type</div>
                                )}
                            </div>

                            {/* Intensity */}
                            <div className="intensity-section">
                                <label>Intensity Level</label>
                                <div className="intensity-toggle">
                                    <button type="button"
                                        className={`intensity-btn low ${form.intensity === 1 ? 'selected' : ''}`}
                                        onClick={() => updateField('intensity', 1)}>
                                        Low
                                    </button>
                                    <button type="button"
                                        className={`intensity-btn medium ${form.intensity === 2 ? 'selected' : ''}`}
                                        onClick={() => updateField('intensity', 2)}>
                                        Medium
                                    </button>
                                    <button type="button"
                                        className={`intensity-btn high ${form.intensity === 3 ? 'selected' : ''}`}
                                        onClick={() => updateField('intensity', 3)}>
                                        High
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="predict-btn-wrap">
                                <AccessibleButton
                                    className="predict-btn"
                                    type="submit"
                                    disabled={!canSubmit || loading}
                                    disabledReason={!canSubmit ? "Fill in all required workout metrics to predict calories burned." : "Predicting calories burned..."}
                                >
                                    {loading ? 'Predicting…' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18} /> Predict Calories Burned</span>}
                                </AccessibleButton>
                            </div>
                        </div>
                    )}
                </form>
            )}

            {/* ========== HISTORY ========== */}
            <div className="glass-card history-card">
                <h3><ClipboardList size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Prediction History</h3>

                {historyLoading ? (
                    <div className="predictor-loading">
                        <div className="spinner" />
                        <p>Loading history…</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="history-empty">
                        <div className="empty-icon"><BarChart2 size={20} /></div>
                        <p>No predictions yet. Try your first one above!</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {history.slice(0, 10).map((item, i) => (
                            <div key={item.id || i} className="history-item">
                                <div className="history-left">
                                    <div className="history-exercise-icon">
                                        {EXERCISE_EMOJI_MAP[item.exercise_type] || <Activity size={20} />}
                                    </div>
                                    <div>
                                        <div className="history-exercise-name">{item.exercise_type}</div>
                                        <div className="history-exercise-meta">
                                            <span><Timer size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }} /> {item.duration_min} min</span>
                                            <span><Heart size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }} /> {item.heart_rate} BPM</span>
                                            <span><BarChart2 size={20} /> {INTENSITY_LABEL[item.intensity] || 'Medium'}</span>
                                            <span><Calendar size={20} /> {item.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="history-calories">
                                    <div className="cal-val">{typeof item.calories_burned === 'number' ? item.calories_burned.toFixed(1) : item.calories_burned}</div>
                                    <div className="cal-label">cal burned</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageReveal>
    );
}

