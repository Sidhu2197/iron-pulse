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
  const { user, token, setUser } = useAuth();
  const [userMacros, setUserMacros] = useState(() => {
    if (user?.hasConfiguredMacros && user?.targetCalories) {
      return {
        age: user.age || 25,
        height: user.height || 175,
        weight: user.weight || 70,
        gender: user.gender || 'male',
        activity: user.activity || 'moderately_active',
        goal: user.goal || 'maintenance',
        calories: user.targetCalories,
        protein: user.targetProtein || 150,
        fats: user.targetFats || 70,
        fat: user.targetFats || 70,
        carbs: user.targetCarbs || 240,
      };
    }
    return null;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [macrosLoading, setMacrosLoading] = useState(() => {
    if (!user?.email) return false;
    return user.hasConfiguredMacros === undefined;
  });

  // Storage key fallback
  const storageKey = user?.email ? `iron_macros_${user.email.toLowerCase()}` : 'iron_macros_guest';

  useEffect(() => {
    let isMounted = true;

    if (user?.email) {
      // Fast-path: if user object already arrived with configured macros
      if (user.hasConfiguredMacros && user.targetCalories) {
        const initialMacros = {
          age: user.age || 25,
          height: user.height || 175,
          weight: user.weight || 70,
          gender: user.gender || 'male',
          activity: user.activity || 'moderately_active',
          goal: user.goal || 'maintenance',
          calories: user.targetCalories,
          protein: user.targetProtein || 150,
          fats: user.targetFats || 70,
          fat: user.targetFats || 70,
          carbs: user.targetCarbs || 240,
        };
        setUserMacros(initialMacros);
        localStorage.setItem(storageKey, JSON.stringify(initialMacros));
        setMacrosLoading(false);
      } else if (user.hasConfiguredMacros === false) {
        // Fast-path: user explicitly does not have macros set
        setUserMacros(null);
        localStorage.removeItem(storageKey);
        setMacrosLoading(false);
      } else {
        setMacrosLoading(true);
      }

      // Always verify against database profile
      fetchUserProfile(token)
        .then((profile) => {
          if (!isMounted) return;
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
              fat: profile.targetFats || 70,
              carbs: profile.targetCarbs || 240,
            };
            setUserMacros(dbMacros);
            localStorage.setItem(storageKey, JSON.stringify(dbMacros));
            if (setUser) {
              setUser((prev) => prev ? { ...prev, hasConfiguredMacros: true } : prev);
            }
          } else {
            // User does NOT have macros configured in DB
            setUserMacros(null);
            localStorage.removeItem(storageKey);
            if (setUser) {
              setUser((prev) => prev ? { ...prev, hasConfiguredMacros: false } : prev);
            }
          }
        })
        .catch(() => {
          if (!isMounted) return;
          if (!user.hasConfiguredMacros) {
            setUserMacros(null);
            localStorage.removeItem(storageKey);
          }
        })
        .finally(() => {
          if (isMounted) {
            setMacrosLoading(false);
          }
        });
    } else {
      setUserMacros(null);
      setMacrosLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.email, token, storageKey, setUser]);

  const saveMacros = async (formData) => {
    const calculated = calculateMacroTargets(formData);
    setUserMacros(calculated);
    localStorage.setItem(storageKey, JSON.stringify(calculated));
    setModalOpen(false);

    if (setUser) {
      setUser((prev) => prev ? {
        ...prev,
        hasConfiguredMacros: true,
        age: calculated.age,
        height: calculated.height,
        weight: calculated.weight,
        gender: calculated.gender,
        activity: calculated.activity,
        goal: calculated.goal,
        targetCalories: calculated.calories,
        protein: calculated.protein,
        fats: calculated.fats,
        carbs: calculated.carbs,
      } : prev);
    }

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

  const hasConfiguredMacros = Boolean(user && userMacros && userMacros.calories);
  const shouldShowOnboardingWizard = Boolean(user && !hasConfiguredMacros);

  return (
    <MacroContext.Provider
      value={{
        userMacros,
        saveMacros,
        modalOpen,
        openMacroCalculator,
        closeMacroCalculator,
        hasConfiguredMacros,
        macrosLoading,
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
