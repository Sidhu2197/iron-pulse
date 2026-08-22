package com.security.spring_security.Controller;

import com.security.spring_security.Model.Meal;
import com.security.spring_security.Model.User;
import com.security.spring_security.Model.UserCacheDTO;
import com.security.spring_security.Model.Workout;
import com.security.spring_security.Service.MealService;
import com.security.spring_security.Service.UserService;
import com.security.spring_security.Service.WorkoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private WorkoutService workoutService;

    @Autowired
    private MealService mealService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        if (authentication == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String email = authentication.getName();
        UserCacheDTO user = userService.findByEmail(email);
        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        List<Workout> workouts = workoutService.getWorkouts(user.getId());
        List<Meal> meals = mealService.getMeals(user.getId());

        int totalCaloriesBurned = workouts.stream().mapToInt(Workout::getCaloriesBurned).sum();
        int workoutCount = workouts.size();
        double totalCaloriesEaten = meals.stream().mapToDouble(Meal::getCalories).sum();

        response.put("total_calories_burned", totalCaloriesBurned);
        response.put("workout_count", workoutCount);
        response.put("total_calories_eaten", (int) totalCaloriesEaten);

        // Weekly chart data for last 7 calendar days
        java.time.LocalDate today = java.time.LocalDate.now();
        List<java.time.LocalDate> last7Days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            last7Days.add(today.minusDays(i));
        }

        Map<String, Integer> actualBurnedByDate = new HashMap<>();
        Map<String, Integer> workoutCountByDate = new HashMap<>();
        Map<String, Double> foodCaloriesByDate = new HashMap<>();

        for (Workout w : workouts) {
            String dateStr = w.getDate();
            if (dateStr == null || dateStr.isBlank()) {
                dateStr = today.toString();
            } else if (dateStr.length() >= 10) {
                dateStr = dateStr.substring(0, 10);
            }
            actualBurnedByDate.put(dateStr, actualBurnedByDate.getOrDefault(dateStr, 0) + w.getCaloriesBurned());
            workoutCountByDate.put(dateStr, workoutCountByDate.getOrDefault(dateStr, 0) + 1);
        }

        for (Meal m : meals) {
            String dateStr = m.getDate();
            if (dateStr == null || dateStr.isBlank()) {
                dateStr = today.toString();
            } else if (dateStr.length() >= 10) {
                dateStr = dateStr.substring(0, 10);
            }
            foodCaloriesByDate.put(dateStr, foodCaloriesByDate.getOrDefault(dateStr, 0.0) + m.getCalories());
        }

        List<Map<String, Object>> weeklyWorkouts = new ArrayList<>();
        for (java.time.LocalDate date : last7Days) {
            String dateStr = date.toString();
            String dayName = date.getDayOfWeek().getDisplayName(
                    java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("day", dayName);
            dayData.put("date", dateStr);
            dayData.put("Suggested", 500);
            dayData.put("Actual", actualBurnedByDate.getOrDefault(dateStr, 0));
            dayData.put("Eaten", (int) Math.round(foodCaloriesByDate.getOrDefault(dateStr, 0.0)));
            dayData.put("Workouts", workoutCountByDate.getOrDefault(dateStr, 0));

            weeklyWorkouts.add(dayData);
        }
        response.put("weekly_workouts", weeklyWorkouts);

        return ResponseEntity.ok(response);
    }
}
