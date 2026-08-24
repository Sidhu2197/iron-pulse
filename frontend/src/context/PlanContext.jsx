import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchLatestWorkoutPlan, generateFoodPlan, generateWorkoutPlan, predictCalories } from '../api/auth';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

const getStoredWorkoutPlan = () => {
  try {
    const saved = localStorage.getItem('iron_workout_plan');
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
  const { token, loading: authLoading } = useAuth();

  // Food Plan State
  const [foodPlan, setFoodPlan] = useState(null);
  const [foodPlanLoading, setFoodPlanLoading] = useState(false);
  const [foodPlanError, setFoodPlanError] = useState('');

  // Workout Plan State (persisted in localStorage for 7 days / 1 week across sessions & logout)
  const [workoutPlan, setWorkoutPlan] = useState(getStoredWorkoutPlan);
  const [workoutPlanLoading, setWorkoutPlanLoading] = useState(false);
  const [workoutPlanError, setWorkoutPlanError] = useState('');

  // Calorie AI State
  const [caloriePrediction, setCaloriePrediction] = useState(null);
  const [caloriePredictionLoading, setCaloriePredictionLoading] = useState(false);
  const [caloriePredictionError, setCaloriePredictionError] = useState('');

  // On mount/login: check localStorage first, then backend if missing
  useEffect(() => {
    if (authLoading) return;

    // 1. Check localStorage first
    const cachedPlan = getStoredWorkoutPlan();
    if (cachedPlan) {
      setWorkoutPlan(cachedPlan);
      return;
    }

    // 2. If not in localStorage and user is logged in, check backend
    if (!token) return;

    let isMounted = true;
    const checkBackendPlan = async () => {
      setWorkoutPlanLoading(true);
      try {
        const planData = await fetchLatestWorkoutPlan(token);
        if (isMounted && planData && planData.weekly_plan) {
          setWorkoutPlan(planData);
          try {
            localStorage.setItem('iron_workout_plan', JSON.stringify({
              plan: planData,
              timestamp: Date.now(),
            }));
          } catch (e) {
            console.warn('Failed to cache backend workout plan:', e);
          }
        }
      } catch (e) {
        console.warn('No active backend workout plan found:', e.message);
      } finally {
        if (isMounted) setWorkoutPlanLoading(false);
      }
    };

    checkBackendPlan();

    return () => { isMounted = false; };
  }, [token, authLoading]);

  // Reset transient states on explicit logout (DO NOT delete iron_workout_plan from localStorage)
  useEffect(() => {
    if (!authLoading && !token) {
      setFoodPlan(null);
      setFoodPlanLoading(false);
      setFoodPlanError('');
      setCaloriePrediction(null);
      setCaloriePredictionLoading(false);
      setCaloriePredictionError('');
    }
  }, [token, authLoading]);

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
    
    // 1. Check localStorage first if forceRefresh is false
    if (!forceRefresh) {
      try {
        const saved = localStorage.getItem('iron_workout_plan');
        if (saved) {
          const { plan, timestamp } = JSON.parse(saved);
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - timestamp < SEVEN_DAYS_MS && plan?.weekly_plan) {
            setWorkoutPlan(plan);
            return plan;
          }
        }
      } catch (e) {
        console.warn('Error reading cached workout plan from localStorage:', e);
      }
    }

    // 2. If not found in localStorage (or forceRefresh requested), call backend API
    setWorkoutPlanLoading(true);
    setWorkoutPlanError('');
    try {
      const data = await generateWorkoutPlan(authToken, payload);
      // Backend wraps the plan in { success, data } — unwrap so components get { weekly_plan, ... }
      const planData = data?.weekly_plan ? data : (data?.data?.weekly_plan ? data.data : data);
      setWorkoutPlan(planData);
      try {
        localStorage.setItem('iron_workout_plan', JSON.stringify({
          plan: planData,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to save workout plan to localStorage:', e);
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
  }, [show]);

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
