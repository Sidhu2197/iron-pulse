package com.security.spring_security.Controller;

import com.security.spring_security.Model.Meal;
import com.security.spring_security.Model.User;
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
        User user = userService.findByEmail(email);
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

        // Weekly workout data for chart (last 7 days by day name)
        List<Map<String, Object>> weeklyWorkouts = new ArrayList<>();
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};

        // Aggregate actual workout calories by day of week
        Map<String, Integer> actualByDay = new HashMap<>();
        for (String day : days) actualByDay.put(day, 0);

        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate weekAgo = today.minusDays(6);

        for (Workout w : workouts) {
            try {
                java.time.LocalDate wDate = java.time.LocalDate.parse(w.getDate());
                if (!wDate.isBefore(weekAgo) && !wDate.isAfter(today)) {
                    String dayName = wDate.getDayOfWeek().getDisplayName(
                            java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
                    // Normalize to 3-char abbreviation (Mon, Tue, ...)
                    dayName = dayName.substring(0, 3);
                    actualByDay.put(dayName, actualByDay.getOrDefault(dayName, 0) + w.getCaloriesBurned());
                }
            } catch (Exception ignored) {
                // Skip workouts with invalid date format
            }
        }

        for (String day : days) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("day", day);
            dayData.put("Suggested", 0);
            dayData.put("Actual", actualByDay.getOrDefault(day, 0));
            weeklyWorkouts.add(dayData);
        }
        response.put("weekly_workouts", weeklyWorkouts);

        return ResponseEntity.ok(response);
    }
}
