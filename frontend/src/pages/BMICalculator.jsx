import { useState } from 'react';
import './BMICalculator.css';

const BMI_CATEGORIES = [
    { max: 18.5, label: 'Underweight', color: '#60a5fa', emoji: '🔵', advice: 'Consider a calorie-surplus diet with strength training.' },
    { max: 24.9, label: 'Normal Weight', color: '#10b981', emoji: '🟢', advice: 'Great shape! Maintain with balanced nutrition and exercise.' },
    { max: 29.9, label: 'Overweight', color: '#f59e0b', emoji: '🟡', advice: 'Consider adding more cardio and monitoring calorie intake.' },
    { max: 34.9, label: 'Obese (Class I)', color: '#ef4444', emoji: '🟠', advice: 'Consult a healthcare provider and start a structured plan.' },
    { max: Infinity, label: 'Obese (Class II+)', color: '#dc2626', emoji: '🔴', advice: 'Seek medical guidance for a safe weight-loss program.' },
];

function getCategory(bmi) {
    return BMI_CATEGORIES.find((c) => bmi <= c.max);
}

export default function BMICalculator() {
    const [form, setForm] = useState({ age: '', gender: '', height: '', weight: '' });
    const [result, setResult] = useState(null);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const canCalculate = form.age && form.gender && form.height && form.weight &&
        Number(form.height) > 0 && Number(form.weight) > 0;

    const handleCalculate = (e) => {
        e.preventDefault();
        const heightM = parseFloat(form.height) / 100;
        const weight = parseFloat(form.weight);
        const bmi = weight / (heightM * heightM);
        const category = getCategory(bmi);
        setResult({ bmi: bmi.toFixed(1), ...category });
    };

    const handleReset = () => {
        setForm({ age: '', gender: '', height: '', weight: '' });
        setResult(null);
    };

    // Gauge percentage (BMI 10–40 mapped to 0–100%)
    const gaugePercent = result ? Math.min(Math.max(((parseFloat(result.bmi) - 10) / 30) * 100, 0), 100) : 0;

    return (
        <div className="bmi-page">
            <h1>BMI Calculator</h1>
            <p className="subtitle">Calculate your Body Mass Index</p>

            <div className="bmi-layout">
                {/* Form Card */}
                <div className="glass-card bmi-form-card">
                    <h3>📊 Enter Your Details</h3>
                    <form onSubmit={handleCalculate}>
                        <div className="input-group">
                            <label htmlFor="bmi-age">Age</label>
                            <div className="input-field">
                                <span className="icon">🎂</span>
                                <input id="bmi-age" type="number" placeholder="25"
                                    value={form.age} onChange={update('age')} min="1" max="120" required />
                                <span className="bmi-unit">years</span>
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="bmi-gender">Gender</label>
                            <div className="input-field">
                                <span className="icon">👤</span>
                                <select id="bmi-gender" value={form.gender} onChange={update('gender')} required>
                                    <option value="" disabled>Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="bmi-height">Height</label>
                            <div className="input-field">
                                <span className="icon">📏</span>
                                <input id="bmi-height" type="number" placeholder="175"
                                    value={form.height} onChange={update('height')} min="1" required />
                                <span className="bmi-unit">cm</span>
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="bmi-weight">Weight</label>
                            <div className="input-field">
                                <span className="icon">⚖️</span>
                                <input id="bmi-weight" type="number" placeholder="70"
                                    value={form.weight} onChange={update('weight')} min="1" required />
                                <span className="bmi-unit">kg</span>
                            </div>
                        </div>

                        <div className="bmi-actions">
                            <button className="btn-primary" type="submit" disabled={!canCalculate}>
                                Calculate BMI
                            </button>
                            {result && (
                                <button className="btn-secondary" type="button" onClick={handleReset}>
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Result Card */}
                <div className="glass-card bmi-result-card">
                    {!result ? (
                        <div className="bmi-empty">
                            <div className="bmi-empty-icon">⚖️</div>
                            <p>Fill in your details and click <span className="accent">"Calculate BMI"</span> to see your result</p>
                        </div>
                    ) : (
                        <div className="bmi-result animate-fade-in">
                            <div className="bmi-gauge-container">
                                <div className="bmi-gauge-track">
                                    <div
                                        className="bmi-gauge-fill"
                                        style={{ width: `${gaugePercent}%`, background: result.color }}
                                    />
                                </div>
                                <div className="bmi-gauge-labels">
                                    <span>10</span>
                                    <span>18.5</span>
                                    <span>25</span>
                                    <span>30</span>
                                    <span>40</span>
                                </div>
                            </div>

                            <div className="bmi-score">
                                <span className="bmi-number" style={{ color: result.color }}>{result.bmi}</span>
                                <span className="bmi-category-label">
                                    {result.emoji} {result.label}
                                </span>
                            </div>

                            <div className="bmi-advice">
                                <h4>💡 Recommendation</h4>
                                <p>{result.advice}</p>
                            </div>

                            <div className="bmi-scale">
                                {BMI_CATEGORIES.slice(0, 4).map((cat) => (
                                    <div
                                        key={cat.label}
                                        className={`bmi-scale-item ${result.label === cat.label ? 'active' : ''}`}
                                        style={{ borderColor: result.label === cat.label ? cat.color : 'var(--border)' }}
                                    >
                                        <span className="scale-emoji">{cat.emoji}</span>
                                        <span className="scale-label">{cat.label}</span>
                                        <span className="scale-range">≤ {cat.max}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
