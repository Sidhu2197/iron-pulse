import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWorkouts, changePassword } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import AccessibleButton from '../components/AccessibleButton';
import './Profile.css';
import { LogOut, Lock, Check, AlertCircle, Edit, Dumbbell, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState(true);

    // Change Password state
    const [showPwdForm, setShowPwdForm] = useState(false);
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');

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

    const handlePwdChange = (e) => {
        setPwdForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePwdSubmit = async (e) => {
        e.preventDefault();
        setPwdError('');
        setPwdSuccess('');
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            return setPwdError('New passwords do not match');
        }
        if (pwdForm.newPassword.length < 8) {
            return setPwdError('New password must be at least 8 characters');
        }
        setPwdLoading(true);
        try {
            await changePassword(token, {
                currentPassword: pwdForm.currentPassword,
                newPassword: pwdForm.newPassword,
            });
            setPwdSuccess('Password changed successfully!');
            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setShowPwdForm(false), 2000);
        } catch (err) {
            setPwdError(err.message || 'Failed to change password');
        } finally {
            setPwdLoading(false);
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

                {/* Change Password Section */}
                <div className="profile-password-section">
                    {!showPwdForm ? (
                        <button
                            className="profile-edit-btn"
                            onClick={() => { setShowPwdForm(true); setPwdError(''); setPwdSuccess(''); }}
                        >
                            <Lock size={14} /> Change Password
                        </button>
                    ) : (
                        <form className="profile-pwd-form" onSubmit={handlePwdSubmit}>
                            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '4px' }}>
                                <Lock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Change Password
                            </h3>
                            <div className="profile-edit-row">
                                <label>Current Password</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input type={showCurrentPwd ? 'text' : 'password'} name="currentPassword" value={pwdForm.currentPassword} onChange={handlePwdChange} style={{ width: '100%', paddingRight: '36px' }} required />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                        aria-label={showCurrentPwd ? 'Hide password' : 'Show password'}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#8f9bb3',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px',
                                        }}
                                    >
                                        {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="profile-edit-row">
                                <label>New Password</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input type={showNewPwd ? 'text' : 'password'} name="newPassword" value={pwdForm.newPassword} onChange={handlePwdChange} style={{ width: '100%', paddingRight: '36px' }} required />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPwd(!showNewPwd)}
                                        aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#8f9bb3',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px',
                                        }}
                                    >
                                        {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="profile-edit-row">
                                <label>Confirm New Password</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input type={showConfirmPwd ? 'text' : 'password'} name="confirmPassword" value={pwdForm.confirmPassword} onChange={handlePwdChange} style={{ width: '100%', paddingRight: '36px' }} required />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                                        aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#8f9bb3',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px',
                                        }}
                                    >
                                        {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            {pwdError && <p className="profile-edit-error"><AlertCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{pwdError}</p>}
                            {pwdSuccess && <p className="profile-edit-success"><Check size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{pwdSuccess}</p>}
                            <div className="profile-edit-actions">
                                <AccessibleButton 
                                    type="submit" 
                                    className="profile-save-btn" 
                                    disabled={pwdLoading}
                                    disabledReason="Changing password..."
                                >
                                    {pwdLoading ? 'Changing…' : 'Change Password'}
                                </AccessibleButton>
                                <AccessibleButton 
                                    type="button" 
                                    className="profile-cancel-btn" 
                                    onClick={() => setShowPwdForm(false)} 
                                    disabled={pwdLoading}
                                    disabledReason="Changing password..."
                                >
                                    Cancel
                                </AccessibleButton>
                            </div>
                        </form>
                    )}
                </div>
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
                                    <div className="history-icon"><Dumbbell size={18} /></div>
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
                <LogOut size={16} style={{marginRight: "8px"}}/> Logout
            </button>
        </div>
    );
}
