import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { useMacros } from '../context/MacroContext';
import { searchFoods, logMeal, fetchMeals, fetchMealSummary, getLocalDateString } from '../api/auth';
import './FoodPlan.css';
import AccessibleButton from '../components/AccessibleButton';
import { Search, Ruler, User, Scale, Cake, Flame, Target, Utensils, Leaf, Zap, Sunrise, Sun, Moon, Sparkles, CheckCircle2, AlertCircle, Trash2, X } from 'lucide-react';

const FOOD_WIZARD_STEPS = [
    { key: 'age', label: 'How old are you?', icon: <Cake size={20} /> },
    { key: 'gender', label: 'What\'s your gender?', icon: <User size={20} /> },
    { key: 'height', label: 'What\'s your height?', icon: <Ruler size={20} /> },
    { key: 'weight', label: 'What\'s your weight?', icon: <Scale size={20} /> },
    { key: 'goal', label: 'What\'s your goal?', icon: <Target size={20} /> },
    { key: 'mealType', label: 'Which meal?', icon: <Utensils size={20} /> },
    { key: 'dietType', label: 'Diet preference?', icon: <Leaf size={20} /> },
];

const FOOD_GOAL_OPTIONS = [
    { value: 'fat_loss', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Flame size={20} /> Fat Loss</span> },
    { value: 'muscle_gain', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Zap size={20} /> Muscle Gain</span> },
];

const MEAL_TYPE_OPTIONS = [
    { value: 'breakfast', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Sunrise size={20} /> Breakfast</span> },
    { value: 'lunch', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Sun size={20} /> Lunch</span> },
    { value: 'dinner', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Moon size={20} /> Dinner</span> },
];

const DIET_TYPE_OPTIONS = [
    { value: 'veg', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Leaf size={20} /> Vegetarian</span> },
    { value: 'non-veg', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Utensils size={20} /> Non-Vegetarian</span> },
];

export default function FoodPlan() {
    const { token } = useAuth();
    const { userMacros } = useMacros();
    const { foodPlan, setFoodPlan, foodPlanLoading, foodPlanError, triggerGenerateFoodPlan } = usePlan();
    const [macros, setMacros] = useState(null);

    const calTarget = userMacros?.calories || macros?.calories?.target || 2200;
    const proTarget = userMacros?.protein || macros?.protein?.target || 150;
    const fatTarget = userMacros?.fats || macros?.fats?.target || 70;

    const cal = { current: Math.round(macros?.calories?.current || 0), target: calTarget };
    const pro = { current: Math.round(macros?.protein?.current || 0), target: proTarget };
    const fat = { current: Math.round(macros?.fats?.current || 0), target: fatTarget };

    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Generated food item logging state
    const [loggedItemIds, setLoggedItemIds] = useState({});
    const [loggingItemIndex, setLoggingItemIndex] = useState(null);

    // Search state
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef(null);

    // Messages
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Wizard state
    const [wizardActive, setWizardActive] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardAttemptedNext, setWizardAttemptedNext] = useState(false);
    const [wizardData, setWizardData] = useState({
        age: '', gender: '', height: '', weight: '',
        goal: '', mealType: '', dietType: '',
    });

    const updateMacrosOptimistically = (cal, prot, fat) => {
        setMacros((prev) => {
            const base = prev || {
                calories: { current: 0, target: calTarget },
                protein: { current: 0, target: proTarget },
                fats: { current: 0, target: fatTarget },
            };
            return {
                ...base,
                calories: { ...base.calories, current: Math.round((base.calories?.current || 0) + Number(cal || 0)) },
                protein: { ...base.protein, current: Math.round((base.protein?.current || 0) + Number(prot || 0)) },
                fats: { ...base.fats, current: Math.round((base.fats?.current || 0) + Number(fat || 0)) },
            };
        });
    };

    const addMealOptimistically = (foodName, cal, prot, fat) => {
        const tempMeal = {
            id: 'temp_' + Date.now(),
            food_name: foodName,
            calories: Number(cal || 0),
            protein: Number(prot || 0),
            fats: Number(fat || 0),
            date: getLocalDateString(),
        };
        setMeals((prev) => [tempMeal, ...(prev || [])]);
    };

    const handleLogGeneratedItem = async (item, index) => {
        setLoggingItemIndex(index);
        setSuccessMsg('');
        setErrorMsg('');
        updateMacrosOptimistically(item.calories, item.protein, item.fats);
        addMealOptimistically(item.food_name, item.calories, item.protein, item.fats);
        try {
            await logMeal(token, {
                food_name: item.food_name,
                calories: item.calories,
                protein: item.protein,
                fats: item.fats,
            });
            setLoggedItemIds((prev) => ({ ...prev, [index]: true }));
            setSuccessMsg(`Logged ${item.food_name}!`);
            await loadData();
        } catch (err) {
            setErrorMsg(sanitizeErrorMessage(err.message, 'Meal Service'));
            await loadData();
        } finally {
            setLoggingItemIndex(null);
        }
    };

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [summaryRes, mealsRes] = await Promise.allSettled([
                fetchMealSummary(token),
                fetchMeals(token),
            ]);

            let mealList = [];
            if (mealsRes.status === 'fulfilled' && Array.isArray(mealsRes.value)) {
                mealList = mealsRes.value;
                setMeals(mealList);
            }

            let summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value : null;

            // If summary returns zero current macros but mealList has today's meals, compute totals directly
            const todayStr = getLocalDateString();
            const todayMeals = mealList.filter((m) => {
                if (!m.date) return false;
                const d = getLocalDateString(m.date);
                return d === todayStr;
            });

            const totalCal = todayMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
            const totalPro = todayMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
            const totalFat = todayMeals.reduce((sum, m) => sum + (Number(m.fats) || 0), 0);

            if (summaryData && (summaryData.calories?.current > 0 || todayMeals.length === 0)) {
                setMacros(summaryData);
            } else {
                setMacros({
                    calories: { current: totalCal, target: calTarget },
                    protein: { current: totalPro, target: proTarget },
                    fats: { current: totalFat, target: fatTarget },
                });
            }
        } catch (err) {
            console.error('Error loading FoodPlan data:', err);
        } finally {
            setLoading(false);
        }
    }, [token, calTarget, proTarget, fatTarget]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Live search with debounce
    const handleSearch = (value) => {
        setQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (value.length < 2) {
            setResults([]);
            return;
        }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await searchFoods(value, token);
                setResults(data);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    };

    // Log a food from search results
    const handleLogFood = async (food) => {
        setSuccessMsg('');
        setErrorMsg('');
        updateMacrosOptimistically(food.calories, food.protein, food.fats);
        addMealOptimistically(food.food_name, food.calories, food.protein, food.fats);
        try {
            await logMeal(token, {
                food_name: food.food_name,
                calories: food.calories,
                protein: food.protein,
                fats: food.fats,
            });
            setSuccessMsg(`Logged ${food.food_name}!`);
            setQuery('');
            setResults([]);
            await loadData();
        } catch (err) {
            setErrorMsg(sanitizeErrorMessage(err.message, 'Meal Service'));
            await loadData();
        }
    };

    // -- Wizard helpers --
    const currentStep = FOOD_WIZARD_STEPS[wizardStep];

    const canGoNext = () => {
        const val = wizardData[currentStep.key];
        if (['gender', 'goal', 'mealType', 'dietType'].includes(currentStep.key)) return val !== '' && val !== null && val !== undefined;
        if (currentStep.key === 'age') return val !== '' && val !== null && Number(val) >= 10 && Number(val) <= 120;
        if (currentStep.key === 'height') return val !== '' && val !== null && Number(val) >= 50 && Number(val) <= 250;
        if (currentStep.key === 'weight') return val !== '' && val !== null && Number(val) >= 20 && Number(val) <= 300;
        return val !== '' && val !== null && val !== undefined;
    };

    const handleWizardNext = () => {
        setWizardAttemptedNext(true);
        if (!canGoNext()) return;
        setWizardAttemptedNext(false);
        if (wizardStep < FOOD_WIZARD_STEPS.length - 1) {
            setWizardStep(wizardStep + 1);
        } else {
            handleGenerateFoodPlan();
        }
    };

    const handleWizardBack = () => {
        setWizardAttemptedNext(false);
        if (wizardStep > 0) setWizardStep(wizardStep - 1);
    };

    const startFoodWizard = () => {
        setWizardActive(true);
        setWizardStep(0);
        setWizardAttemptedNext(false);
        setWizardData({ age: '', gender: '', height: '', weight: '', goal: '', mealType: '', dietType: '' });
    };

    // Wizard Keyboard Shortcuts (Enter -> Next, Esc -> Close)
    useEffect(() => {
        if (!wizardActive) return;
        const handleWizardKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (canGoNext()) {
                    if (wizardStep < FOOD_WIZARD_STEPS.length - 1) {
                        setWizardStep((prev) => prev + 1);
                    } else {
                        handleGenerateFoodPlan();
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

    const handleGenerateFoodPlan = () => {
        setWizardActive(false);
        triggerGenerateFoodPlan(token, {
            age: parseInt(wizardData.age),
            gender: wizardData.gender,
            height: parseFloat(wizardData.height),
            weight: parseFloat(wizardData.weight),
            goal: wizardData.goal,
            meal_type: wizardData.mealType,
            diet_type: wizardData.dietType,
        }).catch((err) => {
            console.error('Food plan generation background error:', err);
        });
    };

    const renderWizardContent = () => {
        const step = currentStep;

        if (['age', 'height', 'weight'].includes(step.key)) {
            const units = step.key === 'weight' ? 'kg' : step.key === 'height' ? 'cm' : 'years';
            const placeholder = step.key === 'age' ? '25' : step.key === 'weight' ? '70' : '175';
            const minVal = step.key === 'age' ? 10 : step.key === 'height' ? 50 : 20;
            const maxVal = step.key === 'age' ? 120 : step.key === 'height' ? 250 : 300;
            const valName = step.key === 'age' ? 'Age' : step.key === 'height' ? 'Height' : 'Weight';

            const val = wizardData[step.key];
            const num = Number(val);
            const isOutOfRange = val !== '' && (num < minVal || num > maxVal);
            const isEmptyError = wizardAttemptedNext && val === '';
            const isInvalid = isOutOfRange || isEmptyError;

            return (
                <div className="fw-input-wrap">
                    <div className={`input-field fw-number-input ${isInvalid ? 'invalid' : ''}`}>
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
                        <span className="fw-unit">{units}</span>
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
                <div className="fw-select-wrap">
                    <div className="fw-select-grid">
                        {[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }].map((opt) => (
                            <button key={opt.value} type="button"
                                className={`fw-select-card ${wizardData.gender === opt.value ? 'selected' : ''}`}
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

        if (step.key === 'goal') {
            const hasError = wizardAttemptedNext && !wizardData.goal;
            return (
                <div className="fw-select-wrap">
                    <div className="fw-select-grid">
                        {FOOD_GOAL_OPTIONS.map((opt) => (
                            <button key={opt.value} type="button"
                                className={`fw-select-card ${wizardData.goal === opt.value ? 'selected' : ''}`}
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

        if (step.key === 'mealType') {
            const hasError = wizardAttemptedNext && !wizardData.mealType;
            return (
                <div className="fw-select-wrap">
                    <div className="fw-select-grid three-col">
                        {MEAL_TYPE_OPTIONS.map((opt) => (
                            <button key={opt.value} type="button"
                                className={`fw-select-card ${wizardData.mealType === opt.value ? 'selected' : ''}`}
                                onClick={() => setWizardData({ ...wizardData, mealType: opt.value })}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select a meal type to continue</div>}
                </div>
            );
        }

        if (step.key === 'dietType') {
            const hasError = wizardAttemptedNext && !wizardData.dietType;
            return (
                <div className="fw-select-wrap">
                    <div className="fw-select-grid">
                        {DIET_TYPE_OPTIONS.map((opt) => (
                            <button key={opt.value} type="button"
                                className={`fw-select-card ${wizardData.dietType === opt.value ? 'selected' : ''}`}
                                onClick={() => setWizardData({ ...wizardData, dietType: opt.value })}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {hasError && <div className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Please select a diet preference to continue</div>}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="food-plan-page">
            <h1>Food Plan</h1>
            <p className="subtitle">Track your daily nutrition and macros</p>

            {/* Macro Progress Bars */}
            <div className="macro-cards">
                <div className="glass-card macro-card">
                    <div className="macro-card-header">
                        <span className="macro-label"><Flame size={20} /> Calories</span>
                        <span className="macro-value">{cal.current} / {cal.target}</span>
                    </div>
                    <div className="macro-bar">
                        <div className="macro-bar-fill calories"
                            style={{ width: `${Math.min((cal.current / cal.target) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="glass-card macro-card">
                    <div className="macro-card-header">
                        <span className="macro-label"><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Zap size={18} /> Protein (g)</span></span>
                        <span className="macro-value">{pro.current} / {pro.target}</span>
                    </div>
                    <div className="macro-bar">
                        <div className="macro-bar-fill protein"
                            style={{ width: `${Math.min((pro.current / pro.target) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="glass-card macro-card">
                    <div className="macro-card-header">
                        <span className="macro-label"><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Scale size={18} /> Fats (g)</span></span>
                        <span className="macro-value">{fat.current} / {fat.target}</span>
                    </div>
                    <div className="macro-bar">
                        <div className="macro-bar-fill fats"
                            style={{ width: `${Math.min((fat.current / fat.target) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>

            {/* Wizard Overlay — rendered outside glass-card to avoid stacking context issues */}
            {wizardActive && (
                <div className="fw-overlay">
                    <div className="fw-card glass-card">
                        <div className="fw-progress">
                            {FOOD_WIZARD_STEPS.map((s, i) => (
                                <div key={s.key} className={`fw-dot ${i <= wizardStep ? 'active' : ''} ${i < wizardStep ? 'done' : ''}`}>
                                    {i < wizardStep ? '✓' : i + 1}
                                </div>
                            ))}
                            <div className="fw-progress-line">
                                <div className="fw-progress-fill" style={{ width: `${(wizardStep / (FOOD_WIZARD_STEPS.length - 1)) * 100}%` }} />
                            </div>
                        </div>

                        <div className="fw-step-header">
                            <span className="fw-step-icon">{currentStep.icon}</span>
                            <h3>{currentStep.label}</h3>
                            <p className="fw-step-count">Step {wizardStep + 1} of {FOOD_WIZARD_STEPS.length}</p>
                        </div>

                        <div className="fw-step-content">
                            {renderWizardContent()}
                        </div>

                        <div className="fw-nav">
                            {wizardStep > 0 ? (
                                <button type="button" className="fw-btn-back" onClick={handleWizardBack}>← Back</button>
                            ) : (
                                <button type="button" className="fw-btn-back" onClick={() => setWizardActive(false)}><X size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Cancel</button>
                            )}
                            <AccessibleButton 
                                type="button" 
                                className="fw-btn-next" 
                                onClick={handleWizardNext} 
                                disabled={!canGoNext()}
                                disabledReason="Complete current step input before continuing."
                            >
                                {wizardStep === FOOD_WIZARD_STEPS.length - 1 ? 'Generate Plan' : 'Next →'}
                            </AccessibleButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Food Plan Section */}
            <div className="glass-card food-plan-generator">
                <div className="food-plan-gen-header">
                    <h3><Utensils size={22} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Generate Food Plan</h3>
                    <AccessibleButton 
                        className="create-plan-btn" 
                        onClick={startFoodWizard} 
                        disabled={foodPlanLoading}
                        disabledReason="Generating food plan..."
                    >
                        {foodPlanLoading ? 'Generating…' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Sparkles size={16} /> Create Food Plan</span>}
                    </AccessibleButton>
                </div>

                {foodPlanError && <div className="food-error">{foodPlanError}</div>}

                {/* Empty state */}
                {!foodPlan && !foodPlanLoading && !wizardActive && (
                    <div className="food-plan-empty">
                        <div className="food-plan-empty-icon"><Utensils size={32} /></div>
                        <p>Click <span className="accent">"Create Food Plan"</span> to get a personalized meal suggestion</p>
                    </div>
                )}

                {/* Loading */}
                {foodPlanLoading && (
                    <div className="food-plan-empty">
                        <div className="spinner" />
                        <p style={{ marginTop: '12px' }}>Generating your personalized food plan…</p>
                    </div>
                )}

                {/* Plan result */}
                {foodPlan && !wizardActive && (
                    <div className="food-plan-result animate-fade-in">
                        <div className="food-plan-summary">
                            <div className="food-plan-stat">
                                <span className="food-plan-stat-value">{foodPlan.total_calories}</span>
                                <span className="food-plan-stat-label">Total Calories</span>
                            </div>
                            <div className="food-plan-stat">
                                <span className="food-plan-stat-value">{foodPlan.total_protein}g</span>
                                <span className="food-plan-stat-label">Protein</span>
                            </div>
                            <div className="food-plan-stat">
                                <span className="food-plan-stat-value">{foodPlan.total_fats}g</span>
                                <span className="food-plan-stat-label">Fats</span>
                            </div>
                        </div>
                        <div className="food-plan-items">
                            {foodPlan.items.map((item, i) => (
                                <div key={i} className="food-plan-item">
                                    <div className="food-plan-item-num">{i + 1}</div>
                                    <div className="food-plan-item-info">
                                        <div className="food-plan-item-name">{item.food_name}</div>
                                        <div className="food-plan-item-meta">
                                            <span>{item.calories} cal</span>
                                            <span>P: {item.protein}g</span>
                                            <span>F: {item.fats}g</span>
                                            <span className="food-plan-item-serving">{item.serving}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className={`log-item-btn ${loggedItemIds[i] ? 'logged' : ''}`}
                                        onClick={() => handleLogGeneratedItem(item, i)}
                                        disabled={loggingItemIndex === i || loggedItemIds[i]}
                                    >
                                        {loggingItemIndex === i ? 'Logging...' : loggedItemIds[i] ? '✓ Logged' : '+ Log Food'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="clear-food-plan-wrap">
                            <button
                                type="button"
                                className="clear-food-plan-btn"
                                onClick={() => {
                                    setFoodPlan(null);
                                    setLoggedItemIds({});
                                }}
                            >
                                <Trash2 size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Clear Results
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Food */}
            <div className="glass-card log-food-card">
                <h3>Log Food</h3>
                {successMsg && <div className="food-success">{successMsg}</div>}
                {errorMsg && <div className="food-error">{errorMsg}</div>}
                <div className="log-food-methods">
                    <div className="log-method">
                        <h4><Search size={20} /> Search by Name</h4>
                        <div className="input-field">
                            <span className="icon"><Search size={20} /></span>
                            <input
                                type="text"
                                placeholder="e.g. Chicken Rice, Banana..."
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        {searching && <p className="search-hint">Searching...</p>}
                        {results.length > 0 && (
                            <div className="search-results">
                                {results.map((food, i) => (
                                    <div key={i} className="search-result-item" onClick={() => handleLogFood(food)}>
                                        <div className="result-name">{food.food_name}</div>
                                        <div className="result-meta">
                                            <span>{food.calories} cal</span>
                                            <span>P: {food.protein}g</span>
                                            <span>F: {food.fats}g</span>
                                            <span className="result-serving">{food.serving}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {query.length >= 2 && results.length === 0 && !searching && (
                            <p className="search-hint">No results found for "{query}"</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Today's Meals */}
            {(() => {
                const todayStr = getLocalDateString();
                const todayMeals = meals
                    .filter((m) => {
                        if (!m.date) return false;
                        const d = getLocalDateString(m.date);
                        return d === todayStr;
                    })
                    .sort((a, b) => (b.id || 0) - (a.id || 0));

                return (
                    <div className="glass-card meals-card">
                        <h3>Today's Meals ({todayMeals.length})</h3>
                        {todayMeals.length === 0 ? (
                            <div className="meals-empty">
                                <p>No meals logged today yet. Start by searching a food above!</p>
                            </div>
                        ) : (
                            <div className="meals-list">
                                {todayMeals.map((meal) => (
                                    <div key={meal.id} className="meal-item">
                                        <div className="meal-name">{meal.food_name}</div>
                                        <div className="meal-stats">
                                            <span className="meal-cal">{meal.calories} cal</span>
                                            <span>P: {meal.protein}g</span>
                                            <span>F: {meal.fats}g</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

