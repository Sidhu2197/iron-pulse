import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserProfile, updateUserMacros } from '../api/auth';

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
  const { user, token } = useAuth();
  const [userMacros, setUserMacros] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isNewlyRegistered, setIsNewlyRegistered] = useState(false);

  // Storage key fallback
  const storageKey = user?.email ? `iron_macros_${user.email.toLowerCase()}` : 'iron_macros_guest';
  const newRegKey = user?.email ? `iron_newly_registered_${user.email.toLowerCase()}` : null;

  useEffect(() => {
    if (user?.email) {
      const isNew = newRegKey ? localStorage.getItem(newRegKey) === 'true' : false;
      setIsNewlyRegistered(isNew);

      // 1. Try fetching DB macro targets from backend
      fetchUserProfile(token)
        .then((profile) => {
          if (profile && profile.hasConfiguredMacros) {
            const dbMacros = {
              age: profile.age || 25,
              height: profile.height || 175,
              weight: profile.weight || 70,
              gender: profile.gender || 'male',
              activity: profile.activity || 'moderately_active',
              goal: profile.goal || 'maintenance',
              calories: profile.targetCalories || 2200,
              protein: profile.targetProtein || 150,
              fats: profile.targetFats || 70,
              carbs: profile.targetCarbs || 240,
            };
            setUserMacros(dbMacros);
            localStorage.setItem(storageKey, JSON.stringify(dbMacros));
            setIsNewlyRegistered(false);
          } else {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
              try { setUserMacros(JSON.parse(saved)); } catch { setUserMacros(null); }
            } else {
              setUserMacros(null);
            }
          }
        })
        .catch(() => {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try { setUserMacros(JSON.parse(saved)); } catch { setUserMacros(null); }
          }
        });
    } else {
      setUserMacros(null);
      setIsNewlyRegistered(false);
    }
  }, [user?.email, token, storageKey, newRegKey]);

  const saveMacros = async (formData) => {
    const calculated = calculateMacroTargets(formData);
    setUserMacros(calculated);
    localStorage.setItem(storageKey, JSON.stringify(calculated));
    if (newRegKey) {
      localStorage.removeItem(newRegKey);
    }
    setIsNewlyRegistered(false);
    setModalOpen(false);

    // Save to Database
    try {
      if (token) {
        await updateUserMacros(token, {
          gender: calculated.gender,
          activity: calculated.activity,
          goal: calculated.goal,
          age: calculated.age,
          height: calculated.height,
          weight: calculated.weight,
          calories: calculated.calories,
          protein: calculated.protein,
          fats: calculated.fats,
          carbs: calculated.carbs,
        });
      }
    } catch (err) {
      console.warn('Could not sync macros to DB:', err);
    }

    return calculated;
  };

  const openMacroCalculator = () => setModalOpen(true);
  const closeMacroCalculator = () => setModalOpen(false);

  const hasConfiguredMacros = Boolean(userMacros && userMacros.calories);
  const shouldShowOnboardingWizard = Boolean(user && isNewlyRegistered && !hasConfiguredMacros);

  return (
    <MacroContext.Provider
      value={{
        userMacros,
        saveMacros,
        modalOpen,
        openMacroCalculator,
        closeMacroCalculator,
        hasConfiguredMacros,
        shouldShowOnboardingWizard,
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
