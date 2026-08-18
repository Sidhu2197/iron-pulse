package com.security.spring_security.Controller;

import com.security.spring_security.Service.DietRecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/food-plan")
public class FoodPlanController {

    @Autowired
    private DietRecommendationService dietRecommendationService;

    /**
     * POST /api/food-plan/generate
     * 
     * Receives user parameters from the frontend wizard and forwards them to
     * the Diet Recommendation ML model, transforming the request/response as needed.
     *
     * Request body: { age, gender, height, weight, goal, meal_type, diet_type }
     * Response:     { items: [...], total_calories, total_protein, total_fats }
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateFoodPlan(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> foodPlan = dietRecommendationService.generateFoodPlan(request);
            return ResponseEntity.ok(foodPlan);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }
    }
}
