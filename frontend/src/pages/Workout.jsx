import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { logWorkout, generateWorkoutPlan } from '../api/auth';
import './Workout.css';

const TABS = ['Live Posture', 'Suggested Plan', 'Log Workout'];

const EQUIPMENT_OPTIONS = [
    'No Equipment',
    'Dumbbells',
    'Barbell',
    'Resistance Bands',
    'Pull-up Bar',
    'Bench',
    'Treadmill',
    'Stationary Bike',
    'Full Gym',
];

const GOAL_OPTIONS = [
    { value: 'fat_loss', label: '🔥 Fat Loss' },
    { value: 'muscle_gain', label: '💪 Muscle Gain' },
    { value: 'strength', label: '🏋️ Strength' },
    { value: 'endurance', label: '🫁 Endurance' },
    { value: 'general_fitness', label: '🏃 General Fitness' },
];

const GENDER_OPTIONS = [
    { value: 'male', label: '♂️ Male' },
    { value: 'female', label: '♀️ Female' },
];

const FITNESS_LEVEL_OPTIONS = [
    { value: 'beginner', label: '🌱 Beginner' },
    { value: 'intermediate', label: '⚡ Intermediate' },
    { value: 'advanced', label: '🔥 Advanced' },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const DURATION_OPTIONS = [
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min' },
    { value: 90, label: '90 min' },
    { value: 120, label: '120 min' },
];

const WIZARD_STEPS = [
    { key: 'age', label: 'How old are you?', icon: '🎂' },
    { key: 'weight', label: 'What\'s your weight?', icon: '⚖️' },
    { key: 'height', label: 'What\'s your height?', icon: '📏' },
    { key: 'gender', label: 'What\'s your gender?', icon: '👤' },
    { key: 'fitnessLevel', label: 'What\'s your fitness level?', icon: '📊' },
    { key: 'equipment', label: 'What equipment do you have?', icon: '🏋️' },
    { key: 'goal', label: 'What\'s your fitness goal?', icon: '🎯' },
    { key: 'daysPerWeek', label: 'How many days per week?', icon: '📅' },
    { key: 'duration', label: 'Preferred workout duration?', icon: '⏱️' },
];

export default function Workout() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('Suggested Plan');

    // Suggested Plan state
    const [plan, setPlan] = useState(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [planError, setPlanError] = useState('');

    // Wizard state
    const [wizardActive, setWizardActive] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardData, setWizardData] = useState({
        age: '',
        weight: '',
        height: '',
        gender: '',
        fitnessLevel: '',
        equipment: [],
        goal: '',
        daysPerWeek: '',
        duration: '',
    });

    // Log Workout state
    const [logForm, setLogForm] = useState({ workout_name: '', duration: '', calories_burned: '', date: '' });
    const [logLoading, setLogLoading] = useState(false);
    const [logMsg, setLogMsg] = useState('');
    const [logError, setLogError] = useState('');

    // Posture state
    const [cameraActive, setCameraActive] = useState(false);

    // Stop camera when switching away from Live Posture tab
    useEffect(() => {
        if (activeTab !== 'Live Posture' && cameraActive) {
            const video = document.getElementById('posture-video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(t => t.stop());
                video.srcObject = null;
            }
            setCameraActive(false);
        }
    }, [activeTab]);

    // -- Wizard helpers --
    const currentStep = WIZARD_STEPS[wizardStep];
    const isNoEquipment = wizardData.equipment.includes('No Equipment');

    const canGoNext = () => {
        const val = wizardData[currentStep.key];
        if (currentStep.key === 'equipment') return wizardData.equipment.length > 0;
        if (currentStep.key === 'goal' || currentStep.key === 'gender' || currentStep.key === 'fitnessLevel') return val !== '';
        if (currentStep.key === 'daysPerWeek' || currentStep.key === 'duration') return val !== '';
        return val !== '' && Number(val) > 0;
    };

    const handleWizardNext = () => {
        if (wizardStep < WIZARD_STEPS.length - 1) {
            setWizardStep(wizardStep + 1);
        } else {
            handleGeneratePlan();
        }
    };

    const handleWizardBack = () => {
        if (wizardStep > 0) setWizardStep(wizardStep - 1);
    };

    const handleEquipmentToggle = (equip) => {
        let updated;
        if (equip === 'No Equipment') {
            updated = wizardData.equipment.includes('No Equipment') ? [] : ['No Equipment'];
        } else {
            const filtered = wizardData.equipment.filter((e) => e !== 'No Equipment');
            if (filtered.includes(equip)) {
                updated = filtered.filter((e) => e !== equip);
            } else {
                updated = [...filtered, equip];
            }
        }
        setWizardData({ ...wizardData, equipment: updated });
    };

    const startWizard = () => {
        setWizardActive(true);
        setWizardStep(0);
        setWizardData({ age: '', weight: '', height: '', gender: '', fitnessLevel: '', equipment: [], goal: '', daysPerWeek: '', duration: '' });
        setPlan(null);
        setPlanError('');
    };

    // -- Generate plan from wizard data --
    const handleGeneratePlan = async () => {
        setWizardActive(false);
        setPlanLoading(true);
        setPlanError('');
        try {
            const data = await generateWorkoutPlan(token, {
                age: parseInt(wizardData.age),
                weight: parseFloat(wizardData.weight),
                height: parseFloat(wizardData.height),
                gender: wizardData.gender,
                fitness_level: wizardData.fitnessLevel,
                equipment: wizardData.equipment,
                goal: wizardData.goal,
                days_per_week: parseInt(wizardData.daysPerWeek),
                duration: parseInt(wizardData.duration),
            });
            setPlan(data);
        } catch (err) {
            setPlanError(err.message);
        } finally {
            setPlanLoading(false);
        }
    };

    // -- Log Workout handlers --
    const updateLog = (field) => (e) => setLogForm({ ...logForm, [field]: e.target.value });

    const handleLogWorkout = async (e) => {
        e.preventDefault();
        setLogLoading(true);
        setLogMsg('');
        setLogError('');
        try {
            await logWorkout(token, {
                workout_name: logForm.workout_name,
                duration: parseInt(logForm.duration),
                calories_burned: parseInt(logForm.calories_burned),
                date: logForm.date || new Date().toISOString().split('T')[0],
            });
            setLogMsg('Workout logged successfully! 🎉');
            setLogForm({ workout_name: '', duration: '', calories_burned: '', date: '' });
        } catch (err) {
            setLogError(err.message);
        } finally {
            setLogLoading(false);
        }
    };

    // -- Posture handler --
    const handleStartCamera = async () => {
        setCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.getElementById('posture-video');
            if (video) {
                video.srcObject = stream;
                video.play();
            }
        } catch (err) {
            setCameraActive(false);
            alert('Camera access denied. Please allow camera permissions.');
        }
    };

    const handleStopCamera = () => {
        const video = document.getElementById('posture-video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(t => t.stop());
            video.srcObject = null;
        }
        setCameraActive(false);
    };

    // -- Render wizard step content --
    const renderWizardContent = () => {
        const step = currentStep;

        if (step.key === 'age' || step.key === 'weight' || step.key === 'height') {
            const units = step.key === 'weight' ? 'kg' : step.key === 'height' ? 'cm' : 'years';
            const placeholder = step.key === 'age' ? '25' : step.key === 'weight' ? '70' : '175';
            return (
                <div className="wizard-input-wrap">
                    <div className="input-field wizard-number-input">
                        <span className="icon">{step.icon}</span>
                        <input
                            type="number"
                            placeholder={placeholder}
                            value={wizardData[step.key]}
                            onChange={(e) => setWizardData({ ...wizardData, [step.key]: e.target.value })}
                            min="1"
                            autoFocus
                        />
                        <span className="wizard-unit">{units}</span>
                    </div>
                </div>
            );
        }

        if (step.key === 'gender') {
            return (
                <div className="wizard-select-grid">
                    {GENDER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`select-card ${wizardData.gender === opt.value ? 'selected' : ''}`}
                            onClick={() => setWizardData({ ...wizardData, gender: opt.value })}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            );
        }

        if (step.key === 'fitnessLevel') {
            return (
                <div className="wizard-select-grid">
                    {FITNESS_LEVEL_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`select-card ${wizardData.fitnessLevel === opt.value ? 'selected' : ''}`}
                            onClick={() => setWizardData({ ...wizardData, fitnessLevel: opt.value })}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            );
        }

        if (step.key === 'equipment') {
            return (
                <div className="wizard-equipment-grid">
                    {EQUIPMENT_OPTIONS.map((equip) => {
                        const isSelected = wizardData.equipment.includes(equip);
                        const isDisabled = equip !== 'No Equipment' && isNoEquipment;
                        return (
                            <button
                                key={equip}
                                type="button"
                                className={`equipment-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${equip === 'No Equipment' ? 'no-equip' : ''}`}
                                onClick={() => !isDisabled && handleEquipmentToggle(equip)}
                                disabled={isDisabled}
                            >
                                {equip}
                                {isSelected && <span className="chip-check">✓</span>}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (step.key === 'goal') {
            return (
                <div className="wizard-select-grid">
                    {GOAL_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`select-card ${wizardData.goal === opt.value ? 'selected' : ''}`}
                            onClick={() => setWizardData({ ...wizardData, goal: opt.value })}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            );
        }

        if (step.key === 'daysPerWeek') {
            return (
                <div className="wizard-days-grid">
                    {DAYS_OPTIONS.map((day) => (
                        <button
                            key={day}
                            type="button"
                            className={`day-btn ${wizardData.daysPerWeek === String(day) ? 'selected' : ''}`}
                            onClick={() => setWizardData({ ...wizardData, daysPerWeek: String(day) })}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            );
        }

        if (step.key === 'duration') {
            return (
                <div className="wizard-select-grid duration-grid">
                    {DURATION_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`select-card ${wizardData.duration === String(opt.value) ? 'selected' : ''}`}
                            onClick={() => setWizardData({ ...wizardData, duration: String(opt.value) })}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="workout-page">
            <h1>Workout</h1>
            <p className="subtitle">Track exercises and check your form in real-time</p>

            <div className="workout-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`workout-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Wizard overlay — rendered outside glass-card to avoid stacking context issues */}
            {wizardActive && (
                <div className="wizard-overlay">
                    <div className="wizard-card glass-card">
                        {/* Progress bar */}
                        <div className="wizard-progress">
                            {WIZARD_STEPS.map((s, i) => (
                                <div key={s.key} className={`wizard-dot ${i <= wizardStep ? 'active' : ''} ${i < wizardStep ? 'done' : ''}`}>
                                    {i < wizardStep ? '✓' : i + 1}
                                </div>
                            ))}
                            <div className="wizard-progress-line">
                                <div className="wizard-progress-fill" style={{ width: `${(wizardStep / (WIZARD_STEPS.length - 1)) * 100}%` }} />
                            </div>
                        </div>

                        {/* Step label */}
                        <div className="wizard-step-header">
                            <span className="wizard-step-icon">{currentStep.icon}</span>
                            <h3>{currentStep.label}</h3>
                            <p className="wizard-step-count">Step {wizardStep + 1} of {WIZARD_STEPS.length}</p>
                        </div>

                        {/* Step content */}
                        <div className="wizard-step-content">
                            {renderWizardContent()}
                        </div>

                        {/* Navigation buttons */}
                        <div className="wizard-nav">
                            {wizardStep > 0 ? (
                                <button type="button" className="wizard-btn-back" onClick={handleWizardBack}>
                                    ← Back
                                </button>
                            ) : (
                                <button type="button" className="wizard-btn-back" onClick={() => setWizardActive(false)}>
                                    ✕ Cancel
                                </button>
                            )}
                            <button
                                type="button"
                                className="wizard-btn-next"
                                onClick={handleWizardNext}
                                disabled={!canGoNext()}
                            >
                                {wizardStep === WIZARD_STEPS.length - 1 ? '🚀 Generate Plan' : 'Next →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="workout-panel">
                {/* ========== SUGGESTED PLAN ========== */}
                {activeTab === 'Suggested Plan' && (
                    <div className="glass-card suggested-plan-card">
                        {/* Header */}
                        <div className="suggested-plan-header">
                            <h3>💪 Create Suggested Plan</h3>
                            <button className="create-plan-btn" onClick={startWizard} disabled={planLoading}>
                                {planLoading ? '⏳ Generating…' : '✨ Create Plan'}
                            </button>
                        </div>

                        {planError && <div className="plan-error">{planError}</div>}

                        {/* Empty state */}
                        {!plan && !planLoading && !wizardActive && (
                            <div className="empty-plan">
                                <div className="empty-icon">💪</div>
                                <p>Click <span className="accent">"Create Plan"</span> to get a personalized workout based on your goals</p>
                            </div>
                        )}

                        {/* Loading */}
                        {planLoading && (
                            <div className="empty-plan">
                                <div className="spinner" />
                                <p style={{ marginTop: '12px' }}>Generating your personalized plan…</p>
                            </div>
                        )}

                        {/* Plan result */}
                        {plan && !wizardActive && (
                            <div className="plan-result">
                                <div className="plan-summary">
                                    <div className="plan-stat">
                                        <span className="plan-stat-value">{plan.exercises.length}</span>
                                        <span className="plan-stat-label">Exercises</span>
                                    </div>
                                    <div className="plan-stat">
                                        <span className="plan-stat-value">{plan.total_duration} min</span>
                                        <span className="plan-stat-label">Total Duration</span>
                                    </div>
                                    <div className="plan-stat">
                                        <span className="plan-stat-value">{plan.total_calories}</span>
                                        <span className="plan-stat-label">Est. Calories</span>
                                    </div>
                                </div>
                                <div className="plan-exercises">
                                    {plan.exercises.map((ex, i) => (
                                        <div key={i} className="exercise-row">
                                            <div className="exercise-num">{i + 1}</div>
                                            <div className="exercise-info">
                                                <div className="exercise-name">{ex.name}</div>
                                                <div className="exercise-meta">
                                                    <span className="exercise-badge">{ex.type}</span>
                                                    <span>{ex.duration} min</span>
                                                    <span>~{ex.calories} cal</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========== LIVE POSTURE ========== */}
                {activeTab === 'Live Posture' && (
                    <div className="glass-card posture-card">
                        {!cameraActive ? (
                            <>
                                <div className="cam-placeholder">
                                    <span className="cam-icon">📷</span>
                                    <p>Camera feed will appear here</p>
                                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                                        Uses MediaPipe for real-time pose detection
                                    </p>
                                </div>
                                <button className="btn-primary" onClick={handleStartCamera}>
                                    Start Posture Check
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="posture-video-wrapper">
                                    <video id="posture-video" className="posture-video" autoPlay playsInline muted />
                                    <div className="posture-overlay">
                                        <span className="posture-status live">🔴 LIVE</span>
                                    </div>
                                </div>
                                <button className="btn-secondary" onClick={handleStopCamera} style={{ marginTop: 'var(--space-md)' }}>
                                    Stop Camera
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* ========== LOG WORKOUT ========== */}
                {activeTab === 'Log Workout' && (
                    <div className="glass-card log-workout-card">
                        <h3>Log a Workout</h3>

                        {logMsg && <div className="log-success">{logMsg}</div>}
                        {logError && <div className="log-error">{logError}</div>}

                        <form className="log-form" onSubmit={handleLogWorkout}>
                            <div className="input-group">
                                <label>Workout Name</label>
                                <div className="input-field">
                                    <span className="icon">🏋️</span>
                                    <input type="text" placeholder="e.g. Morning Run" value={logForm.workout_name}
                                        onChange={updateLog('workout_name')} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Duration (minutes)</label>
                                <div className="input-field">
                                    <span className="icon">⏱</span>
                                    <input type="number" placeholder="30" value={logForm.duration}
                                        onChange={updateLog('duration')} required min="1" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Calories Burned</label>
                                <div className="input-field">
                                    <span className="icon">🔥</span>
                                    <input type="number" placeholder="250" value={logForm.calories_burned}
                                        onChange={updateLog('calories_burned')} required min="1" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Date</label>
                                <div className="input-field">
                                    <span className="icon">📅</span>
                                    <input type="date" value={logForm.date} onChange={updateLog('date')} />
                                </div>
                            </div>
                            <div className="full-width">
                                <button className="btn-primary" type="submit" disabled={logLoading}>
                                    {logLoading ? 'Logging…' : 'Log Workout'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
