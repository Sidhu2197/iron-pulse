import { useState, useRef } from 'react';
import './BMICalculator.css';
import PageReveal from '../components/PageReveal';
import AccessibleButton from '../components/AccessibleButton';
import { Ruler, User, Scale, Cake, BarChart2, Lightbulb, AlertCircle } from 'lucide-react';

const BMI_CATEGORIES = [
    { max: 18.5, label: 'Underweight', color: '#60a5fa', advice: 'Consider a calorie-surplus diet with strength training.' },
    { max: 24.9, label: 'Normal Weight', color: '#10b981', advice: 'Great shape! Maintain with balanced nutrition and exercise.' },
    { max: 29.9, label: 'Overweight', color: '#f59e0b', advice: 'Consider adding more cardio and monitoring calorie intake.' },
    { max: 34.9, label: 'Obese (Class I)', color: '#ef4444', advice: 'Consult a healthcare provider and start a structured plan.' },
    { max: Infinity, label: 'Obese (Class II+)', color: '#dc2626', advice: 'Seek medical guidance for a safe weight-loss program.' },
];

function getCategory(bmi) {
    return BMI_CATEGORIES.find((c) => bmi <= c.max);
}

export default function BMICalculator() {
    const [form, setForm] = useState({ age: '', gender: '', height: '', weight: '' });
    const [result, setResult] = useState(null);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const invalidAge = form.age !== '' && (Number(form.age) < 10 || Number(form.age) > 120);
    const invalidHeight = form.height !== '' && (Number(form.height) < 50 || Number(form.height) > 250);
    const invalidWeight = form.weight !== '' && (Number(form.weight) < 20 || Number(form.weight) > 300);

    const canCalculate = form.age && form.gender && form.height && form.weight &&
        !invalidAge && !invalidHeight && !invalidWeight;

    const [submitted, setSubmitted] = useState(false);
    const [hadError, setHadError] = useState({});
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    const ageRef = useRef(null);
    const genderRef = useRef(null);
    const heightRef = useRef(null);
    const weightRef = useRef(null);

    const isAgeValid = form.age !== '' && !invalidAge;
    const isGenderValid = !!form.gender;
    const isHeightValid = form.height !== '' && !invalidHeight;
    const isWeightValid = form.weight !== '' && !invalidWeight;

    const getFieldClass = (field) => {
        let isInvalid = false;
        let isValid = false;

        if (field === 'age') {
            isValid = isAgeValid;
            isInvalid = (submitted && !form.age) || invalidAge;
        } else if (field === 'gender') {
            isValid = isGenderValid;
            isInvalid = submitted && !isGenderValid;
        } else if (field === 'height') {
            isValid = isHeightValid;
            isInvalid = (submitted && !form.height) || invalidHeight;
        } else if (field === 'weight') {
            isValid = isWeightValid;
            isInvalid = (submitted && !form.weight) || invalidWeight;
        }

        if (isInvalid) return 'invalid';
        if (isValid && hadError[field]) return 'valid'; // Only green if previously red/error
        return '';
    };

    const handleCalculate = (e) => {
        e.preventDefault();
        setSubmitted(true);

        const invalidFields = [];
        if (!isAgeValid) invalidFields.push({ name: 'age', ref: ageRef, msg: invalidAge ? 'Age must be 10–120' : 'Age is required' });
        if (!isGenderValid) invalidFields.push({ name: 'gender', ref: genderRef, msg: 'Gender is required' });
        if (!isHeightValid) invalidFields.push({ name: 'height', ref: heightRef, msg: invalidHeight ? 'Height must be 50–250 cm' : 'Height is required' });
        if (!isWeightValid) invalidFields.push({ name: 'weight', ref: weightRef, msg: invalidWeight ? 'Weight must be 20–300 kg' : 'Weight is required' });

        if (invalidFields.length > 0) {
            const newHadError = { ...hadError };
            invalidFields.forEach(item => { newHadError[item.name] = true; });
            setHadError(newHadError);

            const first = invalidFields[0];
            setLiveAnnouncement(`Form has ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}. Focused on ${first.name}.`);
            if (first.ref && first.ref.current) {
                first.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                first.ref.current.focus();
            }
            return;
        }

        const hM = Number(form.height) / 100;
        const w = Number(form.weight);
        const bmi = parseFloat((w / (hM * hM)).toFixed(1));
        const cat = getCategory(bmi);
        setResult({ bmi, label: cat.label, category: cat.label, color: cat.color, advice: cat.advice });
    };

    const handleReset = () => {
        setForm({ age: '', gender: '', height: '', weight: '' });
        setResult(null);
        setSubmitted(false);
    };

    const gaugePercent = result ? Math.min(100, Math.max(0, ((result.bmi - 10) / 30) * 100)) : 0;

    return (
        <PageReveal className="bmi-page">
            <h1>BMI Calculator</h1>
            <p className="subtitle">Calculate your Body Mass Index</p>

            <div className="bmi-layout">
                {/* Form Card */}
                <div className="glass-card bmi-form-card">
                    <h3><BarChart2 size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} /> Enter Your Details</h3>
                    <form onSubmit={handleCalculate} noValidate>
                        <div className="input-group">
                            <label htmlFor="bmi-age">Age</label>
                            <div className={`input-field ${getFieldClass('age')}`}>
                                <span className="icon"><Cake size={20} /></span>
                                <input ref={ageRef} id="bmi-age" type="number" placeholder="25"
                                    value={form.age}
                                    onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value.slice(0, 2) }))}
                                    onKeyDown={(e) => {
                                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                                        if (e.target.value.length >= 2 && /^[0-9]$/.test(e.key)) e.preventDefault();
                                    }}
                                    min="10" max="99"
                                    aria-invalid={getFieldClass('age') === 'invalid'}
                                    required />
                                <span className="bmi-unit">years</span>
                            </div>
                            {getFieldClass('age') === 'invalid' && (
                                <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {invalidAge ? 'Age must be between 10 and 120 years' : 'Age is required'}</div>
                            )}
                        </div>

                        <div className="input-group">
                            <label htmlFor="bmi-gender">Gender</label>
                            <div className={`input-field ${getFieldClass('gender')}`}>
                                <span className="icon"><User size={20} /></span>
                                <select ref={genderRef} id="bmi-gender" value={form.gender} onChange={update('gender')} aria-invalid={getFieldClass('gender') === 'invalid'} required>
                                    <option value="" disabled>Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            {getFieldClass('gender') === 'invalid' && (
                                <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Gender is required</div>
                            )}
                        </div>

                        <div className="input-group">
                            <label htmlFor="bmi-height">Height</label>
                            <div className={`input-field ${getFieldClass('height')}`}>
                                <span className="icon"><Ruler size={20} /></span>
                                <input ref={heightRef} id="bmi-height" type="number" placeholder="175"
                                    value={form.height}
                                    onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value.slice(0, 3) }))}
                                    onKeyDown={(e) => {
                                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                                        if (e.target.value.length >= 3 && /^[0-9]$/.test(e.key)) e.preventDefault();
                                    }}
                                    min="50" max="250"
                                    aria-invalid={getFieldClass('height') === 'invalid'}
                                    required />
                                <span className="bmi-unit">cm</span>
                            </div>
                            {getFieldClass('height') === 'invalid' && (
                                <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {invalidHeight ? 'Height must be between 50 and 250 cm' : 'Height is required'}</div>
                            )}
                        </div>

                        <div className="input-group">
                            <label htmlFor="bmi-weight">Weight</label>
                            <div className={`input-field ${getFieldClass('weight')}`}>
                                <span className="icon"><Scale size={20} /></span>
                                <input ref={weightRef} id="bmi-weight" type="number" placeholder="70"
                                    value={form.weight}
                                    onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value.slice(0, 3) }))}
                                    onKeyDown={(e) => {
                                        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                                        if (e.target.value.length >= 3 && /^[0-9]$/.test(e.key)) e.preventDefault();
                                    }}
                                    min="20" max="300"
                                    aria-invalid={getFieldClass('weight') === 'invalid'}
                                    required />
                                <span className="bmi-unit">kg</span>
                            </div>
                            {getFieldClass('weight') === 'invalid' && (
                                <div className="field-error"><AlertCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> {invalidWeight ? 'Weight must be between 20 and 300 kg' : 'Weight is required'}</div>
                            )}
                        </div>

                        <div className="bmi-actions">
                            <AccessibleButton 
                                className="btn-primary" 
                                type="submit" 
                                disabled={!canCalculate}
                                disabledReason="Select gender and enter valid height and weight to calculate BMI."
                            >
                                Calculate BMI
                            </AccessibleButton>
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
                            <div className="bmi-empty-icon"><Scale size={48} /></div>
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
                                     <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: result.color, display: 'inline-block', marginRight: '6px' }} />
                                     {result.label}
                                </span>
                            </div>

                            <div className="bmi-advice">
                                <h4><Lightbulb size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Recommendation</h4>
                                <p>{result.advice}</p>
                            </div>

                            <div className="bmi-scale">
                                {BMI_CATEGORIES.slice(0, 4).map((cat) => (
                                    <div
                                        key={cat.label}
                                        className={`bmi-scale-item ${result.label === cat.label ? 'active' : ''}`}
                                        style={{ borderColor: result.label === cat.label ? cat.color : 'var(--border)' }}
                                    >
                                        <span className="scale-emoji">
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
                                        </span>
                                        <span className="scale-label">{cat.label}</span>
                                        <span className="scale-range">≤ {cat.max}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageReveal>
    );
}

