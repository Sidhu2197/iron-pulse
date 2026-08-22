import React, { useState, useEffect } from 'react';
import { Flame, X, Check, Calculator, Sparkles, User, Activity, Target, Cake, Ruler, Scale, Sunrise, Zap } from 'lucide-react';
import { useMacros, ACTIVITY_MULTIPLIERS, FITNESS_GOALS, calculateMacroTargets } from '../context/MacroContext';
import '../pages/FoodPlan.css';

export default function MacroCalculatorModal({ forceOpen = false, onClose }) {
  const { userMacros, saveMacros, modalOpen, closeMacroCalculator } = useMacros();

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

  if (!isOpen) return null;

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

  const stepMeta = [
    { title: 'Select Gender', subtitle: 'Choose biological sex for BMR formula', icon: <User size={28} /> },
    { title: 'Your Age', subtitle: 'Age affects daily metabolic output', icon: <Cake size={28} /> },
    { title: 'Height & Weight', subtitle: 'Body metrics for energy consumption', icon: <Ruler size={28} /> },
    { title: 'Activity Level', subtitle: 'Average activity during a typical week', icon: <Activity size={28} /> },
    { title: 'Primary Goal', subtitle: 'Select your fitness objective', icon: <Target size={28} /> },
    { title: 'Review Target Macros', subtitle: 'Your calculated personalized daily targets', icon: <Sparkles size={28} /> },
  ];

  const currentStep = stepMeta[step];

  return (
    <div className="fw-overlay">
      <div className="fw-card glass-card" style={{ position: 'relative' }}>
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
        <div className="fw-step-content" style={{ flexDirection: 'column' }}>
          {/* STEP 0: Gender */}
          {step === 0 && (
            <div className="fw-select-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { key: 'male', label: 'Male', desc: 'Male biological metrics' },
                { key: 'female', label: 'Female', desc: 'Female biological metrics' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`fw-select-card ${formData.gender === item.key ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, gender: item.key })}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 16px' }}
                >
                  <User size={28} style={{ color: formData.gender === item.key ? 'var(--text-accent)' : 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.label}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>{item.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 1: Age */}
          {step === 1 && (
            <div className="fw-input-wrap">
              <div className="input-field fw-number-input">
                <span className="icon"><Cake size={18} /></span>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="10"
                  max="120"
                  autoFocus
                />
                <span className="fw-unit">years</span>
              </div>
            </div>
          )}

          {/* STEP 2: Height & Weight */}
          {step === 2 && (
            <div className="fw-input-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-field fw-number-input">
                <span className="icon"><Ruler size={18} /></span>
                <input
                  type="number"
                  placeholder="Height e.g. 175"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  min="50"
                  max="250"
                  autoFocus
                />
                <span className="fw-unit">cm</span>
              </div>

              <div className="input-field fw-number-input">
                <span className="icon"><Scale size={18} /></span>
                <input
                  type="number"
                  placeholder="Weight e.g. 70"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  min="20"
                  max="300"
                />
                <span className="fw-unit">kg</span>
              </div>
            </div>
          )}

          {/* STEP 3: Activity Level */}
          {step === 3 && (
            <div className="fw-select-grid" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={`fw-select-card ${formData.activity === key ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, activity: key })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', textAlign: 'left' }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  {formData.activity === key && <Check size={18} style={{ color: 'var(--text-accent)' }} />}
                </button>
              ))}
            </div>
          )}

          {/* STEP 4: Fitness Goal */}
          {step === 4 && (
            <div className="fw-select-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
              {Object.entries(FITNESS_GOALS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={`fw-select-card ${formData.goal === key ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, goal: key })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {key === 'fat_loss' && <Flame size={18} style={{ color: '#ef4444' }} />}
                    {key === 'maintenance' && <Scale size={18} style={{ color: '#00f0ff' }} />}
                    {key === 'muscle_gain' && <Zap size={18} style={{ color: '#10b981' }} />}
                    <span>{key === 'fat_loss' ? 'Fat Loss' : key === 'maintenance' ? 'Maintenance' : 'Muscle Gain'}</span>
                  </div>
                  {formData.goal === key && <Check size={18} style={{ color: 'var(--text-accent)' }} />}
                </button>
              ))}
            </div>
          )}

          {/* STEP 5: Final Review */}
          {step === 5 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(0, 240, 255, 0.04)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent-cyan)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Recommended Daily Macro Targets
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Calories</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00f0ff' }}>
                      {livePreview.calories} <span style={{ fontSize: '0.65rem' }}>kcal</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Protein</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa' }}>
                      {livePreview.protein} <span style={{ fontSize: '0.65rem' }}>g</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fats</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                      {livePreview.fats} <span style={{ fontSize: '0.65rem' }}>g</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carbs</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                      {livePreview.carbs} <span style={{ fontSize: '0.65rem' }}>g</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="fw-nav">
          <button
            type="button"
            className="fw-btn-back"
            onClick={handleBack}
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0.4 : 1, cursor: step === 0 ? 'not-allowed' : 'pointer' }}
          >
            Back
          </button>

          {step < totalSteps - 1 ? (
            <button
              type="button"
              className="fw-btn-next"
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              className="fw-btn-next"
              onClick={handleFinish}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
            >
              Save & Finish Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
