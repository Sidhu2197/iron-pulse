import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMacros } from '../context/MacroContext';
import { fetchDashboard, fetchWorkouts, fetchMeals, getLocalDateString } from '../api/auth';
import PageReveal from '../components/PageReveal';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
import { Fire, Fire as Flame, Pulse as Activity, ForkKnife as Utensils, Barbell as Dumbbell, Sparkle as Sparkles, TrendUp as TrendingUp, TrendDown as TrendingDown, Target as Target, CaretRight as ChevronRight, Trophy as Award, Brain as BrainCircuit, Scales as Scale, Heart as Heart } from '@phosphor-icons/react';
import './Dashboard.css';

/* ── Utilities ─────────────────────────────────────────────── */

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

function formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatTodayDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/* ── Component ─────────────────────────────────────────────── */

export default function Dashboard() {
    const { user, token } = useAuth();
    const { userMacros } = useMacros();
    const targetCalories = userMacros?.calories || 2200;
    const targetProtein = userMacros?.protein || null;

    const [dashData, setDashData] = useState(null);
    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [recentMeals, setRecentMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState('calories');

    /* ── Data fetching ─────────────────────────────────────── */
    const loadDashboardData = useCallback(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        let isMounted = true;
        Promise.allSettled([
            fetchDashboard(token),
            fetchWorkouts(token),
            fetchMeals(token),
        ])
            .then(([dashRes, workRes, mealRes]) => {
                if (!isMounted) return;
                if (dashRes.status === 'fulfilled' && dashRes.value) setDashData(dashRes.value);
                if (workRes.status === 'fulfilled' && Array.isArray(workRes.value)) {
                    setRecentWorkouts(workRes.value);
                }
                if (mealRes.status === 'fulfilled' && Array.isArray(mealRes.value)) {
                    setRecentMeals(mealRes.value);
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [token]);

    useEffect(() => {
        const cancel = loadDashboardData();
        window.addEventListener('workout-logged', loadDashboardData);
        return () => {
            if (typeof cancel === 'function') cancel();
            window.removeEventListener('workout-logged', loadDashboardData);
        };
    }, [loadDashboardData]);

    /* ── Derived data ──────────────────────────────────────── */
    const name = user?.username || 'Champ';
    const totalBurned = dashData?.total_calories_burned ?? 0;
    const workoutCount = dashData?.workout_count ?? 0;
    const totalEaten = dashData?.total_calories_eaten ?? 0;

    // Today's data from meals/workouts
    const todayStr = getLocalDateString(new Date());

    const todayMeals = useMemo(() =>
        (recentMeals || []).filter(m => getLocalDateString(m.date || new Date()) === todayStr),
        [recentMeals, todayStr]
    );

    const todayWorkouts = useMemo(() =>
        (recentWorkouts || []).filter(w => getLocalDateString(w.date || new Date()) === todayStr),
        [recentWorkouts, todayStr]
    );

    const todayCaloriesEaten = useMemo(() =>
        todayMeals.reduce((sum, m) => sum + Number(m.calories || 0), 0),
        [todayMeals]
    );

    const todayProtein = useMemo(() =>
        todayMeals.reduce((sum, m) => sum + Number(m.protein || 0), 0),
        [todayMeals]
    );

    const todayCaloriesBurned = useMemo(() =>
        todayWorkouts.reduce((sum, w) => sum + Number(w.calories_burned || 0), 0),
        [todayWorkouts]
    );

    // Weekly chart data
    const barData = useMemo(() => {
        const hasBackendWeeklyData = Array.isArray(dashData?.weekly_workouts) && dashData.weekly_workouts.some(d => (d.Actual > 0 || d.Eaten > 0 || d.Workouts > 0));
        if (hasBackendWeeklyData) {
            return dashData.weekly_workouts.map((d) => ({
                day: d.day,
                date: d.date,
                Suggested: targetCalories,
                Actual: d.Actual ?? 0,
                Eaten: d.Eaten ?? 0,
                Workouts: d.Workouts ?? 0,
            }));
        }

        const workoutCalMap = {};
        const workoutCountMap = {};
        const mealCalMap = {};

        (recentWorkouts || []).forEach((w) => {
            const dateStr = getLocalDateString(w.date || new Date());
            const cal = Number(w.calories_burned || 0);
            workoutCalMap[dateStr] = (workoutCalMap[dateStr] || 0) + cal;
            workoutCountMap[dateStr] = (workoutCountMap[dateStr] || 0) + 1;
        });

        (recentMeals || []).forEach((m) => {
            const dateStr = getLocalDateString(m.date || new Date());
            const cal = Number(m.calories || 0);
            mealCalMap[dateStr] = (mealCalMap[dateStr] || 0) + cal;
        });

        const today = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = getLocalDateString(d);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            days.push({
                day: dayName,
                date: dateStr,
                Suggested: targetCalories,
                Actual: workoutCalMap[dateStr] || 0,
                Eaten: Math.round(mealCalMap[dateStr] || 0),
                Workouts: workoutCountMap[dateStr] || 0,
            });
        }

        return days;
    }, [dashData, recentWorkouts, recentMeals, targetCalories]);

    // Average intake
    const avgIntake = useMemo(() => {
        const totals = barData.reduce((sum, d) => sum + d.Eaten, 0);
        return Math.round(totals / 7);
    }, [barData]);

    // Net Calories
    const netCalories = totalEaten - totalBurned;
    const isDeficit = netCalories < 0;
    const isSurplus = netCalories > 0;
    const netLabel = isDeficit ? 'deficit' : isSurplus ? 'surplus' : 'balanced';

    // Calorie goal progress for today
    const calorieProgress = targetCalories > 0 ? Math.min(100, Math.round((todayCaloriesEaten / targetCalories) * 100)) : 0;
    const proteinProgress = targetProtein ? Math.min(100, Math.round((todayProtein / targetProtein) * 100)) : null;

    // Streak calculation from workout data
    const { currentStreak, bestStreak } = useMemo(() => {
        if (!recentWorkouts || recentWorkouts.length === 0) return { currentStreak: 0, bestStreak: 0 };

        const workoutDates = new Set(
            recentWorkouts.map(w => getLocalDateString(w.date || new Date()))
        );

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const ds = getLocalDateString(d);
            if (workoutDates.has(ds)) {
                streak++;
            } else {
                if (i > 0) break; // allow today to have no workout yet
            }
        }

        // best streak (simple scan)
        const sortedDates = [...workoutDates].sort();
        let best = 0;
        let run = 0;
        let prev = null;
        for (const ds of sortedDates) {
            if (prev) {
                const prevDate = new Date(prev + 'T00:00:00');
                const curDate = new Date(ds + 'T00:00:00');
                const diffDays = Math.round((curDate - prevDate) / 86400000);
                if (diffDays === 1) {
                    run++;
                } else {
                    run = 1;
                }
            } else {
                run = 1;
            }
            best = Math.max(best, run);
            prev = ds;
        }

        return { currentStreak: streak, bestStreak: best };
    }, [recentWorkouts]);

    // AI insights derived from real data
    const aiInsights = useMemo(() => {
        const insights = [];

        if (todayCaloriesEaten > 0 && targetCalories > 0) {
            if (calorieProgress >= 75 && calorieProgress <= 110) {
                insights.push({ type: 'success', text: 'Your calorie intake is within your daily target.' });
            } else if (calorieProgress < 75) {
                insights.push({ type: 'info', text: `You've consumed ${calorieProgress}% of your calorie target today.` });
            } else {
                insights.push({ type: 'warning', text: `You've exceeded your calorie target by ${calorieProgress - 100}%.` });
            }
        }

        if (targetProtein && todayProtein > 0) {
            if (proteinProgress < 70) {
                insights.push({ type: 'warning', text: `Protein intake is at ${proteinProgress}% — try to reach your ${targetProtein}g target.` });
            } else {
                insights.push({ type: 'success', text: `Protein intake is on track at ${todayProtein}g.` });
            }
        }

        if (todayWorkouts.length > 0) {
            insights.push({ type: 'success', text: `You've completed ${todayWorkouts.length} workout${todayWorkouts.length > 1 ? 's' : ''} today.` });
        } else {
            insights.push({ type: 'info', text: 'No workouts logged today — consider getting some activity in.' });
        }

        if (currentStreak >= 3) {
            insights.push({ type: 'success', text: `Great consistency! You're on a ${currentStreak}-day workout streak.` });
        }

        return insights.slice(0, 3);
    }, [todayCaloriesEaten, targetCalories, calorieProgress, targetProtein, todayProtein, proteinProgress, todayWorkouts, currentStreak]);

    /* ── Loading state ─────────────────────────────────────── */
    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dash-skeleton" style={{ height: '3.5rem', width: '40%', marginBottom: '2rem' }} />
                <div className="today-overview-grid" style={{ marginBottom: '2rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="dash-skeleton" style={{ height: '110px' }} />
                    ))}
                </div>
                <div className="dash-main-grid">
                    <div className="dash-skeleton" style={{ height: '380px' }} />
                    <div className="dash-skeleton" style={{ height: '380px' }} />
                </div>
            </div>
        );
    }

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <PageReveal className="dashboard-container">
            {/* ══════════════════════════════════════════════════
                1. HEADER
               ══════════════════════════════════════════════════ */}
            <div className="dash-header">
                <div className="dash-header-left">
                    <h1>
                        {getGreeting()}, {name}
                    </h1>
                    <p>Here's how you're doing today.</p>
                </div>
                <div className="dash-header-date">{formatTodayDate()}</div>
            </div>

            {/* ══════════════════════════════════════════════════
                2. TODAY OVERVIEW — KPI Row
               ══════════════════════════════════════════════════ */}
            <div className="today-overview-grid">
                {/* Calories Consumed */}
                <div className="kpi-card">
                    <div className="kpi-card-icon cyan">
                        <Utensils size={18} />
                    </div>
                    <div className="kpi-card-label">Calories Consumed</div>
                    <div className="kpi-card-value">
                        {todayCaloriesEaten > 0 ? todayCaloriesEaten.toLocaleString() : totalEaten.toLocaleString()}
                        <span className="kpi-unit">kcal</span>
                    </div>
                    {targetCalories > 0 && (
                        <>
                            <div className="kpi-card-sub">
                                <span className="kpi-percent">{calorieProgress}%</span> of daily goal
                            </div>
                            <div className="kpi-mini-progress">
                                <div className="kpi-mini-progress-fill cyan" style={{ width: `${calorieProgress}%` }} />
                            </div>
                        </>
                    )}
                </div>

                {/* Protein */}
                {targetProtein ? (
                    <div className="kpi-card">
                        <div className="kpi-card-icon amber">
                            <Target size={18} />
                        </div>
                        <div className="kpi-card-label">Protein</div>
                        <div className="kpi-card-value">
                            {todayProtein}<span className="kpi-unit">g</span>
                        </div>
                        <div className="kpi-card-sub">
                            <span className="kpi-percent">{proteinProgress}%</span> of daily goal
                        </div>
                        <div className="kpi-mini-progress">
                            <div className="kpi-mini-progress-fill amber" style={{ width: `${proteinProgress}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className="kpi-card">
                        <div className="kpi-card-icon amber">
                            <Utensils size={18} />
                        </div>
                        <div className="kpi-card-label">Total Intake</div>
                        <div className="kpi-card-value">
                            {totalEaten.toLocaleString()}<span className="kpi-unit">kcal</span>
                        </div>
                        <div className="kpi-card-sub">All time logged</div>
                    </div>
                )}

                {/* Calories Burned */}
                <div className="kpi-card">
                    <div className="kpi-card-icon red">
                        <Flame size={18} />
                    </div>
                    <div className="kpi-card-label">Calories Burned</div>
                    <div className="kpi-card-value">
                        {todayCaloriesBurned > 0 ? todayCaloriesBurned.toLocaleString() : totalBurned.toLocaleString()}
                        <span className="kpi-unit">kcal</span>
                    </div>
                    <div className="kpi-card-sub">
                        {todayCaloriesBurned > 0 ? 'Today' : 'All time'}
                    </div>
                </div>

                {/* Workouts */}
                <div className="kpi-card">
                    <div className="kpi-card-icon green">
                        <Dumbbell size={18} />
                    </div>
                    <div className="kpi-card-label">Workouts</div>
                    <div className="kpi-card-value">{workoutCount}</div>
                    <div className="kpi-card-sub">Total logged</div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                7. NET ENERGY BALANCE — Compact inline
               ══════════════════════════════════════════════════ */}
            <div className="net-balance-inline">
                <div className={`net-balance-icon ${netLabel}`}>
                    {isDeficit ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                </div>
                <div className="net-balance-info">
                    <div className="net-balance-label">Exercise-Adjusted Intake</div>
                    <div className="net-balance-value">
                        {Math.abs(netCalories).toLocaleString()}<span className="net-unit"> kcal {isDeficit ? 'deficit' : isSurplus ? 'surplus' : ''}</span>
                    </div>
                </div>
                <div className={`net-balance-badge ${netLabel}`}>
                    {isDeficit ? <TrendingDown size={12} /> : isSurplus ? <TrendingUp size={12} /> : <Scale size={12} />}
                    {isDeficit ? 'Deficit' : isSurplus ? 'Surplus' : 'Balanced'}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                3. MAIN CONTENT GRID
               ══════════════════════════════════════════════════ */}
            <div className="dash-main-grid">
                {/* LEFT: Weekly Chart */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-header-left">
                            <h3>{chartMode === 'calories' ? 'Weekly Calorie Balance' : 'Weekly Activity Trend'}</h3>
                            <p>
                                {chartMode === 'calories'
                                    ? 'Your intake and expenditure over the last 7 days'
                                    : 'Workout sessions logged over the last 7 days'}
                            </p>
                        </div>
                        <div className="chart-mode-pills">
                            <button
                                className={`chart-mode-pill ${chartMode === 'calories' ? 'active' : ''}`}
                                onClick={() => setChartMode('calories')}
                            >
                                <Flame size={13} /> Calories
                            </button>
                            <button
                                className={`chart-mode-pill ${chartMode === 'workouts' ? 'active' : ''}`}
                                onClick={() => setChartMode('workouts')}
                            >
                                <Activity size={13} /> Activity
                            </button>
                        </div>
                    </div>

                    {/* Chart summary */}
                    {chartMode === 'calories' && (
                        <div className="chart-summary-row">
                            <div className="chart-summary-item">
                                <div className="chart-summary-value">{avgIntake.toLocaleString()} kcal</div>
                                <div className="chart-summary-label">Avg. daily intake</div>
                            </div>
                            <div className="chart-summary-item">
                                <div className="chart-summary-value">{targetCalories.toLocaleString()} kcal</div>
                                <div className="chart-summary-label">Daily target</div>
                            </div>
                        </div>
                    )}

                    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                        <ResponsiveContainer key={chartMode} width="100%" height="100%">
                            {chartMode === 'calories' ? (
                                <BarChart data={barData} barGap={6} barCategoryGap="20%" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#00f0ff" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                                        </linearGradient>
                                        <linearGradient id="colorEaten" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dx={-5} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
                                        itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
                                        labelStyle={{ color: '#f1f5f9', fontFamily: 'var(--font-body)', fontWeight: 'bold', marginBottom: '0.5rem' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }} />
                                    <Bar dataKey="Suggested" name={`Target (${targetCalories} cal)`} fill="rgba(255, 255, 255, 0.12)" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Actual" name="Burned Cal" fill="url(#colorActual)" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Eaten" name="Food Cal" fill="url(#colorEaten)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            ) : (
                                <LineChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dx={-5} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
                                        itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
                                        labelStyle={{ color: '#f1f5f9', fontFamily: 'var(--font-body)', fontWeight: 'bold', marginBottom: '0.5rem' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="Workouts"
                                        name="Workouts Completed"
                                        stroke="#00d2ff"
                                        strokeWidth={3.5}
                                        dot={{ r: 6, fill: '#0066ff', stroke: '#00d2ff', strokeWidth: 2 }}
                                        activeDot={{ r: 8, fill: '#00d2ff', stroke: '#ffffff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT: AI Coach */}
                <div className="dash-card ai-coach-card">
                    <div className="dash-card-header">
                        <div className="dash-card-header-left">
                            <h3>AI Coach</h3>
                            <p>Your daily fitness insights</p>
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BrainCircuit size={16} />
                        </div>
                    </div>

                    <div className="ai-coach-status">
                        <div className="ai-coach-status-icon">
                            <Sparkles size={16} />
                        </div>
                        <div className="ai-coach-status-text">
                            {todayCaloriesEaten > 0 || todayWorkouts.length > 0
                                ? "You're making progress today."
                                : "Start logging to get personalized insights."}
                        </div>
                    </div>

                    <div className="ai-insights-list">
                        {aiInsights.length > 0 ? (
                            aiInsights.map((insight, idx) => (
                                <div key={idx} className="ai-insight-item">
                                    <div className={`ai-insight-icon ${insight.type}`}>
                                        {insight.type === 'success' ? <TrendingUp size={14} /> :
                                            insight.type === 'warning' ? <TrendingDown size={14} /> :
                                                <Activity size={14} />}
                                    </div>
                                    <div className="ai-insight-text">{insight.text}</div>
                                </div>
                            ))
                        ) : (
                            <div className="ai-insight-item">
                                <div className="ai-insight-icon info"><Activity size={14} /></div>
                                <div className="ai-insight-text">Log meals and workouts to see insights here.</div>
                            </div>
                        )}
                    </div>

                    <div className="ai-coach-actions">
                        <Link to="/calorie-predictor" className="ai-action-link">
                            <Sparkles size={14} style={{ color: '#a78bfa' }} />
                            View Calorie Insights
                            <ChevronRight size={14} className="action-arrow" />
                        </Link>
                        <Link to="/recovery" className="ai-action-link">
                            <Heart size={14} style={{ color: '#f87171' }} />
                            Check Recovery
                            <ChevronRight size={14} className="action-arrow" />
                        </Link>
                        <Link to="/workout" className="ai-action-link">
                            <Dumbbell size={14} style={{ color: '#22d3ee' }} />
                            Generate Workout
                            <ChevronRight size={14} className="action-arrow" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                4 & 5. PROGRESS + STREAK
               ══════════════════════════════════════════════════ */}
            <div className="dash-progress-grid">
                {/* Today's Progress */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <div className="dash-card-header-left">
                            <h3>Today's Progress</h3>
                        </div>
                    </div>
                    <div className="progress-list">
                        {/* Calories Progress */}
                        <div className="progress-row">
                            <div className="progress-row-header">
                                <div className="progress-row-label">
                                    <Flame size={14} style={{ color: '#22d3ee' }} />
                                    Calories
                                </div>
                                <div className="progress-row-values">
                                    {todayCaloriesEaten > 0
                                        ? `${todayCaloriesEaten.toLocaleString()} / ${targetCalories.toLocaleString()} kcal`
                                        : `${totalEaten.toLocaleString()} kcal total`}
                                    {todayCaloriesEaten > 0 && <span className="progress-row-percent">{calorieProgress}%</span>}
                                </div>
                            </div>
                            <div className="progress-bar-track">
                                <div className="progress-bar-value cyan" style={{ width: `${calorieProgress}%` }} />
                            </div>
                        </div>

                        {/* Protein Progress — only if macros configured */}
                        {targetProtein && (
                            <div className="progress-row">
                                <div className="progress-row-header">
                                    <div className="progress-row-label">
                                        <Target size={14} style={{ color: '#fbbf24' }} />
                                        Protein
                                    </div>
                                    <div className="progress-row-values">
                                        {todayProtein}g / {targetProtein}g
                                        <span className="progress-row-percent">{proteinProgress}%</span>
                                    </div>
                                </div>
                                <div className="progress-bar-track">
                                    <div className="progress-bar-value amber" style={{ width: `${proteinProgress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Workout Burn Progress */}
                        <div className="progress-row">
                            <div className="progress-row-header">
                                <div className="progress-row-label">
                                    <Activity size={14} style={{ color: '#f87171' }} />
                                    Burned Today
                                </div>
                                <div className="progress-row-values">
                                    {todayCaloriesBurned.toLocaleString()} kcal
                                </div>
                            </div>
                            <div className="progress-bar-track">
                                <div
                                    className="progress-bar-value red"
                                    style={{ width: `${targetCalories > 0 ? Math.min(100, Math.round((todayCaloriesBurned / (targetCalories * 0.3)) * 100)) : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Today's Workouts */}
                        <div className="progress-row">
                            <div className="progress-row-header">
                                <div className="progress-row-label">
                                    <Dumbbell size={14} style={{ color: '#34d399' }} />
                                    Workouts Today
                                </div>
                                <div className="progress-row-values">
                                    {todayWorkouts.length} session{todayWorkouts.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <div className="progress-bar-track">
                                <div
                                    className="progress-bar-value green"
                                    style={{ width: `${Math.min(100, todayWorkouts.length * 50)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weekly Fitness Streak */}
                <div className="dash-card">
                    <div className="streak-content">
                        <div className="streak-icon">
                            <Fire size={36} weight="fill" className="streak-fire-icon" />
                        </div>
                        <div className="streak-number">{currentStreak}</div>
                        <div className="streak-label">{currentStreak === 1 ? 'day' : 'days'} current streak</div>
                        {bestStreak > 0 && (
                            <div className="streak-best">
                                <Award size={14} style={{ color: '#fbbf24' }} />
                                Best: <strong>{bestStreak} days</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                6. RECENT ACTIVITY
               ══════════════════════════════════════════════════ */}
            <div className="dash-card">
                <div className="dash-section-header">
                    <h3 className="dash-section-title">Recent Activity</h3>
                    <Link to="/workout" className="view-all-link">
                        View all <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="activity-dual-feed">
                    {/* Workouts Feed */}
                    <div>
                        <div className="activity-col-title">
                            <Activity size={14} style={{ color: '#f87171' }} />
                            Recent Workouts
                        </div>
                        {recentWorkouts.length === 0 ? (
                            <div className="empty-activity-card">
                                <p>No workouts logged yet.</p>
                                <Link to="/workout">+ Log your first workout</Link>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {[...recentWorkouts]
                                    .sort((a, b) => {
                                        if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
                                        return (b.id || 0) - (a.id || 0);
                                    })
                                    .slice(0, 4)
                                    .map((w, idx) => (
                                        <div key={w.id || idx} className="activity-item">
                                            <div className="activity-item-icon red">
                                                <Flame size={14} />
                                            </div>
                                            <div className="activity-item-details">
                                                <span className="activity-item-title">{w.workout_name || 'Workout'}</span>
                                                <span className="activity-item-meta">
                                                    {w.duration ? `${w.duration} min` : ''}
                                                    {w.date ? ` · ${formatRelativeDate(w.date)}` : ''}
                                                </span>
                                            </div>
                                            <span className="activity-item-stat">{w.calories_burned} kcal</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Meals Feed */}
                    <div>
                        <div className="activity-col-title">
                            <Utensils size={14} style={{ color: '#fbbf24' }} />
                            Recent Meals
                        </div>
                        {recentMeals.length === 0 ? (
                            <div className="empty-activity-card">
                                <p>No meals logged yet.</p>
                                <Link to="/food-plan">+ Log a meal</Link>
                            </div>
                        ) : (
                            <div className="activity-list">
                                {[...recentMeals]
                                    .sort((a, b) => {
                                        if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
                                        return (b.id || 0) - (a.id || 0);
                                    })
                                    .slice(0, 4)
                                    .map((m, idx) => (
                                        <div key={m.id || idx} className="activity-item">
                                            <div className="activity-item-icon amber">
                                                <Utensils size={14} />
                                            </div>
                                            <div className="activity-item-details">
                                                <span className="activity-item-title">{m.food_name || 'Meal'}</span>
                                                <span className="activity-item-meta">
                                                    {m.protein ? `${m.protein}g protein` : ''}
                                                    {m.fats ? ` · ${m.fats}g fat` : ''}
                                                    {m.date ? ` · ${formatRelativeDate(m.date)}` : ''}
                                                </span>
                                            </div>
                                            <span className="activity-item-stat">{Math.round(m.calories)} kcal</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageReveal>
    );
}
