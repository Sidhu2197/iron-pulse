import React, { useState, useEffect } from 'react';
import { Flame, X, Check, Calculator, Sparkles, User, Activity, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useMacros, ACTIVITY_MULTIPLIERS, FITNESS_GOALS, calculateMacroTargets } from '../context/MacroContext';

export default function MacroCalculatorModal({ forceOpen = false, onClose }) {
  const { userMacros, saveMacros, modalOpen, closeMacroCalculator } = useMacros();

  const isOpen = forceOpen || modalOpen;

  const [step, setStep] = useState(0); // 0..5
  const [formData, setFormData] = useState({
    age: '25',
    gender: 'male',
    height: '175',
    weight: '70',
    activity: 'moderately_active',
    goal: 'maintenance',
  });

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

  const totalSteps = 6;
  const livePreview = calculateMacroTargets(formData);

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = (e) => {
    if (e) e.preventDefault();
    saveMacros(formData);
    setStep(0);
    if (onClose) onClose();
    else closeMacroCalculator();
  };

  const handleModalClose = () => {
    setStep(0);
    if (onClose) onClose();
    else closeMacroCalculator();
  };

  const stepTitles = [
    { title: 'Select Gender', subtitle: 'Choose your biological sex for BMR calculation' },
    { title: 'Your Age', subtitle: 'Age affects metabolic rate calculations' },
    { title: 'Height & Weight', subtitle: 'Enter your physical body dimensions' },
    { title: 'Activity Level', subtitle: 'How active are you during a typical week?' },
    { title: 'Primary Goal', subtitle: 'What is your current fitness objective?' },
    { title: 'Review Targets', subtitle: 'Here are your calculated daily macro targets' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '1.25rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(10, 14, 28, 0.99))',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 240, 255, 0.18)',
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

        {/* Step Progress Indicator Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step {step + 1} of {totalSteps}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              {Math.round(((step + 1) / totalSteps) * 100)}% Complete
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', height: '6px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: '9999px',
                  background: i <= step ? 'linear-gradient(90deg, #00f0ff, #7c3aed)' : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            {stepTitles[step].title}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            {stepTitles[step].subtitle}
          </p>
        </div>

        {/* Step Content */}
        <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* STEP 0: Gender */}
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { key: 'male', label: 'Male', emoji: '👨', desc: 'Calculates male BMR (+5 offset)' },
                { key: 'female', label: 'Female', emoji: '👩', desc: 'Calculates female BMR (-161 offset)' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: item.key })}
                  style={{
                    padding: '1.5rem 1rem',
                    borderRadius: '16px',
                    border: formData.gender === item.key ? '2px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                    background: formData.gender === item.key ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                    color: formData.gender === item.key ? '#00f0ff' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{item.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 1: Age */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ width: '100%', maxWidth: '240px' }}>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: '2px solid rgba(0, 240, 255, 0.3)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#00f0ff',
                    fontSize: '2rem',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Quick Preset Pills */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['18', '22', '25', '30', '40'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, age: preset })}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      border: formData.age === preset ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                      background: formData.age === preset ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                      color: formData.age === preset ? '#00f0ff' : '#94a3b8',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {preset} yrs
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Height & Weight */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="100"
                  max="230"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,240,255,0.3)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,240,255,0.3)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Activity Level */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity: key })}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: formData.activity === key ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.08)',
                    background: formData.activity === key ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                    color: formData.activity === key ? '#00f0ff' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* STEP 4: Fitness Goal */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(FITNESS_GOALS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal: key })}
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    border: formData.goal === key ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: formData.goal === key ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: formData.goal === key ? '#10b981' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {key === 'fat_loss' ? '🔥 Fat Loss (Caloric Deficit -500 kcal)' : key === 'maintenance' ? '⚖️ Maintenance (Maintain Weight)' : '💪 Muscle Gain (Caloric Surplus +350 kcal)'}
                </button>
              ))}
            </div>
          )}

          {/* STEP 5: Final Review & Confirmation */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00f0ff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} /> Recommended Daily Target Summary
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem 0.5rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Calories</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00f0ff' }}>
                      {livePreview.calories} <span style={{ fontSize: '0.65rem' }}>kcal</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem 0.5rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Protein</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a78bfa' }}>
                      {livePreview.protein} <span style={{ fontSize: '0.65rem' }}>g</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem 0.5rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Fats</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
                      {livePreview.fats} <span style={{ fontSize: '0.65rem' }}>g</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem 0.5rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Carbs</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                      {livePreview.carbs} <span style={{ fontSize: '0.65rem' }}>g</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                BMR: {livePreview.bmr} kcal | TDEE: {livePreview.tdee} kcal
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: step === 0 ? '#475569' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.5 : 1,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #00f0ff, #7c3aed)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 240, 255, 0.3)',
              }}
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Check size={18} /> Save & Finish Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
