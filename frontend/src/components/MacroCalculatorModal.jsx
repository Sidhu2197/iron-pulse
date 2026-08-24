import React, { useState, useEffect, useRef } from 'react';
import { Flame, X, Check, Calculator, Sparkles, User, Activity, Target, Cake, Ruler, Scale, Sunrise, Zap } from 'lucide-react';
import { useMacros, ACTIVITY_MULTIPLIERS, FITNESS_GOALS, calculateMacroTargets } from '../context/MacroContext';
import '../pages/FoodPlan.css';

export default function MacroCalculatorModal({ forceOpen = false, onClose }) {
  const { userMacros, saveMacros, modalOpen, closeMacroCalculator } = useMacros();
  const cardRef = useRef(null);

  const isOpen = forceOpen || modalOpen;

  const [step, setStep] = useState(0); // 0..5
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    activity: '',
    goal: '',
  });

  useEffect(() => {
    if (userMacros) {
      setFormData({
        age: userMacros.age ? String(userMacros.age) : '',
        gender: userMacros.gender || '',
        height: userMacros.height ? String(userMacros.height) : '',
        weight: userMacros.weight ? String(userMacros.weight) : '',
        activity: userMacros.activity || '',
        goal: userMacros.goal || '',
      });
    } else {
      setFormData({
        age: '',
        gender: '',
        height: '',
        weight: '',
        activity: '',
        goal: '',
      });
    }
  }, [userMacros, isOpen]);

  // Auto focus input/interactive element on step change
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (cardRef.current) {
        const firstFocusable = cardRef.current.querySelector('input:not([disabled]), button:not([disabled]):not(.fw-dot)');
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, step]);

  const totalSteps = 6;
  const livePreview = calculateMacroTargets(formData);

  const isCurrentStepValid = () => {
    if (step === 0) return Boolean(formData.gender);
    if (step === 1) return Boolean(formData.age && Number(formData.age) >= 10 && Number(formData.age) <= 120);
    if (step === 2) return Boolean(formData.height && Number(formData.height) >= 50 && formData.weight && Number(formData.weight) >= 20);
    if (step === 3) return Boolean(formData.activity);
    if (step === 4) return Boolean(formData.goal);
    return true;
  };

  const handleNext = () => {
    if (isCurrentStepValid() && step < totalSteps - 1) {
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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // 1. Esc key to close
      if (e.key === 'Escape') {
        if (!forceOpen) {
          e.preventDefault();
          handleModalClose();
        }
        return;
      }

      // 2. Tab key focus trapping
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = Array.from(
          cardRef.current.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length > 0) {
          const firstEl = focusables[0];
          const lastEl = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl || !cardRef.current.contains(document.activeElement)) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl || !cardRef.current.contains(document.activeElement)) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
        return;
      }

      // 3. Enter key to Next or Save & Finish
      if (e.key === 'Enter') {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag !== 'BUTTON') {
          e.preventDefault();
          if (step < totalSteps - 1) {
            if (isCurrentStepValid()) {
              setStep((prev) => prev + 1);
            }
          } else {
            saveMacros(formData);
            setStep(0);
            if (onClose) onClose();
            else closeMacroCalculator();
          }
        }
        return;
      }

      // 4. Left Arrow to go back
      if (e.key === 'ArrowLeft') {
        const isTextInput = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
        if (!isTextInput) {
          e.preventDefault();
          if (step > 0) setStep((prev) => prev - 1);
        }
      }

      // 5. Right Arrow to go next
      if (e.key === 'ArrowRight') {
        const isTextInput = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
        if (!isTextInput) {
          e.preventDefault();
          if (isCurrentStepValid() && step < totalSteps - 1) {
            setStep((prev) => prev + 1);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, forceOpen, step, totalSteps, formData, onClose, closeMacroCalculator, saveMacros]);

  const stepMeta = [
    { title: 'Select Gender', subtitle: 'Choose biological sex for BMR formula', icon: <User size={28} /> },
    { title: 'Your Age', subtitle: 'Age affects daily metabolic output', icon: <Cake size={28} /> },
    { title: 'Height & Weight', subtitle: 'Body metrics for energy consumption', icon: <Ruler size={28} /> },
    { title: 'Activity Level', subtitle: 'Average activity during a typical week', icon: <Activity size={28} /> },
    { title: 'Primary Goal', subtitle: 'Select your fitness objective', icon: <Target size={28} /> },
    { title: 'Review Target Macros', subtitle: 'Your calculated personalized daily targets', icon: <Sparkles size={28} /> },
  ];

  if (!isOpen) return null;

  const currentStep = stepMeta[step];

  if (!isOpen) return null;

  return (
    <div className="fw-overlay">
      <div ref={cardRef} className="fw-card glass-card" style={{ position: 'relative' }}>
        {/* Close Button */}
        {!forceOpen && (
          <button
            type="button"
            onClick={handleModalClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Wizard Step Progress */}
        <div className="fw-progress">
          {stepMeta.map((_, i) => (
            <div key={i} className={`fw-dot ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              {i < step ? '✓' : i + 1}
            </div>
          ))}
          <div className="fw-progress-line">
            <div
              className="fw-progress-fill"
              style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Header */}
        <div className="fw-step-header">
          <span className="fw-step-icon" style={{ color: 'var(--text-accent)' }}>
            {currentStep.icon}
          </span>
          <h3>{currentStep.title}</h3>
          <p className="fw-step-count">
            Step {step + 1} of {totalSteps} — {currentStep.subtitle}
          </p>
        </div>

        {/* Step Body Content */}
        <div className="fw-step-content" style={{ flexDirection: 'column', gap: '1.5rem' }}>
          {/* Step 0: Gender Selection */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'male' })}
                className={`fw-option-btn ${formData.gender === 'male' ? 'selected' : ''}`}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: formData.gender === 'male' ? '2px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)',
                  background: formData.gender === 'male' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <User size={24} />
                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Male</span>
                {formData.gender === 'male' && <Check size={20} style={{ marginLeft: 'auto', color: 'var(--text-accent)' }} />}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'female' })}
                className={`fw-option-btn ${formData.gender === 'female' ? 'selected' : ''}`}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: formData.gender === 'female' ? '2px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)',
                  background: formData.gender === 'female' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <User size={24} />
                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Female</span>
                {formData.gender === 'female' && <Check size={20} style={{ marginLeft: 'auto', color: 'var(--text-accent)' }} />}
              </button>
            </div>
          )}

          {/* Step 1: Age Input */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter your age"
                min="10"
                max="120"
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  fontSize: '1.1rem',
                  outline: 'none',
                }}
              />
              {formData.age && (Number(formData.age) < 10 || Number(formData.age) > 120) && (
                <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>Please enter a valid age (10-120)</span>
              )}
            </div>
          )}

          {/* Step 2: Height & Weight */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="Enter your height"
                  min="50"
                  max="300"
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="Enter your weight"
                  min="20"
                  max="300"
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, { label, multiplier }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity: key })}
                  className={`fw-option-btn ${formData.activity === key ? 'selected' : ''}`}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: formData.activity === key ? '2px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)',
                    background: formData.activity === key ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <Activity size={20} style={{ color: 'var(--text-accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '1rem' }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      ×{multiplier} BMR
                    </div>
                  </div>
                  {formData.activity === key && <Check size={18} style={{ color: 'var(--text-accent)' }} />}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Fitness Goal */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(FITNESS_GOALS).map(([key, { label, adjustment }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal: key })}
                  className={`fw-option-btn ${formData.goal === key ? 'selected' : ''}`}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: formData.goal === key ? '2px solid var(--text-accent)' : '1px solid rgba(255,255,255,0.1)',
                    background: formData.goal === key ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <Target size={20} style={{ color: 'var(--text-accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '1rem' }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {adjustment > 0 ? `+${adjustment}` : adjustment} kcal
                    </div>
                  </div>
                  {formData.goal === key && <Check size={18} style={{ color: 'var(--text-accent)' }} />}
                </button>
              ))}
            </div>
          )}

          {/* Step 5: Review & Live Preview */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Sparkles size={20} style={{ color: 'var(--text-accent)' }} />
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Your Daily Targets</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <Flame size={24} style={{ color: '#ff6b6b', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Math.round(livePreview.calories)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calories</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4ecdc4', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Math.round(livePreview.protein)}g
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Protein</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ffe66d', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Math.round(livePreview.carbs)}g
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carbs</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#95e1d3', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Math.round(livePreview.fat)}g
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fat</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f38181', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Math.round(livePreview.fiber)}g
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fiber</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <Sunrise size={24} style={{ color: '#a8e6cf', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Math.round(livePreview.bmr)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>BMR</div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                These targets are calculated based on your personal metrics and will update your daily nutrition goals.
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="fw-nav-buttons">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Back
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: isCurrentStepValid() ? 'var(--text-accent)' : 'rgba(255,255,255,0.1)',
                color: isCurrentStepValid() ? '#000' : 'var(--text-muted)',
                cursor: isCurrentStepValid() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                fontWeight: 500,
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Next
              <Zap size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!isCurrentStepValid()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: isCurrentStepValid() ? 'var(--text-accent)' : 'rgba(255,255,255,0.1)',
                color: isCurrentStepValid() ? '#000' : 'var(--text-muted)',
                cursor: isCurrentStepValid() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                fontWeight: 500,
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Check size={16} />
              Save & Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}