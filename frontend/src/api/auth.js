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
    if (res.status === 401) {
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
    const res = await fetch(`${API_BASE}/dashboard`, {
        headers: { ...getAuthHeader(credentials) },
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
    const res = await fetch(`${API_BASE}/workouts`, {
        headers: { ...getAuthHeader(credentials) },
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch workouts');
    return await res.json();
}

export async function generateWorkoutPlan(credentials, { age, weight, height, gender, fitness_level, equipment, goal, days_per_week, duration }) {
    // Workout plan generation is handled client-side for now
    // Backend doesn't have a specific workout plan generation endpoint yet
    const exercises = {
        fat_loss: [
            { name: 'Treadmill Intervals', type: 'Cardio', duration: 20, calories: 250 },
            { name: 'Jump Rope', type: 'Cardio', duration: 10, calories: 150 },
            { name: 'Burpees', type: 'HIIT', duration: 10, calories: 130 },
            { name: 'Mountain Climbers', type: 'HIIT', duration: 8, calories: 100 },
            { name: 'Plank Hold', type: 'Core', duration: 5, calories: 30 },
        ],
        muscle_gain: [
            { name: 'Barbell Bench Press', type: 'Strength', duration: 12, calories: 95 },
            { name: 'Incline Dumbbell Press', type: 'Strength', duration: 10, calories: 80 },
            { name: 'Cable Crossovers', type: 'Isolation', duration: 8, calories: 55 },
            { name: 'Overhead Triceps Extension', type: 'Isolation', duration: 8, calories: 50 },
            { name: 'Treadmill Intervals', type: 'Cardio', duration: 15, calories: 180 },
        ],
        strength: [
            { name: 'Deadlifts', type: 'Strength', duration: 15, calories: 120 },
            { name: 'Squats', type: 'Strength', duration: 12, calories: 110 },
            { name: 'Overhead Press', type: 'Strength', duration: 10, calories: 85 },
            { name: 'Barbell Rows', type: 'Strength', duration: 10, calories: 80 },
            { name: 'Farmer\'s Walk', type: 'Functional', duration: 8, calories: 60 },
        ],
        endurance: [
            { name: 'Cycling', type: 'Cardio', duration: 25, calories: 300 },
            { name: 'Running', type: 'Cardio', duration: 20, calories: 250 },
            { name: 'Rowing Machine', type: 'Cardio', duration: 15, calories: 180 },
            { name: 'Swimming Laps', type: 'Cardio', duration: 20, calories: 220 },
            { name: 'Jump Rope', type: 'Cardio', duration: 10, calories: 150 },
        ],
        general_fitness: [
            { name: 'Push-ups', type: 'Bodyweight', duration: 10, calories: 70 },
            { name: 'Squats', type: 'Bodyweight', duration: 10, calories: 80 },
            { name: 'Plank', type: 'Core', duration: 5, calories: 30 },
            { name: 'Jumping Jacks', type: 'Cardio', duration: 10, calories: 100 },
            { name: 'Stretching', type: 'Flexibility', duration: 10, calories: 30 },
        ],
    };

    const selected = exercises[goal] || exercises.general_fitness;
    const totalDuration = selected.reduce((sum, e) => sum + e.duration, 0);
    const totalCalories = selected.reduce((sum, e) => sum + e.calories, 0);

    return {
        exercises: [...selected],
        total_duration: totalDuration,
        total_calories: totalCalories,
    };
}

// ---- Food / Meals ----

export async function searchFoods(query, credentials) {
    const res = await fetch(`${API_BASE}/foods/search?q=${encodeURIComponent(query)}`, {
        headers: { ...getAuthHeader(credentials) },
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to search foods');
    return await res.json();
}

export async function logMeal(credentials, { food_name, calories, protein, fats, date }) {
    const res = await fetch(`${API_BASE}/meals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify({ food_name, calories, protein, fats, date }),
    });
    checkAuthError(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to log meal');
    return data;
}

export async function fetchMeals(credentials) {
    const res = await fetch(`${API_BASE}/meals`, {
        headers: { ...getAuthHeader(credentials) },
    });
    checkAuthError(res);
    if (!res.ok) throw new Error('Failed to fetch meals');
    return await res.json();
}

export async function fetchMealSummary(credentials) {
    const res = await fetch(`${API_BASE}/meals/summary`, {
        headers: { ...getAuthHeader(credentials) },
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
