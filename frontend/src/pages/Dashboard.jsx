import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboard } from '../api/auth';
import PageReveal from '../components/PageReveal';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
import { Flame, Activity, Utensils } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchDashboard(token)
                .then(setDashData)
                .catch(() => { })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const name = dashData?.greeting_name || user?.username || 'Champ';
    const totalBurned = dashData?.total_calories_burned ?? 0;
    const workoutCount = dashData?.workout_count ?? 0;
    const totalEaten = dashData?.total_calories_eaten ?? 0;
    const barData = dashData?.weekly_workouts || [];

    if (loading) {
        return (
            <div className="ml-container page-enter" style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
                <div style={{ height: '3rem', width: '30%', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div className="dashboard-grid">
                    <div className="main-col">
                        <div style={{ height: '400px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    </div>
                    <div className="side-col">
                        <div style={{ height: '140px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                        <div style={{ height: '140px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                        <div style={{ height: '140px', width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    </div>
                </div>
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
            </div>
        );
    }

    return (
        <PageReveal className="ml-container page-enter" style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
            <div className="dashboard-greeting" style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{getGreeting()}, <span style={{ color: 'var(--accent-cyan)' }}>{name}</span></h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Let's crush today's goals!</p>
            </div>

            <div className="dashboard-grid">
                <div className="main-col">
                    <div className="glass-panel glow-card" style={{ padding: '2rem', height: '100%' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Suggested vs Actual Calories Burned</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={barData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="day" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ background: '#0a0c10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, boxShadow: 'var(--shadow-md)' }}
                                    itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
                                    labelStyle={{ color: '#f1f5f9', fontFamily: 'var(--font-body)', fontWeight: 'bold', marginBottom: '0.5rem' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }} />
                                <Bar dataKey="Suggested" fill="var(--bg-inset)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Actual" fill="url(#colorActual)" radius={[4, 4, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0.6}/>
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="side-col">
                    <div className="glass-panel glow-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Calories Burned</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalBurned.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="glass-panel glow-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Workouts Done</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{workoutCount}</div>
                        </div>
                    </div>

                    <div className="glass-panel glow-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Utensils size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>Calories Eaten</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalEaten.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </PageReveal>
    );
}
