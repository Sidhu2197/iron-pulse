import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const MacroContext = createContext(null);

export const ACTIVITY_MULTIPLIERS = {
  sedentary: { label: 'Sedentary (desk job, little/no exercise)', value: 1.2 },
  lightly_active: { label: 'Lightly Active (exercise 1-3 days/week)', value: 1.375 },
  moderately_active: { label: 'Moderately Active (exercise 3-5 days/week)', value: 1.55 },
  very_active: { label: 'Very Active (hard exercise 6-7 days/week)', value: 1.725 },
  extra_active: { label: 'Extra Active (physical job & 2x daily workouts)', value: 1.9 },
};

export const FITNESS_GOALS = {
  fat_loss: { label: 'Fat Loss (Caloric Deficit -500 kcal)', calAdjustment: -500, proteinMultiplier: 2.2 },
  maintenance: { label: 'Maintenance (Maintain Weight)', calAdjustment: 0, proteinMultiplier: 2.0 },
  muscle_gain: { label: 'Muscle Gain (Caloric Surplus +350 kcal)', calAdjustment: 350, proteinMultiplier: 2.2 },
};

export function calculateMacroTargets(data) {
  const age = Number(data.age) || 25;
  const height = Number(data.height) || 175;
  const weight = Number(data.weight) || 70;
  const gender = data.gender || 'male';
  const activityKey = data.activity || 'moderately_active';
  const goalKey = data.goal || 'maintenance';

  // 1. BMR (Mifflin-St Jeor)
  const bmr = gender === 'male'
    ? Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5)
    : Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161);

  // 2. TDEE
  const actMult = ACTIVITY_MULTIPLIERS[activityKey]?.value || 1.55;
  const tdee = Math.round(bmr * actMult);

  // 3. Goal Adjustment
  const goalObj = FITNESS_GOALS[goalKey] || FITNESS_GOALS.maintenance;
  const calories = Math.max(1200, Math.round(tdee + goalObj.calAdjustment));

  // 4. Protein (g)
  const protein = Math.round(weight * goalObj.proteinMultiplier);
  const proteinCal = protein * 4;

  // 5. Fats (g) - 25% of total calories
  const fatCal = calories * 0.25;
  const fats = Math.round(fatCal / 9);

  // 6. Carbs (g) - remaining calories
  const carbCal = Math.max(0, calories - (proteinCal + fatCal));
  const carbs = Math.round(carbCal / 4);

  return {
    age, height, weight, gender, activity: activityKey, goal: goalKey,
    bmr, tdee, calories, protein, fats, carbs,
  };
}

export function MacroProvider({ children }) {
  const { user } = useAuth();
  const [userMacros, setUserMacros] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Storage key based on user email
  const storageKey = user?.email ? `iron_macros_${user.email}` : 'iron_macros_guest';

  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setUserMacros(JSON.parse(saved));
        } catch {
          setUserMacros(null);
        }
      } else {
        setUserMacros(null);
      }
    } else {
      setUserMacros(null);
    }
  }, [user?.email, storageKey]);

  const saveMacros = (formData) => {
    const calculated = calculateMacroTargets(formData);
    setUserMacros(calculated);
    localStorage.setItem(storageKey, JSON.stringify(calculated));
    setModalOpen(false);
    return calculated;
  };

  const openMacroCalculator = () => setModalOpen(true);
  const closeMacroCalculator = () => setModalOpen(false);

  const hasConfiguredMacros = Boolean(userMacros && userMacros.calories);

  return (
    <MacroContext.Provider
      value={{
        userMacros,
        saveMacros,
        modalOpen,
        openMacroCalculator,
        closeMacroCalculator,
        hasConfiguredMacros,
        calculateMacroTargets,
      }}
    >
      {children}
    </MacroContext.Provider>
  );
}

export function useMacros() {
  const context = useContext(MacroContext);
  if (!context) {
    throw new Error('useMacros must be used within a MacroProvider');
  }
  return context;
}
