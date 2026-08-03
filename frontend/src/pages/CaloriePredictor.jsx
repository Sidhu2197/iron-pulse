import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { predictCalories, saveCaloriePrediction, fetchCaloriePredictions, checkMLHealth, getSupportedExercises } from '../api/auth';
import './CaloriePredictor.css';
import PageReveal from '../components/PageReveal';
import { Dumbbell, Timer, Ruler, Activity, Scale, Cake, Heart, BarChart2, Calendar, CheckCircle, XCircle } from 'lucide-react';

const DEFAULT_EXERCISE_TYPES = [
    { value: 'Running', emoji: <Activity size={20} />, label: 'Running' },
    { value: 'Cycling', emoji: '🚴', label: 'Cycling' },
    { value: 'Swimming', emoji: '🏊', label: 'Swimming' },
    { value: 'Walking', emoji: '🚶', label: 'Walking' },
    { value: 'HIIT', emoji: '⚡', label: 'HIIT' },
    { value: 'Weight Training', emoji: <Dumbbell size={20} />, label: 'Weights' },
    { value: 'Yoga', emoji: '🧘', label: 'Yoga' },
    { value: 'Jump Rope', emoji: '🤸', label: 'Jump Rope' },
    { value: 'Rowing', emoji: '🚣', label: 'Rowing' },
    { value: 'Elliptical', emoji: '🔄', label: 'Elliptical' },
];



const EXERCISE_EMOJI_MAP = {
    'Running': <Activity size={20} />, 'Cycling': '🚴', 'Swimming': '🏊', 'Walking': '🚶',
    'HIIT': '⚡', 'Weight Training': <Dumbbell size={20} />, 'Yoga': '🧘', 'Jump Rope': '🤸',
    'Rowing': '🚣', 'Elliptical': '🔄',
};

const INTENSITY_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };

export default function CaloriePredictor() {
    const { token } = useAuth();

    const [form, setForm] = useState({
        age: '', gender: 1, weight_kg: '', height_cm: '',
        body_fat_pct: '20', exercise_type: '', duration_min: '',
        heart_rate: '120', intensity: 2,
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
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
                .catch(() => {})
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
                    emoji: EXERCISE_EMOJI_MAP[ex] || '🏋️',
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

    const canSubmit = form.age && form.weight_kg && form.height_cm &&
        form.exercise_type && form.duration_min && form.heart_rate;

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        setSaveMsg('');

        try {
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
            const data = await predictCalories(payload);
            setResult(data);
        } catch (err) {
            setError(err.message || 'Prediction failed. Please try again.');
        } finally {
            setLoading(false);
        }
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
            setSaveMsg('Prediction saved! 🎉');
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
        setResult(null);
        setError('');
        setSaveMsg('');
    };

    return (
        <PageReveal className="calorie-predictor-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h1>Calorie AI</h1>
                    <p className="subtitle">Predict calories burned using our AI model trained on 10,000+ workout sessions</p>
                </div>
                {typeof mlHealth !== 'undefined' && mlHealth && (
                    <div className={`ml-health-status ${mlHealth.healthy ? 'healthy' : 'unhealthy'}`}>
                        {mlHealth.healthy ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span>{mlHealth.healthy ? 'ML Service Online' : 'ML Service Offline'}</span>
                    </div>
                )}
            </div>

            {error && <div className="predictor-error">{error}</div>}
            {saveMsg && <div className="predictor-success">{saveMsg}</div>}

            {/* ========== RESULTS ========== */}
            {result && (
                <div className="glass-card results-card">
                    <h3>🎯 Prediction Results</h3>

                    <div className="results-hero">
                        <div className="hero-value">{result.calories_burned?.toFixed(1)}</div>
                        <div className="hero-label">Calories Burned</div>
                    </div>

                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="stat-val">{result.calories_per_min?.toFixed(1)}</div>
                            <div className="stat-lbl">Cal / min</div>
                        </div>
                        <div className="result-stat">
                            <div className="stat-val">{result.bmi?.toFixed(1)}</div>
                            <div className="stat-lbl">BMI</div>
                        </div>
                        <div className="result-stat">
                            <div className="stat-val">{result.met_value?.toFixed(1)}</div>
                            <div className="stat-lbl">MET Value</div>
                        </div>
                    </div>

                    {result.food_equivalents && result.food_equivalents.length > 0 && (
                        <div className="food-equivalents">
                            <h4>🍽️ That's equivalent to…</h4>
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
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? '⏳ Saving…' : '💾 Save Prediction'}
                        </button>
                        <button className="reset-btn" onClick={handleReset}>
                            🔄 New Prediction
                        </button>
                    </div>
                </div>
            )}

            {/* ========== FORM ========== */}
            {!result && (
                <form className="glass-card predictor-form-card" onSubmit={handlePredict}>
                    <h3>🔮 Enter Your Details</h3>

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
                                <div className="input-field">
                                    <span className="icon"><Cake size={20} /></span>
                                    <input type="number" placeholder="25" value={form.age}
                                        onChange={(e) => updateField('age', e.target.value ? Math.min(120, Math.max(0, parseInt(e.target.value, 10))) : '')}
                                        onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
                                        min="10" max="120" required />
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="input-group">
                                <label>Gender</label>
                                <div className="gender-toggle">
                                    <button type="button" className={`gender-btn ${form.gender === 0 ? 'selected' : ''}`}
                                        onClick={() => updateField('gender', 0)}>♀️ Female</button>
                                    <button type="button" className={`gender-btn ${form.gender === 1 ? 'selected' : ''}`}
                                        onClick={() => updateField('gender', 1)}>♂️ Male</button>
                                </div>
                            </div>

                            {/* Weight */}
                            <div className="input-group">
                                <label>Weight (kg)</label>
                                <div className="input-field">
                                    <span className="icon"><Scale size={20} /></span>
                                    <input type="number" placeholder="70" value={form.weight_kg}
                                        onChange={(e) => updateField('weight_kg', e.target.value ? Math.min(300, Math.max(0, parseInt(e.target.value, 10))) : '')}
                                        onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
                                        min="20" max="300" required />
                                </div>
                            </div>

                            {/* Height */}
                            <div className="input-group">
                                <label>Height (cm)</label>
                                <div className="input-field">
                                    <span className="icon"><Ruler size={20} /></span>
                                    <input type="number" placeholder="170" value={form.height_cm}
                                        onChange={(e) => updateField('height_cm', e.target.value ? Math.min(250, Math.max(0, parseInt(e.target.value, 10))) : '')}
                                        onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
                                        min="50" max="250" required />
                                </div>
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
                                <div className="input-field">
                                    <span className="icon"><Timer size={20} /></span>
                                    <input type="number" placeholder="30" value={form.duration_min}
                                        onChange={(e) => updateField('duration_min', e.target.value)} min="1" required />
                                </div>
                            </div>

                            {/* Heart Rate */}
                            <div className="input-group">
                                <label>Heart Rate (BPM)</label>
                                <div className="input-field">
                                    <span className="icon"><Heart size={20} /></span>
                                    <input type="number" placeholder="120" value={form.heart_rate}
                                        onChange={(e) => updateField('heart_rate', e.target.value)} min="40" max="220" required />
                                </div>
                            </div>

                            {/* Exercise Type */}
                            <div className="exercise-section">
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
                            </div>

                            {/* Intensity */}
                            <div className="intensity-section">
                                <label>Intensity Level</label>
                                <div className="intensity-toggle">
                                    <button type="button"
                                        className={`intensity-btn low ${form.intensity === 1 ? 'selected' : ''}`}
                                        onClick={() => updateField('intensity', 1)}>
                                        🟢 Low
                                    </button>
                                    <button type="button"
                                        className={`intensity-btn medium ${form.intensity === 2 ? 'selected' : ''}`}
                                        onClick={() => updateField('intensity', 2)}>
                                        🟡 Medium
                                    </button>
                                    <button type="button"
                                        className={`intensity-btn high ${form.intensity === 3 ? 'selected' : ''}`}
                                        onClick={() => updateField('intensity', 3)}>
                                        🔴 High
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="predict-btn-wrap">
                                <button className="predict-btn" type="submit" disabled={!canSubmit || loading}>
                                    {loading ? '⏳ Predicting…' : '🚀 Predict Calories Burned'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            )}

            {/* ========== HISTORY ========== */}
            <div className="glass-card history-card">
                <h3>📋 Prediction History</h3>

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
                                            <span><Timer size={20} /> {item.duration_min} min</span>
                                            <span>💓 {item.heart_rate} BPM</span>
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

