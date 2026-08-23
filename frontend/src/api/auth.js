// =============================================
// API Layer — Connected to Spring Boot Backend
// Backend runs on http://localhost:8080
// Vite proxy forwards /api/** → http://localhost:8080
// =============================================

const API_BASE = '/api';
export const SESSION_AUTH = 'session';

// ---- Helper: Get Bearer Auth header from credentials ----

function getAuthHeader(credentials) {
    if (!credentials || credentials === SESSION_AUTH) return {};
    return { Authorization: `Bearer ${credentials}` };
}

function checkAuthError(res) {
    if (res.status === 401 || res.status === 403) {
        window.dispatchEvent(new Event('auth-expired'));
    }
    if (res.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
    }
}

// ---- Auth ----

export async function signupUser({ username, email, password, age }) {
    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, age: parseInt(age) }),
    });
    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error('Server error — please try again later.');
    }
    
    if (!res.ok) {
        checkAuthError(res);
        // Handle validation errors specifically
        if (data.errors && data.errors.email) {
            throw new Error(data.errors.email);
        }
        throw new Error(data.message || 'Signup failed');
    }
    return data;
}

export async function loginUser({ email, password }) {
    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error('Server error — please try again later.');
    }
    
    if (!res.ok) {
        checkAuthError(res);
        // Handle specific validation errors
        if (data.message && data.message.includes('valid email')) {
            throw new Error(data.message);
        }
        throw new Error(data.message || 'Login failed');
    }
    // Extract JWT token and user data from response
    const credentials = data.token;
    const user = {
        username: data.username,
        email: data.email,
        age: data.age,
        height: data.height,
        weight: data.weight
    };
    return { credentials, user };
}

export async function changePassword(credentials, { currentPassword, newPassword }) {
    const res = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    checkAuthError(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to change password');
    return data;
}

export async function resendVerificationEmail(email) {
    const res = await fetch(`${API_BASE}/resend-verification`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to resend email');
    return data;
}

export async function verifyEmail(token) {
    const res = await fetch(`${API_BASE}/verify-email?token=${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed');
    return data;
}

// ---- Dashboard ----

export async function fetchDashboard(credentials) {
    const res = await fetch(`${API_BASE}/dashboard?_t=${Date.now()}`, {
        headers: { ...getAuthHeader(credentials) },
        cache: 'no-store',
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return await res.json();
}

// ---- Workouts ----

export async function logWorkout(credentials, { workout_name, duration, calories_burned, date }) {
    const res = await fetch(`${API_BASE}/workouts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify({ workout_name, duration, calories_burned, date }),
    });
    checkAuthError(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to log workout');
    return data;
}

export async function fetchWorkouts(credentials) {
    const res = await fetch(`${API_BASE}/workouts?_t=${Date.now()}`, {
        headers: { ...getAuthHeader(credentials) },
        cache: 'no-store',
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch workouts');
    return await res.json();
}

export async function generateWorkoutPlan(credentials, payload) {
    const goalMap = {
        fat_loss: 'Fat Loss',
        weight_loss: 'Weight Loss',
        muscle_gain: 'Muscle Gain',
        strength: 'Strength',
        endurance: 'Endurance',
        general_fitness: 'General Fitness',
    };

    const fitnessLevelMap = {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
    };

    const genderMap = {
        male: 'Male',
        female: 'Female',
        other: 'Other',
    };

    const locationMap = {
        home: 'Home',
        gym: 'Gym',
    };

    const styleMap = {
        cardio: 'Cardio',
        strength: 'Strength',
        hiit: 'HIIT',
        yoga: 'Yoga',
        mixed: 'Mixed',
    };

    const activityMap = {
        sedentary: 'Sedentary',
        light: 'Light',
        moderate: 'Moderate',
        active: 'Active',
    };

    const requestBody = {
        age: Math.max(13, Math.min(90, parseInt(payload.age) || 25)),
        gender: genderMap[payload.gender?.toLowerCase()] || payload.gender || 'Male',
        height_cm: parseFloat(payload.height) || 175,
        weight_kg: parseFloat(payload.weight) || 70,
        bmi: payload.height && payload.weight ? parseFloat((payload.weight / ((payload.height / 100) ** 2)).toFixed(1)) : null,
        body_fat_pct: payload.body_fat_pct ? parseFloat(payload.body_fat_pct) : null,
        fitness_level: fitnessLevelMap[payload.fitness_level?.toLowerCase()] || payload.fitness_level || 'Beginner',
        goal: goalMap[payload.goal?.toLowerCase()] || payload.goal || 'General Fitness',
        medical_conditions: Array.isArray(payload.medical_conditions) && payload.medical_conditions.length > 0 
            ? payload.medical_conditions 
            : ['None'],
        workout_location: locationMap[payload.workout_location?.toLowerCase()] || payload.workout_location || 'Gym',
        available_equipment: Array.isArray(payload.equipment) && payload.equipment.length > 0
            ? payload.equipment.map(e => e === 'No Equipment' ? 'None' : e)
            : ['None'],
        workout_days_per_week: Array.isArray(payload.workout_days) && payload.workout_days.length > 0
            ? payload.workout_days.length
            : (parseInt(payload.days_per_week) || 4),
        workout_days: Array.isArray(payload.workout_days) && payload.workout_days.length > 0
            ? payload.workout_days
            : null,
        workout_duration_minutes: parseInt(payload.duration) || 45,
        preferred_style: styleMap[payload.preferred_style?.toLowerCase()] || payload.preferred_style || 'Mixed',
        target_muscle_groups: Array.isArray(payload.target_muscle_groups) ? payload.target_muscle_groups : [],
        sleep_hours: payload.sleep_hours ? parseFloat(payload.sleep_hours) : 7,
        daily_activity_level: activityMap[payload.daily_activity_level?.toLowerCase()] || payload.daily_activity_level || 'Moderate',
        experience: fitnessLevelMap[payload.fitness_level?.toLowerCase()] || 'Beginner',
        previous_injuries: payload.previous_injuries || 'None',
        heart_rate: payload.heart_rate ? parseInt(payload.heart_rate) : null,
    };

    // --- Active: Spring Boot Backend Endpoint ---
    let res = await fetch(`${API_BASE}/workouts/plan/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify(requestBody),
    });

    if (res.status === 404) {
        res = await fetch(`${API_BASE}/workouts/generate-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(credentials),
            },
            body: JSON.stringify(requestBody),
        });
    }
    
    if (!res.ok) {
        checkAuthError(res);
        let errorData;
        try {
            errorData = await res.json();
        } catch {
            throw new Error('Failed to generate workout plan from backend service');
        }
        throw new Error(errorData.detail?.[0]?.msg || errorData.message || 'Workout plan generation failed');
    }

    return await res.json();
}

// ---- Food / Meals ----

export function sanitizeErrorMessage(msg, serviceName = 'Server') {
    if (!msg || typeof msg !== 'string') {
        return `Could not connect to ${serviceName}.`;
    }
    const lower = msg.toLowerCase();
    if (
        lower.includes('org.springframework') ||
        lower.includes('throwablewrapper') ||
        lower.includes('exception') ||
        lower.includes('connectionrefused') ||
        lower.includes('failed to fetch') ||
        lower.includes('internal server error') ||
        lower.includes('jedis') ||
        lower.includes('redis') ||
        lower.includes('hibernate') ||
        /^[a-zA-Z0-9_.]+\.[a-zA-Z0-9_$]+:/.test(msg)
    ) {
        return `Could not connect to ${serviceName}.`;
    }
    return msg;
}

export function getLocalDateString(d = new Date()) {
    if (!d) d = new Date();
    if (typeof d === 'string') {
        const trimmed = d.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return trimmed.substring(0, 10);
        }
    }
    const date = (d instanceof Date) ? d : new Date(d);
    if (isNaN(date.getTime())) {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function searchFoods(query, credentials) {
    const res = await fetch(`${API_BASE}/foods/search?q=${encodeURIComponent(query)}`, {
        headers: { ...getAuthHeader(credentials) },
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to search foods');
    return await res.json();
}

export async function logMeal(credentials, { food_name, calories, protein, fats, date }) {
    const localDate = date || getLocalDateString();
    const res = await fetch(`${API_BASE}/meals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify({ food_name, calories, protein, fats, date: localDate }),
    });
    checkAuthError(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to log meal');
    return data;
}

export async function fetchMeals(credentials) {
    const res = await fetch(`${API_BASE}/meals?_t=${Date.now()}`, {
        headers: { ...getAuthHeader(credentials) },
        cache: 'no-store',
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch meals');
    return await res.json();
}

export async function fetchMealSummary(credentials, date) {
    const localDate = date || getLocalDateString();
    const res = await fetch(`${API_BASE}/meals/summary?date=${localDate}&_t=${Date.now()}`, {
        headers: { ...getAuthHeader(credentials) },
        cache: 'no-store',
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch meal summary');
    return await res.json();
}

// ---- Food Plan Generation (ML Model) ----

export async function generateFoodPlan(credentials, { age, gender, height, weight, goal, meal_type, diet_type }) {
    const res = await fetch(`${API_BASE}/food-plan/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify({ age, gender, height, weight, goal, meal_type, diet_type }),
    });
    checkAuthError(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate food plan');
    return data;
}

// ---- Recovery Score Prediction (ML Model) ----

export async function predictRecoveryScore({ sleep_hours, resting_heart_rate, previous_workout_intensity, muscle_soreness, water_intake_liters }) {
    const payload = {
        sleep_hours: parseFloat(sleep_hours),
        resting_heart_rate: parseInt(resting_heart_rate),
        previous_workout_intensity: parseInt(previous_workout_intensity),
        muscle_soreness: parseInt(muscle_soreness),
        water_intake_liters: parseFloat(water_intake_liters),
    };

    const res = await fetch(`${API_BASE}/recovery/predict`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch {
            throw new Error('Failed to predict recovery score from service');
        }
        throw new Error(errorData.message || 'Recovery prediction failed');
    }
    
    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || 'Recovery prediction failed');
    }
    
    return data.data;

    return await res.json();
}

// ---- Calorie Burn Prediction (ML Model) ----

export async function predictCalories({ age, gender, weight_kg, height_cm, body_fat_pct, exercise_type, duration_min, heart_rate, intensity }) {
    const res = await fetch(`${API_BASE}/calorie-predictions/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, gender, weight_kg, height_cm, body_fat_pct, exercise_type, duration_min, heart_rate, intensity }),
    });
    const data = await res.json();
    if (!data.success) {
        // Handle different error types with specific messages
        let errorMessage = data.message || 'Prediction failed';
        
        switch (data.errorType) {
            case 'VALIDATION_ERROR':
                errorMessage = `Invalid input: ${data.message}`;
                break;
            case 'ML_SERVICE_UNAVAILABLE':
                errorMessage = 'ML service is temporarily unavailable. Please try again later.';
                break;
            case 'NETWORK_ERROR':
                errorMessage = 'Network connection issue. Please check your internet and try again.';
                break;
            case 'TIMEOUT_ERROR':
                errorMessage = 'Request timed out. Please try again.';
                break;
            case 'ML_SERVICE_ERROR':
                errorMessage = 'ML service error. Please try again later.';
                break;
            default:
                errorMessage = data.message || 'An unexpected error occurred. Please try again.';
        }
        
        throw new Error(errorMessage);
    }
    return data.data;
}

export async function checkMLHealth() {
    const res = await fetch(`${API_BASE}/calorie-predictions/health`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Health check failed');
    }
    return data;
}

export async function getSupportedExercises() {
    const res = await fetch(`${API_BASE}/calorie-predictions/exercises`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to get exercises');
    }
    return data.data;
}

export async function saveCaloriePrediction(credentials, predictionData) {
    const res = await fetch(`${API_BASE}/calorie-predictions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify(predictionData),
    });
    checkAuthError(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save prediction');
    return data;
}

export async function fetchCaloriePredictions(credentials) {
    const res = await fetch(`${API_BASE}/calorie-predictions`, {
        headers: { ...getAuthHeader(credentials) },
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch predictions');
    return await res.json();
}

export async function fetchUserProfile(credentials) {
    const res = await fetch(`${API_BASE}/me`, {
        headers: { ...getAuthHeader(credentials) },
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
}

export async function updateUserMacros(credentials, macroData) {
    const res = await fetch(`${API_BASE}/me/macros`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify(macroData),
    });
    checkAuthError(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save macro targets');
    return data;
}
