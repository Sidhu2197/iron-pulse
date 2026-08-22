import React, { useState, useEffect } from 'react';
import { Flame, X, Check, Calculator, Sparkles, User, Activity, Target } from 'lucide-react';
import { useMacros, ACTIVITY_MULTIPLIERS, FITNESS_GOALS, calculateMacroTargets } from '../context/MacroContext';

export default function MacroCalculatorModal({ forceOpen = false, onClose }) {
  const { userMacros, saveMacros, modalOpen, closeMacroCalculator } = useMacros();

  const isOpen = forceOpen || modalOpen;

  const [formData, setFormData] = useState({
    age: '25',
    gender: 'male',
    height: '175',
    weight: '70',
    activity: 'moderately_active',
    goal: 'maintenance',
  });

  // Populate form with existing user macros if available
  useEffect(() => {
    if (userMacros) {
      setFormData({
        age: userMacros.age ? String(userMacros.age) : '25',
        gender: userMacros.gender || 'male',
        height: userMacros.height ? String(userMacros.height) : '175',
        weight: userMacros.weight ? String(userMacros.weight) : '70',
        activity: userMacros.activity || 'moderately_active',
        goal: userMacros.goal || 'maintenance',
      });
    }
  }, [userMacros, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation preview
  const livePreview = calculateMacroTargets(formData);

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMacros(formData);
    if (onClose) onClose();
    else closeMacroCalculator();
  };

  const handleModalClose = () => {
    if (onClose) onClose();
    else closeMacroCalculator();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(10, 14, 28, 0.98))',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.15)',
          padding: '2rem',
          position: 'relative',
          color: '#f8fafc',
        }}
      >
        {/* Close Button */}
        {!forceOpen && (
          <button
            onClick={handleModalClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(124, 58, 237, 0.2))',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: '#00f0ff',
              marginBottom: '0.75rem',
            }}
          >
            <Calculator size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            {forceOpen ? 'Welcome! Set Your Macro Targets' : 'Calculate Custom Macro Targets'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Personalize your daily Calories, Protein, Fats, and Carbs based on your body and goals.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Gender & Age */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                Gender
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['male', 'female'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '10px',
                      border: formData.gender === g ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                      background: formData.gender === g ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: formData.gender === g ? '#00f0ff' : '#94a3b8',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                Age (years)
              </label>
              <input
                type="number"
                min="12"
                max="100"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Height & Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                Height (cm)
              </label>
              <input
                type="number"
                min="100"
                max="230"
                required
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                Weight (kg)
              </label>
              <input
                type="number"
                min="30"
                max="250"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
              Daily Activity Level
            </label>
            <select
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: '#0f172a',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fitness Goal */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
              Primary Fitness Goal
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {Object.entries(FITNESS_GOALS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal: key })}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: '10px',
                    border: formData.goal === key ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: formData.goal === key ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: formData.goal === key ? '#10b981' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {key === 'fat_loss' ? '🔥 Fat Loss' : key === 'maintenance' ? '⚖️ Maintenance' : '💪 Muscle Gain'}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calculated Results Card */}
          <div
            style={{
              background: 'rgba(0, 240, 255, 0.04)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00f0ff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} /> Calculated Target Overview
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Calories</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00f0ff' }}>
                  {livePreview.calories} <span style={{ fontSize: '0.65rem' }}>kcal</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Protein</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>
                  {livePreview.protein} <span style={{ fontSize: '0.65rem' }}>g</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Fats</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>
                  {livePreview.fats} <span style={{ fontSize: '0.65rem' }}>g</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Carbs</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                  {livePreview.carbs} <span style={{ fontSize: '0.65rem' }}>g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #00f0ff, #7c3aed)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 240, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            <Check size={18} /> Save & Apply Targets
          </button>
        </form>
      </div>
    </div>
  );
}
