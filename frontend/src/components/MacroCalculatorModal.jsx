import React, { useState, useEffect, useRef } from 'react';
import { Fire, X, Check, Calculator, Sparkle as Sparkles, User, Pulse as Activity, Target, Cake, Ruler, Scales as Scale, SunHorizon as Sunrise, Lightning as Zap } from '@phosphor-icons/react';
import { useMacros, ACTIVITY_MULTIPLIERS, FITNESS_GOALS, calculateMacroTargets } from '../context/MacroContext';
import { useAuth } from '../context/AuthContext';
import AccessibleButton from './AccessibleButton';
import '../pages/Workout.css';

export default function MacroCalculatorModal({ forceOpen = false, onClose }) {
  const { userMacros, saveMacros, modalOpen, closeMacroCalculator } = useMacros();
  const { logout } = useAuth();
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

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

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
        const firstFocusable = cardRef.current.querySelector('input:not([disabled]), button:not([disabled]):not(.wizard-dot):not(.wizard-close-btn)');
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
    if (step === 1) return Boolean(formData.age && Number(formData.age) >= 10 && Number(formData.age) <= 99);
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

  const handleFinish = async (e) => {
    if (e) e.preventDefault();
    await saveMacros(formData);
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
      // 1. Esc key to close (disabled when forced open)
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
    { title: 'Select Gender', subtitle: 'Choose biological sex for BMR formula', icon: <User size={24} /> },
    { title: 'Your Age', subtitle: 'Age affects daily metabolic output', icon: <Cake size={24} /> },
    { title: 'Height & Weight', subtitle: 'Body metrics for energy consumption', icon: <Ruler size={24} /> },
    { title: 'Activity Level', subtitle: 'Average activity during a typical week', icon: <Activity size={24} /> },
    { title: 'Primary Goal', subtitle: 'Select your fitness objective', icon: <Target size={24} /> },
    { title: 'Review Target Macros', subtitle: 'Your calculated personalized daily targets', icon: <Sparkles size={24} /> },
  ];

  if (!isOpen) return null;

  const currentStep = stepMeta[step];

  return (
    <div className="wizard-overlay">
      <div ref={cardRef} className="wizard-card glass-card">
        {/* Close Button (only shown when not forced open) */}
        {!forceOpen && (
          <button
            type="button"
            className="wizard-close-btn"
            onClick={handleModalClose}
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        )}

        {/* Wizard Step Progress */}
        <div className="wizard-progress">
          <div className="wizard-progress-line">
            <div
              className="wizard-progress-fill"
              style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            />
          </div>
          {stepMeta.map((_, i) => (
            <div key={i} className={`wizard-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              {i < step ? '✓' : i + 1}
            </div>
          ))}
        </div>

        {/* Step Header */}
        <div className="wizard-step-header">
          <span className="wizard-step-icon">
            {currentStep.icon}
          </span>
          <h3>{currentStep.title}</h3>
          <p className="wizard-step-count">
            Step {step + 1} of {totalSteps} — {currentStep.subtitle}
          </p>
        </div>

        {/* Step Body Content */}
        <div className="wizard-step-content" style={{ flexDirection: 'column', width: '100%', alignItems: 'stretch' }}>
          {/* Step 0: Gender Selection */}
          {step === 0 && (
            <div className="wizard-goal-grid">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'male' })}
                className={`goal-option ${formData.gender === 'male' ? 'selected' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} /> Male
                </span>
                {formData.gender === 'male' && <Check size={16} weight="bold" style={{ color: 'var(--text-accent)' }} />}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'female' })}
                className={`goal-option ${formData.gender === 'female' ? 'selected' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} /> Female
                </span>
                {formData.gender === 'female' && <Check size={16} weight="bold" style={{ color: 'var(--text-accent)' }} />}
              </button>
            </div>
          )}

          {/* Step 1: Age Input */}
          {step === 1 && (
            <div className="wizard-input-wrap">
              <div className={`input-field wizard-number-input ${formData.age && (Number(formData.age) < 10 || Number(formData.age) > 99) ? 'invalid' : ''}`}>
                <span className="icon"><Cake size={18} /></span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d{0,2}$/.test(val)) {
                      setFormData({ ...formData, age: val });
                    }
                  }}
                  autoFocus
                />
                <span className="wizard-unit">years</span>
              </div>
              {formData.age && (Number(formData.age) < 10 || Number(formData.age) > 99) && (
                <span style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '6px' }}>Please enter age between 10 and 99</span>
              )}
            </div>
          )}

          {/* Step 2: Height & Weight */}
          {step === 2 && (
            <div className="wizard-input-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Height</label>
                <div className="input-field wizard-number-input">
                  <span className="icon"><Ruler size={18} /></span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="175"
                    value={formData.height}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d{0,3}$/.test(val)) {
                        setFormData({ ...formData, height: val });
                      }
                    }}
                  />
                  <span className="wizard-unit">cm</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Weight</label>
                <div className="input-field wizard-number-input">
                  <span className="icon"><Scale size={18} /></span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="70"
                    value={formData.weight}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d{0,3}(\.\d{0,1})?$/.test(val)) {
                        setFormData({ ...formData, weight: val });
                      }
                    }}
                  />
                  <span className="wizard-unit">kg</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, opt]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity: key })}
                  className={`goal-option ${formData.activity === key ? 'selected' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={18} style={{ color: formData.activity === key ? 'var(--text-accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>×{opt.value} BMR</div>
                    </div>
                  </div>
                  {formData.activity === key && <Check size={16} weight="bold" style={{ color: 'var(--text-accent)' }} />}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Fitness Goal */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {Object.entries(FITNESS_GOALS).map(([key, opt]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal: key })}
                  className={`goal-option ${formData.goal === key ? 'selected' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}
                >
                  <div style={{ display: 'center', alignItems: 'center', gap: '10px' }}>
                    <Target size={18} style={{ color: formData.goal === key ? 'var(--text-accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {opt.calAdjustment > 0 ? `+${opt.calAdjustment}` : opt.calAdjustment} kcal
                      </div>
                    </div>
                  </div>
                  {formData.goal === key && <Check size={16} weight="bold" style={{ color: 'var(--text-accent)' }} />}
                </button>
              ))}
            </div>
          )}

          {/* Step 5: Review & Daily Targets (Clean 4 Calculated Targets, No NaN, No Non-calculated items) */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                width: '100%'
              }}>
                {/* Calories */}
                <div style={{ textAlign: 'center', padding: '14px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Fire size={20} weight="fill" style={{ color: '#f97316', marginBottom: '4px' }} />
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {Math.round(livePreview.calories)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calories</div>
                </div>

                {/* Protein */}
                <div style={{ textAlign: 'center', padding: '14px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4ecdc4', margin: '4px auto 8px' }} />
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {Math.round(livePreview.protein)}g
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protein</div>
                </div>

                {/* Carbs */}
                <div style={{ textAlign: 'center', padding: '14px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffe66d', margin: '4px auto 8px' }} />
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {Math.round(livePreview.carbs)}g
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carbs</div>
                </div>

                {/* Fats */}
                <div style={{ textAlign: 'center', padding: '14px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#95e1d3', margin: '4px auto 8px' }} />
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {Math.round(livePreview.fats ?? (livePreview.calories * 0.25 / 9))}g
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fat</div>
                </div>
              </div>

              {/* BMR footnote summary */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.02)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Sunrise size={16} style={{ color: '#a8e6cf' }} />
                Basal Metabolic Rate (BMR): <strong>{Math.round(livePreview.bmr)} kcal/day</strong>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons — identical sizing & classes as Workout wizard */}
        <div className="wizard-nav">
          {step > 0 ? (
            <button
              type="button"
              className="wizard-btn-back"
              onClick={handleBack}
            >
              ← Back
            </button>
          ) : forceOpen ? (
            <button
              type="button"
              className="wizard-btn-back"
              onClick={logout}
              title="Log out"
            >
              Log out
            </button>
          ) : (
            <button
              type="button"
              className="wizard-btn-back"
              onClick={handleModalClose}
            >
              Cancel
            </button>
          )}

          {step < totalSteps - 1 ? (
            <AccessibleButton
              type="button"
              className="wizard-btn-next"
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              disabledReason="Complete current step input before continuing."
            >
              Next →
            </AccessibleButton>
          ) : (
            <AccessibleButton
              type="button"
              className="wizard-btn-next"
              onClick={handleFinish}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} weight="bold" /> Save & Finish
              </span>
            </AccessibleButton>
          )}
        </div>
      </div>
    </div>
  );
}