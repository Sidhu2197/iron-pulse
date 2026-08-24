import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { logWorkout, getLocalDateString, sanitizeErrorMessage } from '../api/auth';
import PageReveal from '../components/PageReveal';
import AccessibleButton from '../components/AccessibleButton';
import './Workout.css';
import { Dumbbell, Timer, Ruler, User, Activity, Scale, Cake, Flame, Calendar, BarChart2, Target, Zap, HeartPulse, Sprout, Sparkles, Rocket, AlertCircle, CheckCircle2, Sunrise, Moon, X, ExternalLink } from 'lucide-react';

const TABS = ['Suggested Plan', 'Log Workout'];

const EQUIPMENT_OPTIONS = [
    'No Equipment',
    'Dumbbells',
    'Resistance Bands',
    'Full Gym',
];

const GOAL_OPTIONS = [
    { value: 'weight_loss', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Flame size={20} /> Weight Loss</span> },
    { value: 'fat_loss', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Flame size={20} /> Fat Loss</span> },
    { value: 'muscle_gain', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Zap size={20} /> Muscle Gain</span> },
    { value: 'strength', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Dumbbell size={20} /> Strength</span> },
    { value: 'endurance', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><HeartPulse size={20} /> Endurance</span> },
    { value: 'general_fitness', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Activity size={20} /> General Fitness</span> },
];

const GENDER_OPTIONS = [
    { value: 'male', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Male</span> },
    { value: 'female', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Female</span> },
    { value: 'other', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Other</span> },
];

const FITNESS_LEVEL_OPTIONS = [
    { value: 'beginner', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Sprout size={20} /> Beginner</span> },
    { value: 'intermediate', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Zap size={20} /> Intermediate</span> },
    { value: 'advanced', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Flame size={20} /> Advanced</span> },
];

const MEDICAL_CONDITIONS = [
    'None',
    'Knee Pain',
    'Back Pain',
    'High Blood Pressure',
    'Diabetes',
];

const LOCATION_OPTIONS = [
    { value: 'Gym', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Dumbbell size={20} /> Gym</span> },
    { value: 'Home', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Sparkles size={20} /> Home</span> },
];

const STYLE_OPTIONS = [
    { value: 'Mixed', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Zap size={20} /> Mixed</span> },
    { value: 'Strength', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Dumbbell size={20} /> Strength</span> },
    { value: 'Cardio', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><HeartPulse size={20} /> Cardio</span> },
    { value: 'HIIT', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Flame size={20} /> HIIT</span> },
    { value: 'Yoga', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Sprout size={20} /> Yoga</span> },
];

const ACTIVITY_OPTIONS = [
    { value: 'Sedentary', label: 'Sedentary' },
    { value: 'Light', label: 'Light' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Active', label: 'Active' },
];

const WEEKDAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DURATION_OPTIONS = [
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min' },
    { value: 90, label: '90 min' },
    { value: 120, label: '120 min' },
];

const WIZARD_STEPS = [
    { key: 'age', label: 'How old are you?', icon: <Cake size={20} /> },
    { key: 'weight', label: 'What\'s your weight?', icon: <Scale size={20} /> },
    { key: 'height', label: 'What\'s your height?', icon: <Ruler size={20} /> },
    { key: 'gender', label: 'What\'s your gender?', icon: <User size={20} /> },
    { key: 'fitnessLevel', label: 'What\'s your fitness level?', icon: <BarChart2 size={20} /> },
    { key: 'workout_location', label: 'Where will you workout?', icon: <Sparkles size={20} /> },
    { key: 'equipment', label: 'What equipment do you have?', icon: <Dumbbell size={20} /> },
    { key: 'medical_conditions', label: 'Any medical conditions?', icon: <HeartPulse size={20} /> },
    { key: 'goal', label: 'What\'s your fitness goal?', icon: <Target size={20} /> },
    { key: 'preferred_style', label: 'Preferred workout style?', icon: <Zap size={20} /> },
    { key: 'daily_activity_level', label: 'Daily activity level?', icon: <Activity size={20} /> },
    { key: 'workout_days', label: 'Which days will you workout?', icon: <Calendar size={20} /> },
    { key: 'duration', label: 'Preferred workout duration?', icon: <Timer size={20} /> },
];

export default function Workout() {
    const { token } = useAuth();
    const { show: showToast } = useToast();
    const { workoutPlan: plan, workoutPlanLoading: planLoading, workoutPlanError: planError, triggerGenerateWorkoutPlan } = usePlan();
    const [activeTab, setActiveTab] = useState('Suggested Plan');
    const [selectedPlanDay, setSelectedPlanDay] = useState('Day 1');

    // Sync selected day when plan updates
    useEffect(() => {
        if (plan?.weekly_plan?.length > 0) {
            setSelectedPlanDay(plan.weekly_plan[0].day);
        }
    }, [plan]);

    // Confirm Overwrite State
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Wizard state
    const [wizardActive, setWizardActive] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardAttemptedNext, setWizardAttemptedNext] = useState(false);
    const [wizardData, setWizardData] = useState({
        age: '',
        weight: '',
        height: '',
        gender: '',
        fitnessLevel: '',
        workout_location: 'Gym',
        equipment: [],
        medical_conditions: ['None'],
        goal: '',
        preferred_style: 'Mixed',
        daily_activity_level: 'Moderate',
        workout_days: ['Monday', 'Wednesday', 'Friday'],
        duration: '',
    });

    // Log Workout state
    const [logForm, setLogForm] = useState({ workout_name: '', duration: '', calories_burned: '', date: '' });
    const [logLoading, setLogLoading] = useState(false);

    // Inline exercise log state for Suggested Plan items
    const [loggedExerciseKeys, setLoggedExerciseKeys] = useState({});
    const [loggingExKey, setLoggingExKey] = useState(null);
    const [workoutSuccessMsg, setWorkoutSuccessMsg] = useState('');
    const [workoutErrorMsg, setWorkoutErrorMsg] = useState('');

    const normalizeDay = (day) => {
        if (!day) return '';
        const d = String(day).trim().toLowerCase();
        if (d.startsWith('mon')) return 'Monday';
        if (d.startsWith('tue')) return 'Tuesday';
        if (d.startsWith('wed')) return 'Wednesday';
        if (d.startsWith('thu')) return 'Thursday';
        if (d.startsWith('fri')) return 'Friday';
        if (d.startsWith('sat')) return 'Saturday';
        if (d.startsWith('sun')) return 'Sunday';
        return day;
    };

    const getPlanStorageKey = (p) => {
        if (!p) return null;
        const planId = p.plan_id || p.id || p.created_at || `${p.goal || 'gen'}_${p.weekly_plan?.length || 0}_${p.weekly_plan?.[0]?.exercises?.[0]?.name || 'default'}`;
        const today = getLocalDateString();
        return `iron_plan_logged_${planId}_${today}`;
    };

    const getExerciseUrl = (ex) => {
        if (!ex) return 'https://www.youtube.com';
        if (ex.video_url) return ex.video_url;
        if (ex.youtube_url) return ex.youtube_url;
        if (ex.url) return ex.url;
        if (ex.link) return ex.link;
        if (ex.tutorial_url) return ex.tutorial_url;
        if (ex.instructions_url) return ex.instructions_url;
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercise form tutorial')}`;
    };

    const getExerciseKey = (day, index, name) => `${normalizeDay(day)}_${index}_${name}`;

    // Load logged exercises specifically for the active plan on mount/plan change
    useEffect(() => {
        if (!plan?.weekly_plan) {
            setLoggedExerciseKeys({});
            return;
        }
        const storageKey = getPlanStorageKey(plan);
        if (storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                setLoggedExerciseKeys(saved ? JSON.parse(saved) : {});
            } catch {
                setLoggedExerciseKeys({});
            }
        } else {
            setLoggedExerciseKeys({});
        }
    }, [plan]);

    const parseSafeInt = (val, fallback = 100) => {
        if (typeof val === 'number' && !isNaN(val)) return Math.round(val);
        if (typeof val === 'string') {
            const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        return fallback;
    };

    const handleLogExercise = async (ex, dayName, index) => {
        const normDay = normalizeDay(dayName);
        const key = getExerciseKey(normDay, index, ex.name);

        // Instant optimistic update for immediate visual feedback
        const nextLogged = { ...loggedExerciseKeys, [key]: true };
        setLoggedExerciseKeys(nextLogged);
        setLoggingExKey(key);

        const storageKey = getPlanStorageKey(plan);
        if (storageKey) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(nextLogged));
            } catch (e) {
                console.warn('Failed to save plan logged state:', e);
            }
        }

        const msg = `Logged ${ex.name} for ${normDay}!`;
        setWorkoutSuccessMsg(msg);
        setWorkoutErrorMsg('');
        showToast({ type: 'success', message: msg });

        const calBurned = parseSafeInt(ex?.estimated_calories || ex?.calories, 100);
        const durationMins = parseSafeInt(plan?.workout_duration_minutes || ex?.duration, 30);

        try {
            await logWorkout(token, {
                workout_name: ex.name,
                duration: durationMins,
                calories_burned: calBurned,
                date: getLocalDateString(),
            });
            window.dispatchEvent(new Event('workout-logged'));
        } catch (err) {
            // Rollback optimistic state on error
            setLoggedExerciseKeys((prev) => {
                const copy = { ...prev };
                delete copy[key];
                if (storageKey) {
                    try {
                        localStorage.setItem(storageKey, JSON.stringify(copy));
                    } catch {}
                }
                return copy;
            });
            setWorkoutSuccessMsg('');
            const errMsg = sanitizeErrorMessage(err.message, 'Workout Service');
            setWorkoutErrorMsg(errMsg);
            showToast({ type: 'error', message: errMsg });
        } finally {
            setLoggingExKey(null);
        }
    };
    const [logMsg, setLogMsg] = useState('');
    const [logError, setLogError] = useState('');

    // -- Wizard helpers --
    const currentStep = WIZARD_STEPS[wizardStep];
    const isNoEquipment = wizardData.equipment.includes('No Equipment');

    const canGoNext = () => {
        const val = wizardData[currentStep.key];
        if (currentStep.key === 'equipment') return wizardData.equipment.length > 0;
        if (currentStep.key === 'medical_conditions') return wizardData.medical_conditions.length > 0;
        if (currentStep.key === 'workout_days') return wizardData.workout_days.length > 0;
        if (['goal', 'gender', 'fitnessLevel', 'workout_location', 'preferred_style', 'daily_activity_level', 'duration'].includes(currentStep.key)) {
            return val !== '' && val !== null && val !== undefined;
        }
        if (currentStep.key === 'age') return val !== '' && val !== null && Number(val) >= 13 && Number(val) <= 90;
        if (currentStep.key === 'height') return val !== '' && val !== null && Number(val) >= 50 && Number(val) <= 250;
        if (currentStep.key === 'weight') return val !== '' && val !== null && Number(val) >= 20 && Number(val) <= 300;
        return val !== '' && val !== null && val !== undefined;
    };

    const handleWizardNext = () => {
        setWizardAttemptedNext(true);
        if (!canGoNext()) return;
        setWizardAttemptedNext(false);
        if (wizardStep < WIZARD_STEPS.length - 1) {
            setWizardStep(wizardStep + 1);
        } else {
            handleGeneratePlan();
        }
    };

    const handleWizardBack = () => {
        setWizardAttemptedNext(false);
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

    const handleMedicalConditionToggle = (cond) => {
        let updated;
        if (cond === 'None') {
            updated = wizardData.medical_conditions.includes('None') ? [] : ['None'];
        } else {
            const filtered = wizardData.medical_conditions.filter((c) => c !== 'None');
            if (filtered.includes(cond)) {
                updated = filtered.filter((c) => c !== cond);
                if (updated.length === 0) updated = ['None'];
            } else {
                updated = [...filtered, cond];
            }
        }
        setWizardData({ ...wizardData, medical_conditions: updated });
    };

    const handleDayToggle = (dayName) => {
        let updated;
        if (wizardData.workout_days.includes(dayName)) {
            updated = wizardData.workout_days.filter((d) => d !== dayName);
        } else {
            const order = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
            updated = [...wizardData.workout_days, dayName].sort((a, b) => order[a] - order[b]);
        }
        setWizardData({ ...wizardData, workout_days: updated });
    };

    const handleCreatePlanClick = () => {
        if (plan) {
            setShowConfirmModal(true);
        } else {
            startWizard();
        }
    };

    const handleConfirmOverwrite = () => {
        setShowConfirmModal(false);
        startWizard();
    };

    const startWizard = () => {
        setWizardActive(true);
        setWizardStep(0);
        setWizardAttemptedNext(false);
        setWizardData({
            age: '',
            weight: '',
            height: '',
            gender: '',
            fitnessLevel: '',
            workout_location: 'Gym',
            equipment: [],
            medical_conditions: ['None'],
            goal: '',
            preferred_style: 'Mixed',
            daily_activity_level: 'Moderate',
            workout_days: ['Monday', 'Wednesday', 'Friday'],
            duration: '',
        });
    };

    // Wizard Keyboard Shortcuts (Enter -> Next, Esc -> Close)
    useEffect(() => {
        if (!wizardActive) return;
        const handleWizardKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (canGoNext()) {
                    if (wizardStep < WIZARD_STEPS.length - 1) {
                        setWizardStep((prev) => prev + 1);
                    } else {
                        handleGeneratePlan();
                    }
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setWizardActive(false);
            }
        };
        window.addEventListener('keydown', handleWizardKeyDown, true);
        return () => window.removeEventListener('keydown', handleWizardKeyDown, true);
    }, [wizardActive, wizardStep, wizardData]);

    // -- Generate plan from wizard data --
    const handleGeneratePlan = () => {
        setWizardActive(false);
        setLoggedExerciseKeys({});
        setWorkoutSuccessMsg('');
        setWorkoutErrorMsg('');
        triggerGenerateWorkoutPlan(token, {
            age: parseInt(wizardData.age),
            weight: parseFloat(wizardData.weight),
            height: parseFloat(wizardData.height),
            gender: wizardData.gender,
            fitness_level: wizardData.fitnessLevel,
            workout_location: wizardData.workout_location,
            equipment: wizardData.equipment,
            medical_conditions: wizardData.medical_conditions,
            goal: wizardData.goal,
            preferred_style: wizardData.preferred_style,
            daily_activity_level: wizardData.daily_activity_level,
            days_per_week: wizardData.workout_days.length,
            workout_days: wizardData.workout_days,
            duration: parseInt(wizardData.duration),
        }, { forceRefresh: true }).catch((err) => {
            console.error('Workout plan generation background error:', err);
        });
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
                date: logForm.date || getLocalDateString(),
            });
            setLoggedExerciseKeys((prev) => ({ ...prev, [logForm.workout_name]: true }));
            setLogMsg('Workout logged successfully!');
            showToast({ type: 'success', message: `Logged ${logForm.workout_name}!` });
            setLogForm({ workout_name: '', duration: '', calories_burned: '', date: '' });
            window.dispatchEvent(new Event('workout-logged'));
        } catch (err) {
            setLogError(err.message);
            showToast({ type: 'error', message: err.message });
        } finally {
            setLogLoading(false);
        }
    };

    // -- Render wizard step content --
    const renderWizardContent = () => {
        const step = currentStep;

        if (step.key === 'age' || step.key === 'weight' || step.key === 'height') {
            const units = step.key === 'weight' ? 'kg' : step.key === 'height' ? 'cm' : 'years';
            const placeholder = step.key === 'age' ? '25' : step.key === 'weight' ? '70' : '175';
            const minVal = step.key === 'age' ? 13 : step.key === 'height' ? 50 : 20;
            const maxVal = step.key === 'age' ? 90 : step.key === 'height' ? 250 : 300;
            const valName = step.key === 'age' ? 'Age' : step.key === 'height' ? 'Height' : 'Weight';

            const val = wizardData[step.key];
            const num = Number(val);
            const isOutOfRange = val !== '' && (num < minVal || num > maxVal);
            const isEmptyError = wizardAttemptedNext && val === '';
            const isInvalid = isOutOfRange || isEmptyError;

            return (
                <div className="wizard-input-wrap">
                    <div className={`input-field wizard-number-input ${isInvalid ? 'invalid' : ''}`}>
                        <span className="icon">{step.icon}</span>
                        <input
                            type="number"
                            placeholder={placeholder}
                            value={val}
                            onChange={(e) => {
                                const maxLen = step.key === 'age' ? 2 : 3;
                                const inputVal = e.target.value.slice(0, maxLen);
                                setWizardData({ ...wizardData, [step.key]: inputVal });
                            }}
                            onKeyDown={(e) => {
                                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                                const maxLen = step.key === 'age' ? 2 : 3;
                                if (e.target.value.length >= maxLen && /^[0-9]$/.test(e.key)) e.preventDefault();
                            }}
                            min={minVal}
                            max={maxVal}
                            autoFocus
                        />
                        <span className="wizard-unit">{units}</span>
                    </div>
                    {isInvalid && (
                        <div className="field-error">
                            <AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {isEmptyError ? `${valName} is required to continue` : `${valName} must be between ${minVal} and ${maxVal} ${units}`}
                        </div>
                    )}
                </div>
            );
        }

        if (step.key === 'gender') {
            const hasError = wizardAttemptedNext && !wizardData.gender;
            return (
                <div className="wizard-select-wrap">
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
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select a gender to continue</div>}
                </div>
            );
        }

        if (step.key === 'fitnessLevel') {
            const hasError = wizardAttemptedNext && !wizardData.fitnessLevel;
            return (
                <div className="wizard-select-wrap">
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
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select a fitness level to continue</div>}
                </div>
            );
        }

        if (step.key === 'workout_location') {
            const hasError = wizardAttemptedNext && !wizardData.workout_location;
            return (
                <div className="wizard-select-wrap">
                    <div className="wizard-select-grid">
                        {LOCATION_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`select-card ${wizardData.workout_location === opt.value ? 'selected' : ''}`}
                                onClick={() => setWizardData({ ...wizardData, workout_location: opt.value })}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select a workout location to continue</div>}
                </div>
            );
        }

        if (step.key === 'equipment') {
            const hasError = wizardAttemptedNext && wizardData.equipment.length === 0;
            return (
                <div className="wizard-select-wrap">
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
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select at least one equipment option</div>}
                </div>
            );
        }

        if (step.key === 'medical_conditions') {
            const hasError = wizardAttemptedNext && wizardData.medical_conditions.length === 0;
            return (
                <div className="wizard-select-wrap">
                    <div className="wizard-equipment-grid">
                        {MEDICAL_CONDITIONS.map((cond) => {
                            const isSelected = wizardData.medical_conditions.includes(cond);
                            const isDisabled = cond !== 'None' && wizardData.medical_conditions.includes('None');
                            return (
                                <button
                                    key={cond}
                                    type="button"
                                    className={`equipment-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${cond === 'None' ? 'no-equip' : ''}`}
                                    onClick={() => !isDisabled && handleMedicalConditionToggle(cond)}
                                    disabled={isDisabled}
                                >
                                    {cond}
                                    {isSelected && <span className="chip-check">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select at least one condition (or None)</div>}
                </div>
            );
        }

        if (step.key === 'goal') {
            const hasError = wizardAttemptedNext && !wizardData.goal;
            return (
                <div className="wizard-select-wrap">
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
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select a fitness goal to continue</div>}
                </div>
            );
        }

        if (step.key === 'preferred_style') {
            const hasError = wizardAttemptedNext && !wizardData.preferred_style;
            return (
                <div className="wizard-select-wrap">
                    <div className="wizard-select-grid">
                        {STYLE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`select-card ${wizardData.preferred_style === opt.value ? 'selected' : ''}`}
                                onClick={() => setWizardData({ ...wizardData, preferred_style: opt.value })}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select a workout style to continue</div>}
                </div>
            );
        }

        if (step.key === 'daily_activity_level') {
            const hasError = wizardAttemptedNext && !wizardData.daily_activity_level;
            return (
                <div className="wizard-select-wrap">
                    <div className="wizard-select-grid">
                        {ACTIVITY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`select-card ${wizardData.daily_activity_level === opt.value ? 'selected' : ''}`}
                                onClick={() => setWizardData({ ...wizardData, daily_activity_level: opt.value })}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select an activity level to continue</div>}
                </div>
            );
        }

        if (step.key === 'workout_days') {
            const hasError = wizardAttemptedNext && wizardData.workout_days.length === 0;
            return (
                <div className="wizard-select-wrap">
                    <div className="wizard-days-multi-grid">
                        {WEEKDAYS_OPTIONS.map((day) => {
                            const isSelected = wizardData.workout_days.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    className={`day-chip-btn ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleDayToggle(day)}
                                >
                                    <span className="day-chip-short">{day.substring(0, 3)}</span>
                                    <span className="day-chip-full">{day}</span>
                                    {isSelected && <span className="chip-check">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="day-selection-summary">
                        {wizardData.workout_days.length > 0 ? (
                            <span><Zap size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> <strong>{wizardData.workout_days.length} {wizardData.workout_days.length === 1 ? 'Day' : 'Days'} Selected:</strong> {wizardData.workout_days.join(', ')}</span>
                        ) : (
                            <span className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select at least one workout day to continue</span>
                        )}
                    </div>
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select at least one day to continue</div>}
                </div>
            );
        }

        if (step.key === 'duration') {
            const hasError = wizardAttemptedNext && !wizardData.duration;
            return (
                <div className="wizard-select-wrap">
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
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select workout duration to continue</div>}
                </div>
            );
        }

        return null;
    };

    return (
        <PageReveal className="workout-page">
            <h1>Workout</h1>
            <p className="subtitle">Generate custom fitness plans and track your daily workouts</p>

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
                                    <X size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Cancel
                                </button>
                            )}
                            <AccessibleButton
                                type="button"
                                className="wizard-btn-next"
                                onClick={handleWizardNext}
                                disabled={!canGoNext()}
                                disabledReason="Complete current step input before continuing."
                            >
                                {wizardStep === WIZARD_STEPS.length - 1 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Sparkles size={16} /> Generate Plan</span> : 'Next →'}
                            </AccessibleButton>
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
                            <h3><Dumbbell size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Create Suggested Plan</h3>
                            <AccessibleButton
                                className="create-plan-btn"
                                onClick={handleCreatePlanClick}
                                disabled={planLoading}
                                disabledReason="Generating workout plan..."
                            >
                                {planLoading ? 'Generating…' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Sparkles size={16} /> {plan ? 'Re-generate Plan' : 'Create Plan'}</span>}
                            </AccessibleButton>
                        </div>

                        {planError && <div className="plan-error">{planError}</div>}

                        {/* Empty state */}
                        {!plan && !planLoading && !wizardActive && (
                            <div className="empty-plan">
                                <div className="empty-icon"><Dumbbell size={32} /></div>
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
                                {plan.weekly_plan ? (
                                    <>
                                        {/* Summary header */}
                                        <div className="plan-summary">
                                            <div className="plan-stat">
                                                <span className="plan-stat-value">{plan.goal}</span>
                                                <span className="plan-stat-label">Target Goal</span>
                                            </div>
                                            <div className="plan-stat">
                                                <span className="plan-stat-value">{plan.weekly_plan.filter(d => d.exercises?.length > 0).length} Days</span>
                                                <span className="plan-stat-label">Active Workouts</span>
                                            </div>
                                            <div className="plan-stat">
                                                <span className="plan-stat-value">{plan.estimated_weekly_calories}</span>
                                                <span className="plan-stat-label">Est. Calories / Wk</span>
                                            </div>
                                        </div>

                                        {/* Days selector */}
                                        <div className="plan-days-picker">
                                            {plan.weekly_plan.map((d) => (
                                                <button
                                                    key={d.day}
                                                    type="button"
                                                    className={`plan-day-tab ${selectedPlanDay === d.day ? 'active' : ''} ${d.exercises?.length === 0 ? 'rest-day' : ''}`}
                                                    onClick={() => setSelectedPlanDay(d.day)}
                                                >
                                                    <span className="day-name">{d.day.substring(0, 3)}</span>
                                                    <span className="day-badge">{d.exercises?.length > 0 ? `${d.exercises.length} ex` : 'Rest'}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Selected Day View */}
                                        {(() => {
                                            const activeDay = plan.weekly_plan.find(d => d.day === selectedPlanDay) || plan.weekly_plan[0];
                                            return (
                                                <div className="day-workout-card">
                                                    {workoutSuccessMsg && <div className="workout-success-msg">{workoutSuccessMsg}</div>}
                                                    {workoutErrorMsg && <div className="workout-error-msg">{workoutErrorMsg}</div>}
                                                    <div className="day-workout-header">
                                                        <h4>{activeDay.day} Focus: <span className="accent">{activeDay.focus}</span></h4>
                                                        <span className="exercise-count-badge">
                                                            {activeDay.exercises?.length || 0} Exercises
                                                        </span>
                                                    </div>

                                                    {activeDay.exercises?.length === 0 ? (
                                                        <div className="rest-day-notice">
                                                            <Moon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> <strong>Rest & Recovery Day:</strong> Give your body time to rebuild muscle fibers and replenish glycogen stores.
                                                        </div>
                                                    ) : (
                                                        <div className="plan-exercises">
                                                            {activeDay.exercises.map((ex, i) => {
                                                                const exKey = getExerciseKey(activeDay.day, i, ex.name);
                                                                const isLogged = Boolean(loggedExerciseKeys[exKey]);
                                                                return (
                                                                    <div key={i} className="exercise-card-detailed">
                                                                        <div className="exercise-card-header">
                                                                            <span className="exercise-index">{i + 1}</span>
                                                                            <h5 className="exercise-title">{ex.name}</h5>
                                                                            <span className={`difficulty-badge ${ex.difficulty?.toLowerCase()}`}>{ex.difficulty}</span>
                                                                            <button
                                                                                type="button"
                                                                                className={`log-workout-item-btn ${isLogged ? 'logged' : ''}`}
                                                                                onClick={() => handleLogExercise(ex, activeDay.day, i)}
                                                                                disabled={loggingExKey === exKey || isLogged}
                                                                            >
                                                                                {loggingExKey === exKey ? 'Logging...' : isLogged ? '✓ Logged' : '+ Log Workout'}
                                                                            </button>
                                                                        </div>
                                                                        <div className="exercise-card-body">
                                                                            <div className="exercise-spec-grid">
                                                                                <div className="spec-items-wrap">
                                                                                    <div className="spec-item">
                                                                                        <span className="spec-label">Sets</span>
                                                                                        <span className="spec-val">{ex.sets}</span>
                                                                                    </div>
                                                                                    <div className="spec-item">
                                                                                        <span className="spec-label">Reps</span>
                                                                                        <span className="spec-val">{ex.reps}</span>
                                                                                    </div>
                                                                                    <div className="spec-item">
                                                                                        <span className="spec-label">Rest</span>
                                                                                        <span className="spec-val">{ex.rest}</span>
                                                                                    </div>
                                                                                    <div className="spec-item">
                                                                                        <span className="spec-label">Target</span>
                                                                                        <span className="spec-val">{ex.target_muscle}</span>
                                                                                    </div>
                                                                                    <div className="spec-item">
                                                                                        <span className="spec-label">Burn</span>
                                                                                        <span className="spec-val accent">{ex.estimated_calories}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <a
                                                                                    href={getExerciseUrl(ex)}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="exercise-link-btn"
                                                                                    title={`Open video tutorial & guide for ${ex.name}`}
                                                                                    aria-label={`Open tutorial link for ${ex.name}`}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <ExternalLink size={16} />
                                                                                </a>
                                                                            </div>
                                                                            {ex.description && (
                                                                                <p className="exercise-desc">{ex.description}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Warmup & Cooldown Routines */}
                                        <div className="routines-grid">
                                            {plan.warmup && plan.warmup.length > 0 && (
                                                <div className="routine-card">
                                                    <h5><Sunrise size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Warmup Routine</h5>
                                                    <ul className="routine-list">
                                                        {plan.warmup.map((w, idx) => (
                                                            <li key={idx}>
                                                                <strong>{w.name}</strong> ({w.duration}) — <span className="text-muted">{w.description}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {plan.cooldown && plan.cooldown.length > 0 && (
                                                <div className="routine-card">
                                                    <h5><Activity size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Cooldown Routine</h5>
                                                    <ul className="routine-list">
                                                        {plan.cooldown.map((c, idx) => (
                                                            <li key={idx}>
                                                                <strong>{c.name}</strong> ({c.duration}) — <span className="text-muted">{c.description}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stretching Routine */}
                                        {plan.stretching && plan.stretching.length > 0 && (
                                            <div className="routine-card full-width-routine">
                                                <h5><Sprout size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Stretching & Flexibility</h5>
                                                <div className="stretching-chips">
                                                    {plan.stretching.map((s, idx) => (
                                                        <div key={idx} className="stretch-chip">
                                                            <strong>{s.name}</strong> <span className="stretch-dur">({s.duration})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes & Safety Guidelines */}
                                        {plan.notes && plan.notes.length > 0 && (
                                            <div className="notes-card">
                                                <h5><Target size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Personal Guidelines & Medical Notes</h5>
                                                <ul className="notes-list">
                                                    {plan.notes.map((n, idx) => (
                                                        <li key={idx}>• {n}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Fallback legacy view */
                                    <>
                                        <div className="plan-summary">
                                            <div className="plan-stat">
                                                <span className="plan-stat-value">{plan.exercises?.length || 0}</span>
                                                <span className="plan-stat-label">Exercises</span>
                                            </div>
                                            <div className="plan-stat">
                                                <span className="plan-stat-value">{plan.total_duration || 30} min</span>
                                                <span className="plan-stat-label">Total Duration</span>
                                            </div>
                                            <div className="plan-stat">
                                                <span className="plan-stat-value">{plan.total_calories || 0}</span>
                                                <span className="plan-stat-label">Est. Calories</span>
                                            </div>
                                        </div>
                                        <div className="plan-exercises">
                                            {plan.exercises?.map((ex, i) => (
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
                                    </>
                                )}
                            </div>
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
                                    <span className="icon"><Dumbbell size={20} /></span>
                                    <input type="text" placeholder="e.g. Morning Run" value={logForm.workout_name}
                                        onChange={updateLog('workout_name')} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Duration (minutes)</label>
                                <div className="input-field">
                                    <span className="icon"><Timer size={20} /></span>
                                    <input type="number" placeholder="30" value={logForm.duration}
                                        onChange={updateLog('duration')} required min="1" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Calories Burned</label>
                                <div className="input-field">
                                    <span className="icon"><Flame size={20} /></span>
                                    <input type="number" placeholder="250" value={logForm.calories_burned}
                                        onChange={updateLog('calories_burned')} required min="1" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Date</label>
                                <div className="input-field">
                                    <span className="icon"><Calendar size={20} /></span>
                                    <input type="date" value={logForm.date} onChange={updateLog('date')} />
                                </div>
                            </div>
                            <div className="full-width">
                                <AccessibleButton
                                    className="btn-primary"
                                    type="submit"
                                    disabled={logLoading}
                                    disabledReason="Logging workout..."
                                >
                                    {logLoading ? 'Logging…' : 'Log Workout'}
                                </AccessibleButton>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Overwrite Confirmation Modal */}
            {showConfirmModal && (
                <div className="confirm-modal-overlay">
                    <div className="glass-card confirm-modal-card">
                        <div className="confirm-warning-icon"><AlertCircle size={32} style={{ color: '#ef4444' }} /></div>
                        <div className="confirm-modal-header">
                            <h3>Erase & Replace Active Workout Plan?</h3>
                        </div>
                        <p className="confirm-modal-text">
                            You already have an active workout plan. Creating a new plan will <strong>erase your existing plan</strong> and replace it with a new personalized routine.
                        </p>
                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-btn-cancel"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                <X size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Keep Active Plan
                            </button>
                            <button
                                type="button"
                                className="confirm-btn-proceed"
                                onClick={handleConfirmOverwrite}
                            >
                                <Flame size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Erase & Create New Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageReveal>
    );
}

