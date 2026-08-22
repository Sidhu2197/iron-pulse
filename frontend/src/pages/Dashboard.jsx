import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchDashboard, fetchWorkouts, fetchMeals } from '../api/auth';
import PageReveal from '../components/PageReveal';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    Flame, Activity, Utensils, Dumbbell, Sparkles, Calculator,
    TrendingUp, TrendingDown, Target, ChevronRight, Zap, Award, CheckCircle2
} from 'lucide-react';
import './Dashboard.css';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
}

export default function Dashboard() {
    const { user, token } = useAuth();
    const [dashData, setDashData] = useState(null);
    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [recentMeals, setRecentMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState('calories'); // 'calories' | 'workouts'

    useEffect(() => {
        if (token) {
            Promise.allSettled([
                fetchDashboard(token),
                fetchWorkouts(token),
                fetchMeals(token),
            ])
                .then(([dashRes, workRes, mealRes]) => {
                    if (dashRes.status === 'fulfilled') setDashData(dashRes.value);
                    if (workRes.status === 'fulfilled' && Array.isArray(workRes.value)) {
                        setRecentWorkouts(workRes.value.slice(-4).reverse());
                    }
                    if (mealRes.status === 'fulfilled' && Array.isArray(mealRes.value)) {
                        setRecentMeals(mealRes.value.slice(-4).reverse());
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const name = user?.username || 'Champ';
    const totalBurned = dashData?.total_calories_burned ?? 0;
    const workoutCount = dashData?.workout_count ?? 0;
    const totalEaten = dashData?.total_calories_eaten ?? 0;
    const barData = (() => {
        // 1. If backend returned weekly_workouts with data
        const hasBackendWeeklyData = dashData?.weekly_workouts && dashData.weekly_workouts.some(d => (d.Actual > 0 || d.Eaten > 0 || d.Workouts > 0));
        if (hasBackendWeeklyData) {
            return dashData.weekly_workouts.map((d) => ({
                day: d.day,
                date: d.date,
                Suggested: d.Suggested ?? 500,
                Actual: d.Actual ?? 0,
                Eaten: d.Eaten ?? 0,
                Workouts: d.Workouts ?? 0,
            }));
        }

        // 2. Fallback: Dynamically aggregate last 7 days from recentWorkouts and recentMeals lists
        const workoutCalMap = {};
        const workoutCountMap = {};
        const mealCalMap = {};

        (recentWorkouts || []).forEach((w) => {
            const dateStr = (w.date || new Date().toISOString()).split('T')[0];
            const cal = Number(w.calories_burned || 0);
            workoutCalMap[dateStr] = (workoutCalMap[dateStr] || 0) + cal;
            workoutCountMap[dateStr] = (workoutCountMap[dateStr] || 0) + 1;
        });

        (recentMeals || []).forEach((m) => {
            const dateStr = (m.date || new Date().toISOString()).split('T')[0];
            const cal = Number(m.calories || 0);
            mealCalMap[dateStr] = (mealCalMap[dateStr] || 0) + cal;
        });

        const today = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            days.push({
                day: dayName,
                date: dateStr,
                Suggested: 500,
                Actual: workoutCalMap[dateStr] || 0,
                Eaten: Math.round(mealCalMap[dateStr] || 0),
                Workouts: workoutCountMap[dateStr] || 0,
            });
        }

        return days;
    })();

    // Net Calories calculation
    const netCalories = totalEaten - totalBurned;
    const isDeficit = netCalories < 0;
    const isSurplus = netCalories > 0;

    // Daily target progress calculations
    const dailyTargetBurned = 500;
    const burnProgress = Math.min(100, Math.round((totalBurned / (dailyTargetBurned * 7 || 1)) * 100));
    if (loading) {
        return (
            <div className="ml-container page-enter" style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
                <div style={{ height: '3rem', width: '30%', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div className="quick-actions-grid" style={{ marginBottom: '2rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ height: '90px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    ))}
                </div>
                <div className="dashboard-grid">
                    <div className="main-col">
                        <div style={{ height: '400px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    </div>
                    <div className="side-col">
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: '120px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                        ))}
                    </div>
                </div>
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
            </div>
        );
    }

    return (
        <PageReveal className="ml-container page-enter" style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
            {/* Header Greeting */}
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-greeting">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                        {getGreeting()}, <span style={{ color: 'var(--accent-cyan)' }}>{name}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                        Track your progress, generate AI plans, and reach your fitness targets.
                    </p>
                </div>
            </div>

            {/* Quick Action Launcher Grid */}
            <div className="quick-actions-grid" style={{ marginBottom: '2rem' }}>
                <Link to="/workout" className="quick-action-card glow-card">
                    <div className="quick-action-icon cyan">
                        <Dumbbell size={22} />
                    </div>
                    <div className="quick-action-text">
                        <span className="quick-action-title">AI Workout Generator</span>
                        <span className="quick-action-sub">Build custom routines</span>
                    </div>
                    <ChevronRight size={18} className="quick-action-arrow" />
                </Link>

                <Link to="/food-plan" className="quick-action-card glow-card">
                    <div className="quick-action-icon amber">
                        <Utensils size={22} />
                    </div>
                    <div className="quick-action-text">
                        <span className="quick-action-title">Meal & Nutrition Tracker</span>
                        <span className="quick-action-sub">Generate food plans</span>
                    </div>
                    <ChevronRight size={18} className="quick-action-arrow" />
                </Link>

                <Link to="/calorie-predictor" className="quick-action-card glow-card">
                    <div className="quick-action-icon purple">
                        <Sparkles size={22} />
                    </div>
                    <div className="quick-action-text">
                        <span className="quick-action-title">Predict Calorie Burn</span>
                        <span className="quick-action-sub">ML energy estimation</span>
                    </div>
                    <ChevronRight size={18} className="quick-action-arrow" />
                </Link>

                <Link to="/bmi-calculator" className="quick-action-card glow-card">
                    <div className="quick-action-icon green">
                        <Calculator size={22} />
                    </div>
                    <div className="quick-action-text">
                        <span className="quick-action-title">BMI Calculator</span>
                        <span className="quick-action-sub">Check body metrics</span>
                    </div>
                    <ChevronRight size={18} className="quick-action-arrow" />
                </Link>
            </div>

            {/* Main Dashboard Layout */}
            <div className="dashboard-grid">
                <div className="main-col">
                    {/* Weekly Analytics Chart Panel */}
                    <div className="glow-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    Weekly Caloric Breakdown
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Suggested vs actual calories burned over the last 7 days
                                </p>
                            </div>
                            <div className="chart-mode-pills">
                                <button
                                    className={`chart-mode-pill ${chartMode === 'calories' ? 'active' : ''}`}
                                    onClick={() => setChartMode('calories')}
                                >
                                    <Flame size={14} /> Calories
                                </button>
                                <button
                                    className={`chart-mode-pill ${chartMode === 'workouts' ? 'active' : ''}`}
                                    onClick={() => setChartMode('workouts')}
                                >
                                    <Activity size={14} /> Activity
                                </button>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: 320, minWidth: 0, position: 'relative' }}>
                            <ResponsiveContainer key={chartMode} width="100%" height="100%">
                                <BarChart data={barData} barGap={6} barCategoryGap="20%" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#00f0ff" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8}/>
                                        </linearGradient>
                                        <linearGradient id="colorEaten" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.8}/>
                                        </linearGradient>
                                        <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
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
                                    {chartMode === 'calories' ? (
                                        <>
                                            <Bar dataKey="Suggested" name="Target (500 cal)" fill="rgba(255, 255, 255, 0.12)" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="Actual" name="Burned Cal" fill="url(#colorActual)" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="Eaten" name="Food Cal" fill="url(#colorEaten)" radius={[6, 6, 0, 0]} />
                                        </>
                                    ) : (
                                        <Bar dataKey="Workouts" name="Workouts Count" fill="url(#colorWorkouts)" radius={[6, 6, 0, 0]} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Activity Timeline Feed */}
                    <div className="glow-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Zap size={20} style={{ color: 'var(--accent-cyan)' }} /> Recent Activity Log
                            </h3>
                            <Link to="/workout" style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                View All <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div className="activity-dual-feed">
                            {/* Workouts Feed */}
                            <div className="activity-col">
                                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Activity size={16} style={{ color: '#ef4444' }} /> Recent Workouts
                                </h4>
                                {recentWorkouts.length === 0 ? (
                                    <div className="empty-activity-card">
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No workouts logged yet today.</p>
                                        <Link to="/workout" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>
                                            + Log your first workout
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="activity-list">
                                        {recentWorkouts.map((w, idx) => (
                                            <div key={w.id || idx} className="activity-item">
                                                <div className="activity-item-icon red">
                                                    <Flame size={16} />
                                                </div>
                                                <div className="activity-item-details">
                                                    <span className="activity-item-title">{w.workout_name || 'Workout'}</span>
                                                    <span className="activity-item-meta">{w.duration ? `${w.duration} mins` : ''} {w.date ? `• ${w.date}` : ''}</span>
                                                </div>
                                                <span className="activity-item-stat red">+{w.calories_burned} kcal</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Meals Feed */}
                            <div className="activity-col">
                                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Utensils size={16} style={{ color: '#f59e0b' }} /> Recent Meals
                                </h4>
                                {recentMeals.length === 0 ? (
                                    <div className="empty-activity-card">
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No meals logged yet today.</p>
                                        <Link to="/food-plan" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>
                                            + Log a meal
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="activity-list">
                                        {recentMeals.map((m, idx) => (
                                            <div key={m.id || idx} className="activity-item">
                                                <div className="activity-item-icon amber">
                                                    <Utensils size={16} />
                                                </div>
                                                <div className="activity-item-details">
                                                    <span className="activity-item-title">{m.food_name || 'Meal'}</span>
                                                    <span className="activity-item-meta">P: {m.protein || 0}g • F: {m.fats || 0}g</span>
                                                </div>
                                                <span className="activity-item-stat amber">+{Math.round(m.calories)} kcal</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="side-col">
                    {/* Net Calories Card */}
                    <div className="glow-card net-calories-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Target size={14} /> Net Energy Balance
                            </span>
                            <span className={`net-status-badge ${isDeficit ? 'deficit' : isSurplus ? 'surplus' : 'balanced'}`}>
                                {isDeficit ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                {isDeficit ? 'Deficit' : isSurplus ? 'Surplus' : 'Balanced'}
                            </span>
                        </div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {netCalories > 0 ? `+${netCalories.toLocaleString()}` : netCalories.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>kcal</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {isDeficit
                                ? '🔥 Great job! You are in a caloric deficit today.'
                                : isSurplus
                                ? '⚡ Energy surplus accumulated today.'
                                : '⚖️ Perfectly balanced caloric intake.'}
                        </div>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${burnProgress}%` }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Weekly Target: {dailyTargetBurned * 7} kcal</span>
                            <span>{burnProgress}%</span>
                        </div>
                    </div>

                    {/* Stat Card: Calories Burned */}
                    <div className="glow-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Flame size={24} />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Total Calories Burned</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalBurned.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Stat Card: Workouts Done */}
                    <div className="glow-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Activity size={24} />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Workouts Completed</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{workoutCount}</div>
                        </div>
                    </div>

                    {/* Stat Card: Calories Eaten */}
                    <div className="glow-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Utensils size={24} />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Calories Intake</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalEaten.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Streak Motivation Card */}
                    <div className="glow-card streak-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <Award size={22} style={{ color: 'var(--accent-cyan)' }} />
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Weekly Fitness Streak</h4>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                            Consistent effort yields maximum gains. Keep logging your daily workouts!
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Active Routine Tracked</span>
                        </div>
                    </div>
                </div>
            </div>
        </PageReveal>
    );
}
