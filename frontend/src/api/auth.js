// =============================================
// API Layer — Connected to Spring Boot Backend
// Backend runs on http://localhost:8080
// Vite proxy forwards /api/** → http://localhost:8080
// =============================================

const API_BASE = '/api';
export const SESSION_AUTH = 'session';

// ---- Helper: Get Basic Auth header from credentials ----

function getAuthHeader(credentials) {
    if (!credentials || credentials === SESSION_AUTH) return {};
    return { Authorization: `Basic ${credentials}` };
}

// ---- Auth ----

export async function signupUser({ username, email, password, age, securityQuestion, securityAnswer }) {
    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, age: parseInt(age), securityQuestion, securityAnswer }),
    });
    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error('Server error — please try again later.');
    }
    
    if (!res.ok) {
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
        // Handle specific validation errors
        if (data.message && data.message.includes('valid email')) {
            throw new Error(data.message);
        }
        throw new Error(data.message || 'Login failed');
    }
    const credentials = btoa(`${email}:${password}`);
    return { credentials, user: data };
}

export async function fetchProfile(credentials) {
    const res = await fetch(`${API_BASE}/me`, {
        headers: { ...getAuthHeader(credentials) },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch profile');
    }
    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error('Failed to parse profile data');
    }
    return data;
}

export async function updateProfile(credentials, { username, age, height, weight }) {
    const res = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify({
            username: username?.trim() || undefined,
            age: age ? parseInt(age) : undefined,
            height: height ? parseFloat(height) : undefined,
            weight: weight ? parseFloat(weight) : undefined,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');
    return data;
}

// ---- Dashboard ----

export async function fetchDashboard(credentials) {
    const res = await fetch(`${API_BASE}/dashboard`, {
        headers: { ...getAuthHeader(credentials) },
    });
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to log workout');
    return data;
}

export async function fetchWorkouts(credentials) {
    const res = await fetch(`${API_BASE}/workouts`, {
        headers: { ...getAuthHeader(credentials) },
    });
    if (!res.ok) throw new Error('Failed to fetch workouts');
    return await res.json();
}

export async function generateWorkoutPlan(credentials, { age, weight, height, gender, fitness_level, equipment, goal, days_per_week, duration }) {
    // Workout plan generation is handled server-side in the future.
    // For now, return a simple plan based on the goal.
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to log meal');
    return data;
}

export async function fetchMeals(credentials) {
    const res = await fetch(`${API_BASE}/meals`, {
        headers: { ...getAuthHeader(credentials) },
    });
    if (!res.ok) throw new Error('Failed to fetch meals');
    return await res.json();
}

export async function fetchMealSummary(credentials) {
    const res = await fetch(`${API_BASE}/meals/summary`, {
        headers: { ...getAuthHeader(credentials) },
    });
    if (!res.ok) throw new Error('Failed to fetch meal summary');
    return await res.json();
}

// ---- Food Plan Generation ----

export async function generateFoodPlan(credentials, { age, gender, height, weight, goal, meal_type, diet_type }) {
    // Food plan generation — uses predefined food lists
    const VEG_FOODS = {
        breakfast: [
            { food_name: 'Oatmeal with Banana', calories: 260, protein: 8, fats: 4, serving: '1 bowl' },
            { food_name: 'Paneer Paratha', calories: 320, protein: 12, fats: 14, serving: '2 pieces' },
            { food_name: 'Idli with Sambar', calories: 220, protein: 7, fats: 3, serving: '3 idlis' },
            { food_name: 'Greek Yogurt Bowl', calories: 180, protein: 17, fats: 2, serving: '1 cup' },
        ],
        lunch: [
            { food_name: 'Dal Tadka + Rice', calories: 380, protein: 14, fats: 8, serving: '1 plate' },
            { food_name: 'Rajma Chawal', calories: 420, protein: 16, fats: 7, serving: '1 plate' },
            { food_name: 'Paneer Butter Masala + Roti', calories: 450, protein: 20, fats: 22, serving: '1 plate' },
            { food_name: 'Vegetable Biryani', calories: 360, protein: 10, fats: 12, serving: '1 plate' },
        ],
        dinner: [
            { food_name: 'Mixed Vegetable Curry + Chapati', calories: 310, protein: 10, fats: 9, serving: '1 plate' },
            { food_name: 'Palak Paneer + Rice', calories: 400, protein: 18, fats: 16, serving: '1 plate' },
            { food_name: 'Moong Dal Khichdi', calories: 280, protein: 12, fats: 5, serving: '1 bowl' },
            { food_name: 'Curd Rice', calories: 240, protein: 8, fats: 4, serving: '1 bowl' },
        ],
    };

    const NONVEG_FOODS = {
        breakfast: [
            { food_name: 'Egg Omelette + Toast', calories: 310, protein: 18, fats: 14, serving: '2 eggs' },
            { food_name: 'Boiled Eggs + Avocado', calories: 280, protein: 16, fats: 18, serving: '2 eggs' },
            { food_name: 'Chicken Sausage Wrap', calories: 350, protein: 22, fats: 15, serving: '1 wrap' },
            { food_name: 'Protein Pancakes', calories: 300, protein: 25, fats: 8, serving: '3 pieces' },
        ],
        lunch: [
            { food_name: 'Grilled Chicken Breast + Rice', calories: 450, protein: 38, fats: 8, serving: '1 plate' },
            { food_name: 'Chicken Biryani', calories: 500, protein: 25, fats: 16, serving: '1 plate' },
            { food_name: 'Fish Curry + Roti', calories: 380, protein: 30, fats: 12, serving: '1 plate' },
            { food_name: 'Egg Fried Rice', calories: 420, protein: 15, fats: 14, serving: '1 plate' },
        ],
        dinner: [
            { food_name: 'Salmon Fillet + Salad', calories: 350, protein: 32, fats: 16, serving: '200g' },
            { food_name: 'Chicken Tikka + Naan', calories: 460, protein: 28, fats: 18, serving: '1 plate' },
            { food_name: 'Mutton Keema + Chapati', calories: 480, protein: 26, fats: 22, serving: '1 plate' },
            { food_name: 'Grilled Fish + Veggies', calories: 300, protein: 28, fats: 10, serving: '1 plate' },
        ],
    };

    const db = diet_type === 'veg' ? VEG_FOODS : NONVEG_FOODS;
    const items = db[meal_type] || db.lunch;

    const totalCalories = items.reduce((sum, i) => sum + i.calories, 0);
    const totalProtein = items.reduce((sum, i) => sum + i.protein, 0);
    const totalFats = items.reduce((sum, i) => sum + i.fats, 0);

    return {
        items: [...items],
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_fats: totalFats,
    };
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

export async function saveCaloriePrediction(credentials, predictionData) {
    const res = await fetch(`${API_BASE}/calorie-predictions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(credentials),
        },
        body: JSON.stringify(predictionData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save prediction');
    return data;
}

export async function fetchCaloriePredictions(credentials) {
    const res = await fetch(`${API_BASE}/calorie-predictions`, {
        headers: { ...getAuthHeader(credentials) },
    });
    if (!res.ok) throw new Error('Failed to fetch predictions');
    return await res.json();
}
