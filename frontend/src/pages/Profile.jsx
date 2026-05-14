import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWorkouts, updateProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
    const { user, token, logout, setUser } = useAuth();
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState(true);

    // Edit-profile state
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', age: '', height: '', weight: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    const name = user?.username || 'User';
    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        if (token) {
            fetchWorkouts(token)
                .then(setWorkouts)
                .catch(() => { })
                .finally(() => setLoadingWorkouts(false));
        } else {
            setLoadingWorkouts(false);
        }
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const openEdit = () => {
        setEditForm({
            username: user?.username || '',
            age: user?.age || '',
            height: user?.height || '',
            weight: user?.weight || '',
        });
        setEditError('');
        setEditSuccess('');
        setEditing(true);
    };

    const handleEditChange = (e) => {
        setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError('');
        setEditSuccess('');
        try {
            const updated = await updateProfile(token, editForm);
            // Extract only user fields from the API response wrapper
            const { username, email, age, height, weight } = updated;
            setUser({ username, email, age, height, weight });
            setEditSuccess('Profile updated successfully!');
            setTimeout(() => setEditing(false), 1200);
        } catch (err) {
            setEditError(err.message || 'Update failed');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <h1>Profile</h1>
            <p className="subtitle">Your fitness profile and progress</p>

            <div className="glass-card profile-card">
                <div className="profile-avatar">
                    <div className="avatar-circle">{initials}</div>
                    <div className="avatar-info">
                        <h2>{name}</h2>
                        <p>{user?.email || 'No email'}</p>
                    </div>
                </div>

                {editing ? (
                    <form className="profile-edit-form" onSubmit={handleEditSave}>
                        <div className="profile-edit-row">
                            <label>Username</label>
                            <input
                                name="username"
                                value={editForm.username}
                                onChange={handleEditChange}
                                placeholder="Username"
                            />
                        </div>
                        <div className="profile-edit-row">
                            <label>Age (yrs)</label>
                            <input
                                name="age"
                                type="number"
                                min="1"
                                value={editForm.age}
                                onChange={handleEditChange}
                                placeholder="Age"
                            />
                        </div>
                        <div className="profile-edit-row">
                            <label>Height (cm)</label>
                            <input
                                name="height"
                                type="number"
                                min="1"
                                step="0.1"
                                value={editForm.height}
                                onChange={handleEditChange}
                                placeholder="Height in cm"
                            />
                        </div>
                        <div className="profile-edit-row">
                            <label>Weight (kg)</label>
                            <input
                                name="weight"
                                type="number"
                                min="1"
                                step="0.1"
                                value={editForm.weight}
                                onChange={handleEditChange}
                                placeholder="Weight in kg"
                            />
                        </div>
                        {editError && <p className="profile-edit-error">{editError}</p>}
                        {editSuccess && <p className="profile-edit-success">{editSuccess}</p>}
                        <div className="profile-edit-actions">
                            <button type="submit" className="profile-save-btn" disabled={editLoading}>
                                {editLoading ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                className="profile-cancel-btn"
                                onClick={() => setEditing(false)}
                                disabled={editLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="profile-details">
                            <div className="profile-field">
                                <label>Age</label>
                                <div className="value">{user?.age || '—'} yrs</div>
                            </div>
                            <div className="profile-field">
                                <label>Height</label>
                                <div className="value">{user?.height || '—'} cm</div>
                            </div>
                            <div className="profile-field">
                                <label>Weight</label>
                                <div className="value">{user?.weight || '—'} kg</div>
                            </div>
                        </div>
                        <button className="profile-edit-btn" onClick={openEdit}>
                            ✏️ Edit Profile
                        </button>
                    </>
                )}
            </div>

            {/* Workout History */}
            <div className="glass-card history-card">
                <h3>Recent Workouts</h3>
                {loadingWorkouts ? (
                    <div className="history-empty">
                        <div className="spinner small" />
                    </div>
                ) : workouts.length === 0 ? (
                    <div className="history-empty">
                        <p>No workouts logged yet. Head to the Workout page to get started!</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {workouts.slice(0, 10).map((w) => (
                            <div key={w.id} className="history-item">
                                <div className="history-left">
                                    <div className="history-icon">💪</div>
                                    <div>
                                        <div className="history-name">{w.workout_name}</div>
                                        <div className="history-date">{w.date}</div>
                                    </div>
                                </div>
                                <div className="history-right">
                                    <span className="history-stat">{w.duration} min</span>
                                    <span className="history-stat accent">{w.calories_burned} cal</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Logout Button */}
            <button className="profile-logout-btn" onClick={handleLogout}>
                <span>↪</span> Logout
            </button>
        </div>
    );
}
