package com.security.spring_security.Controller;

import com.security.spring_security.Model.Meal;
import com.security.spring_security.Model.User;
import com.security.spring_security.Service.MealService;
import com.security.spring_security.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/meals")
public class MealController {

    @Autowired
    private MealService mealService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> logMeal(Authentication authentication,
                                                        @RequestBody Map<String, Object> body) {
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

        try {
            String foodName = (String) body.get("food_name");
            double calories = ((Number) body.get("calories")).doubleValue();
            double protein = ((Number) body.get("protein")).doubleValue();
            double fats = ((Number) body.get("fats")).doubleValue();
            String date = body.containsKey("date") && body.get("date") != null && !((String) body.get("date")).isBlank()
                    ? (String) body.get("date")
                    : LocalDate.now().toString();

            mealService.logMeal(user.getId(), foodName, calories, protein, fats, date);
            response.put("success", true);
            response.put("message", "Meal logged successfully!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to log meal: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMeals(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
        }

        String email = authentication.getName();
        User user = userService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
        }

        List<Meal> meals = mealService.getMeals(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (Meal m : meals) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("food_name", m.getFoodName());
            map.put("calories", m.getCalories());
            map.put("protein", m.getProtein());
            map.put("fats", m.getFats());
            map.put("date", m.getDate());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyMap());
        }

        String email = authentication.getName();
        User user = userService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyMap());
        }

        Map<String, Object> summary = mealService.getTodaySummary(user.getId());
        return ResponseEntity.ok(summary);
    }
}
