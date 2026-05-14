import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboard } from '../api/auth';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
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
            <div className="dashboard">
                <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-greeting">
                <h1>{getGreeting()}, <span className="name">{name}</span></h1>
                <p className="streak-msg">💪 Let's crush today's goals!</p>
            </div>

            <div className="stat-cards">
                <div className="glass-card stat-card">
                    <div className="stat-card-icon red">🔥</div>
                    <div className="stat-value">{totalBurned.toLocaleString()}</div>
                    <div className="stat-label">Calories Burned</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-card-icon green">💪</div>
                    <div className="stat-value">{workoutCount}</div>
                    <div className="stat-label">Workouts Done</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-card-icon yellow">🍽️</div>
                    <div className="stat-value">{totalEaten.toLocaleString()}</div>
                    <div className="stat-label">Calories Eaten</div>
                </div>

            </div>

            <div className="chart-row">
                <div className="glass-card chart-card">
                    <h3>Suggested vs Actual Calories Burned</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                                labelStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend />
                            <Bar dataKey="Suggested" fill="#166534" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
