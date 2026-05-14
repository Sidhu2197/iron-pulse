import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { searchFoods, logMeal, fetchMeals, fetchMealSummary, generateFoodPlan } from '../api/auth';
import './FoodPlan.css';

const FOOD_WIZARD_STEPS = [
    { key: 'age', label: 'How old are you?', icon: '🎂' },
    { key: 'gender', label: 'What\'s your gender?', icon: '👤' },
    { key: 'height', label: 'What\'s your height?', icon: '📏' },
    { key: 'weight', label: 'What\'s your weight?', icon: '⚖️' },
    { key: 'goal', label: 'What\'s your goal?', icon: '🎯' },
    { key: 'mealType', label: 'Which meal?', icon: '🍽️' },
    { key: 'dietType', label: 'Diet preference?', icon: '🥗' },
];

const FOOD_GOAL_OPTIONS = [
    { value: 'fat_loss', label: '🔥 Fat Loss' },
    { value: 'muscle_gain', label: '💪 Muscle Gain' },
];

const MEAL_TYPE_OPTIONS = [
    { value: 'breakfast', label: '🌅 Breakfast' },
    { value: 'lunch', label: '☀️ Lunch' },
    { value: 'dinner', label: '🌙 Dinner' },
];

const DIET_TYPE_OPTIONS = [
    { value: 'veg', label: '🥬 Vegetarian' },
    { value: 'nonveg', label: '🍗 Non-Vegetarian' },
];

export default function FoodPlan() {
    const { token } = useAuth();
    const [macros, setMacros] = useState(null);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

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
    const [wizardData, setWizardData] = useState({
        age: '', gender: '', height: '', weight: '',
        goal: '', mealType: '', dietType: '',
    });
    const [foodPlan, setFoodPlan] = useState(null);
    const [foodPlanLoading, setFoodPlanLoading] = useState(false);
    const [foodPlanError, setFoodPlanError] = useState('');

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [summary, mealList] = await Promise.all([
                fetchMealSummary(token),
                fetchMeals(token),
            ]);
            setMacros(summary);
            setMeals(mealList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

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
        try {
            await logMeal(token, {
                food_name: food.food_name,
                calories: food.calories,
                protein: food.protein,
                fats: food.fats,
            });
            setSuccessMsg(`Logged ${food.food_name}! 🎉`);
            setQuery('');
            setResults([]);
            await loadData(); // Refresh
        } catch (err) {
            setErrorMsg(err.message);
        }
    };

    // -- Wizard helpers --
    const currentStep = FOOD_WIZARD_STEPS[wizardStep];

    const canGoNext = () => {
        const val = wizardData[currentStep.key];
        if (['gender', 'goal', 'mealType', 'dietType'].includes(currentStep.key)) return val !== '';
        return val !== '' && Number(val) > 0;
    };

    const handleWizardNext = () => {
        if (wizardStep < FOOD_WIZARD_STEPS.length - 1) {
            setWizardStep(wizardStep + 1);
        } else {
            handleGenerateFoodPlan();
        }
    };

    const handleWizardBack = () => {
        if (wizardStep > 0) setWizardStep(wizardStep - 1);
    };

    const startFoodWizard = () => {
        setWizardActive(true);
        setWizardStep(0);
        setWizardData({ age: '', gender: '', height: '', weight: '', goal: '', mealType: '', dietType: '' });
        setFoodPlan(null);
        setFoodPlanError('');
    };

    const handleGenerateFoodPlan = async () => {
        setWizardActive(false);
        setFoodPlanLoading(true);
        setFoodPlanError('');
        try {
            const data = await generateFoodPlan(token, {
                age: parseInt(wizardData.age),
                gender: wizardData.gender,
                height: parseFloat(wizardData.height),
                weight: parseFloat(wizardData.weight),
                goal: wizardData.goal,
                meal_type: wizardData.mealType,
                diet_type: wizardData.dietType,
            });
            setFoodPlan(data);
        } catch (err) {
            setFoodPlanError(err.message);
        } finally {
            setFoodPlanLoading(false);
        }
    };

    const renderWizardContent = () => {
        const step = currentStep;

        if (['age', 'height', 'weight'].includes(step.key)) {
            const units = step.key === 'weight' ? 'kg' : step.key === 'height' ? 'cm' : 'years';
            const placeholder = step.key === 'age' ? '25' : step.key === 'weight' ? '70' : '175';
            return (
                <div className="fw-input-wrap">
                    <div className="input-field fw-number-input">
                        <span className="icon">{step.icon}</span>
                        <input
                            type="number"
                            placeholder={placeholder}
                            value={wizardData[step.key]}
                            onChange={(e) => setWizardData({ ...wizardData, [step.key]: e.target.value })}
                            min="1"
                            autoFocus
                        />
                        <span className="fw-unit">{units}</span>
                    </div>
                </div>
            );
        }

        if (step.key === 'gender') {
            return (
                <div className="fw-select-grid">
                    {[{ value: 'male', label: '♂️ Male' }, { value: 'female', label: '♀️ Female' }].map((opt) => (
                        <button key={opt.value} type="button"
                            className={`fw-select-card ${wizardData.gender === opt.value ? 'selected' : ''}`}
                            onClick={() => setWizardData({ ...wizardData, gender: opt.value })}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            );
        }

        if (step.key === 'goal') {
            return (
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
            );
        }

        if (step.key === 'mealType') {
            return (
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
            );
        }

        if (step.key === 'dietType') {
            return (
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
            );
        }

        return null;
    };

    const cal = macros?.calories || { current: 0, target: 2200 };
    const pro = macros?.protein || { current: 0, target: 150 };
    const fat = macros?.fats || { current: 0, target: 70 };

    return (
        <div className="food-plan-page">
            <h1>Food Plan</h1>
            <p className="subtitle">Track your daily nutrition and macros</p>

            {/* Macro Progress Bars */}
            <div className="macro-cards">
                <div className="glass-card macro-card">
                    <div className="macro-card-header">
                        <span className="macro-label">🔥 Calories</span>
                        <span className="macro-value">{cal.current} / {cal.target}</span>
                    </div>
                    <div className="macro-bar">
                        <div className="macro-bar-fill calories"
                            style={{ width: `${Math.min((cal.current / cal.target) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="glass-card macro-card">
                    <div className="macro-card-header">
                        <span className="macro-label">💪 Protein (g)</span>
                        <span className="macro-value">{pro.current} / {pro.target}</span>
                    </div>
                    <div className="macro-bar">
                        <div className="macro-bar-fill protein"
                            style={{ width: `${Math.min((pro.current / pro.target) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="glass-card macro-card">
                    <div className="macro-card-header">
                        <span className="macro-label">🧈 Fats (g)</span>
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
                                <button type="button" className="fw-btn-back" onClick={() => setWizardActive(false)}>✕ Cancel</button>
                            )}
                            <button type="button" className="fw-btn-next" onClick={handleWizardNext} disabled={!canGoNext()}>
                                {wizardStep === FOOD_WIZARD_STEPS.length - 1 ? '🚀 Generate Plan' : 'Next →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Food Plan Section */}
            <div className="glass-card food-plan-generator">
                <div className="food-plan-gen-header">
                    <h3>🍽️ Generate Food Plan</h3>
                    <button className="create-plan-btn" onClick={startFoodWizard} disabled={foodPlanLoading}>
                        {foodPlanLoading ? '⏳ Generating…' : '✨ Create Food Plan'}
                    </button>
                </div>

                {foodPlanError && <div className="food-error">{foodPlanError}</div>}

                {/* Empty state */}
                {!foodPlan && !foodPlanLoading && !wizardActive && (
                    <div className="food-plan-empty">
                        <div className="food-plan-empty-icon">🍽️</div>
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
                                </div>
                            ))}
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
                        <h4>🔍 Search by Name</h4>
                        <div className="input-field">
                            <span className="icon">🔍</span>
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
                    <div className="log-method">
                        <h4>📷 Upload Image</h4>
                        <div className="upload-area">
                            <div className="upload-icon">📷</div>
                            <p>Drag & drop or click to upload</p>
                            <p style={{ fontSize: 'var(--font-xs)', marginTop: '4px' }}>
                                AI will recognize the food automatically
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Meals */}
            <div className="glass-card meals-card">
                <h3>Today's Meals ({meals.length})</h3>
                {meals.length === 0 ? (
                    <div className="meals-empty">
                        <p>No meals logged yet. Start by searching a food above!</p>
                    </div>
                ) : (
                    <div className="meals-list">
                        {meals.map((meal) => (
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
        </div>
    );
}
