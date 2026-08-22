import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { generateFoodPlan, generateWorkoutPlan, predictCalories } from '../api/auth';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const { show } = useToast();
  const { token } = useAuth();

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

  // Reset state when auth token changes to null (logout)
  useEffect(() => {
    if (!token) {
      setFoodPlan(null);
      setFoodPlanLoading(false);
      setFoodPlanError('');
      setWorkoutPlan(null);
      setWorkoutPlanLoading(false);
      setWorkoutPlanError('');
      setCaloriePrediction(null);
      setCaloriePredictionLoading(false);
      setCaloriePredictionError('');
    }
  }, [token]);

  const triggerGenerateFoodPlan = useCallback(async (authToken, payload) => {
    setFoodPlanLoading(true);
    setFoodPlanError('');
    try {
      const data = await generateFoodPlan(authToken, payload);
      setFoodPlan(data);
      show({
        type: 'success',
        message: '🥗 Your Food Plan has been generated successfully!',
        duration: 5000,
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate food plan';
      setFoodPlanError(errorMsg);
      show({
        type: 'error',
        message: `⚠️ Food Plan generation failed: ${errorMsg}`,
        duration: 5000,
      });
      throw err;
    } finally {
      setFoodPlanLoading(false);
    }
  }, [show]);

  const triggerGenerateWorkoutPlan = useCallback(async (authToken, payload) => {
    setWorkoutPlanLoading(true);
    setWorkoutPlanError('');
    try {
      const data = await generateWorkoutPlan(authToken, payload);
      setWorkoutPlan(data);
      show({
        type: 'success',
        message: '💪 Your Workout Plan has been generated successfully!',
        duration: 5000,
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate workout plan';
      setWorkoutPlanError(errorMsg);
      show({
        type: 'error',
        message: `⚠️ Workout Plan generation failed: ${errorMsg}`,
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
        message: `🔥 Calorie Prediction Ready: ${data.calories_burned?.toFixed(1)} calories burned!`,
        duration: 5000,
      });
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Prediction failed';
      setCaloriePredictionError(errorMsg);
      show({
        type: 'error',
        message: `⚠️ Calorie prediction failed: ${errorMsg}`,
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
