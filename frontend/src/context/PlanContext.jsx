import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchLatestWorkoutPlan, generateFoodPlan, generateWorkoutPlan, predictCalories } from '../api/auth';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

const getWorkoutStorageKey = (email) => {
  if (!email) return null;
  return `iron_workout_plan_${email.toLowerCase().trim()}`;
};

const getStoredWorkoutPlan = (email) => {
  const key = getWorkoutStorageKey(email);
  if (!key) return null;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const { plan, timestamp } = JSON.parse(saved);
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp < SEVEN_DAYS_MS && plan?.weekly_plan) {
      return plan;
    }
    return null;
  } catch {
    return null;
  }
};

export function PlanProvider({ children }) {
  const { show } = useToast();
  const { user, token, loading: authLoading } = useAuth();

  // Food Plan State
  const [foodPlan, setFoodPlan] = useState(null);
  const [foodPlanLoading, setFoodPlanLoading] = useState(false);
  const [foodPlanError, setFoodPlanError] = useState('');

  // Workout Plan State
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [workoutPlanLoading, setWorkoutPlanLoading] = useState(false);
  const [workoutPlanError, setWorkoutPlanError] = useState('');

  // Calorie AI State
  const [caloriePrediction, setCaloriePrediction] = useState(null);
  const [caloriePredictionLoading, setCaloriePredictionLoading] = useState(false);
  const [caloriePredictionError, setCaloriePredictionError] = useState('');

  // On mount or when user/token changes: sync user-scoped workout plan
  useEffect(() => {
    if (authLoading) return;

    // Clean up legacy global (un-scoped) plan key if present
    try {
      localStorage.removeItem('iron_workout_plan');
    } catch (_) {}

    // If logged out or no user email, clear states immediately
    if (!token || !user?.email) {
      setWorkoutPlan(null);
      setFoodPlan(null);
      setFoodPlanLoading(false);
      setFoodPlanError('');
      setCaloriePrediction(null);
      setCaloriePredictionLoading(false);
      setCaloriePredictionError('');
      return;
    }

    const email = user.email;

    // 1. Check user-scoped localStorage first
    const cachedPlan = getStoredWorkoutPlan(email);
    if (cachedPlan) {
      setWorkoutPlan(cachedPlan);
      return;
    }

    // If no cache for this specific user, start with null
    setWorkoutPlan(null);

    // 2. Fetch latest plan from backend for this user
    let isMounted = true;
    const checkBackendPlan = async () => {
      setWorkoutPlanLoading(true);
      try {
        const planData = await fetchLatestWorkoutPlan(token);
        if (isMounted && planData && planData.weekly_plan) {
          setWorkoutPlan(planData);
          const key = getWorkoutStorageKey(email);
          if (key) {
            try {
              localStorage.setItem(key, JSON.stringify({
                plan: planData,
                timestamp: Date.now(),
              }));
            } catch (e) {
              console.warn('Failed to cache backend workout plan:', e);
            }
          }
        } else if (isMounted) {
          setWorkoutPlan(null);
        }
      } catch (e) {
        console.warn('No active backend workout plan found for user:', e.message);
        if (isMounted) setWorkoutPlan(null);
      } finally {
        if (isMounted) setWorkoutPlanLoading(false);
      }
    };

    checkBackendPlan();

    return () => { isMounted = false; };
  }, [user, token, authLoading]);

  const triggerGenerateFoodPlan = useCallback(async (authToken, payload) => {
    setFoodPlanLoading(true);
    setFoodPlanError('');
    try {
      const data = await generateFoodPlan(authToken, payload);
      setFoodPlan(data);
      show({
        type: 'success',
        message: 'Your Food Plan has been generated successfully!',
        duration: 5000,
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate food plan';
      setFoodPlanError(errorMsg);
      show({
        type: 'error',
        message: `Food Plan generation failed: ${errorMsg}`,
        duration: 5000,
      });
      throw err;
    } finally {
      setFoodPlanLoading(false);
    }
  }, [show]);

  const triggerGenerateWorkoutPlan = useCallback(async (authToken, payload, options = {}) => {
    const forceRefresh = options?.forceRefresh || false;
    const userEmail = user?.email;

    // 1. Check user-scoped localStorage first if forceRefresh is false
    if (!forceRefresh && userEmail) {
      const cached = getStoredWorkoutPlan(userEmail);
      if (cached) {
        setWorkoutPlan(cached);
        return cached;
      }
    }

    // 2. Call backend API to generate user's plan
    setWorkoutPlanLoading(true);
    setWorkoutPlanError('');
    try {
      const data = await generateWorkoutPlan(authToken, payload);
      // Backend wraps the plan in { success, data } — unwrap so components get { weekly_plan, ... }
      const planData = data?.weekly_plan ? data : (data?.data?.weekly_plan ? data.data : data);
      setWorkoutPlan(planData);

      if (userEmail) {
        const key = getWorkoutStorageKey(userEmail);
        if (key) {
          try {
            localStorage.setItem(key, JSON.stringify({
              plan: planData,
              timestamp: Date.now(),
            }));
          } catch (e) {
            console.warn('Failed to save workout plan to localStorage:', e);
          }
        }
      }

      show({
        type: 'success',
        message: 'Your Workout Plan has been generated successfully!',
        duration: 5000,
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate workout plan';
      setWorkoutPlanError(errorMsg);
      show({
        type: 'error',
        message: `Workout Plan generation failed: ${errorMsg}`,
        duration: 5000,
      });
      throw err;
    } finally {
      setWorkoutPlanLoading(false);
    }
  }, [show, user]);

  const triggerPredictCalories = useCallback(async (payload) => {
    setCaloriePredictionLoading(true);
    setCaloriePredictionError('');
    try {
      const data = await predictCalories(payload);
      setCaloriePrediction(data);
      show({
        type: 'success',
        message: `Calorie Prediction Ready: ${data.calories_burned?.toFixed(1)} calories burned!`,
        duration: 5000,
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Prediction failed';
      setCaloriePredictionError(errorMsg);
      show({
        type: 'error',
        message: `Calorie prediction failed: ${errorMsg}`,
        duration: 5000,
      });
      throw err;
    } finally {
      setCaloriePredictionLoading(false);
    }
  }, [show]);

  const clearCaloriePrediction = useCallback(() => {
    setCaloriePrediction(null);
    setCaloriePredictionError('');
  }, []);

  return (
    <PlanContext.Provider value={{
      foodPlan,
      setFoodPlan,
      foodPlanLoading,
      foodPlanError,
      triggerGenerateFoodPlan,
      workoutPlan,
      setWorkoutPlan,
      workoutPlanLoading,
      workoutPlanError,
      triggerGenerateWorkoutPlan,
      caloriePrediction,
      setCaloriePrediction,
      caloriePredictionLoading,
      caloriePredictionError,
      triggerPredictCalories,
      clearCaloriePrediction,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
