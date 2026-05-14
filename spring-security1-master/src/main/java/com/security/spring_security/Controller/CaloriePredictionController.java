package com.security.spring_security.Controller;

import com.security.spring_security.Model.CaloriePrediction;
import com.security.spring_security.Model.User;
import com.security.spring_security.Service.CaloriePredictionService;
import com.security.spring_security.Service.UserService;
import com.security.spring_security.Service.MLPredictionService;
import com.security.spring_security.Exceptions.MLPredictionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/calorie-predictions")
public class CaloriePredictionController {

    @Autowired
    private CaloriePredictionService predictionService;

    @Autowired
    private UserService userService;

    @Autowired
    private MLPredictionService mlPredictionService;

    @PostMapping("/predict")
    public ResponseEntity<Map<String, Object>> predictCalories(@RequestBody Map<String, Object> input) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> prediction = mlPredictionService.predictCalories(input);
            
            response.put("success", true);
            response.put("data", prediction);
            return ResponseEntity.ok(response);
            
        } catch (MLPredictionException e) {
            response.put("success", false);
            response.put("errorType", e.getErrorType().toString());
            response.put("message", e.getErrorMessage());
            
            // Return appropriate HTTP status based on error type
            HttpStatus status = switch (e.getErrorType()) {
                case VALIDATION_ERROR -> HttpStatus.BAD_REQUEST;
                case ML_SERVICE_UNAVAILABLE, NETWORK_ERROR, TIMEOUT_ERROR -> HttpStatus.SERVICE_UNAVAILABLE;
                case ML_SERVICE_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
                default -> HttpStatus.INTERNAL_SERVER_ERROR;
            };
            
            return ResponseEntity.status(status).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("errorType", "UNKNOWN_ERROR");
            response.put("message", "Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean isHealthy = mlPredictionService.checkModelHealth();
            response.put("success", true);
            response.put("healthy", isHealthy);
            response.put("message", isHealthy ? "ML model is available" : "ML model is not responding");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("healthy", false);
            response.put("message", "Health check failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/exercises")
    public ResponseEntity<Map<String, Object>> getExercises() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> exercises = mlPredictionService.getSupportedExercises();
            response.put("success", true);
            response.put("data", exercises);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get exercises: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> savePrediction(Authentication authentication,
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
            String exerciseType = (String) body.get("exercise_type");
            int durationMin = ((Number) body.get("duration_min")).intValue();
            int intensity = ((Number) body.get("intensity")).intValue();
            int heartRate = ((Number) body.get("heart_rate")).intValue();
            double caloriesBurned = ((Number) body.get("calories_burned")).doubleValue();
            double caloriesPerMin = ((Number) body.get("calories_per_min")).doubleValue();
            double bmi = ((Number) body.get("bmi")).doubleValue();
            double metValue = ((Number) body.get("met_value")).doubleValue();
            String date = body.containsKey("date") && body.get("date") != null && !((String) body.get("date")).isBlank()
                    ? (String) body.get("date")
                    : LocalDate.now().toString();

            predictionService.savePrediction(user.getId(), exerciseType, durationMin,
                    intensity, heartRate, caloriesBurned, caloriesPerMin, bmi, metValue, date);

            response.put("success", true);
            response.put("message", "Prediction saved successfully!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to save prediction: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPredictions(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
        }

        String email = authentication.getName();
        User user = userService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
        }

        List<CaloriePrediction> predictions = predictionService.getPredictions(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (CaloriePrediction p : predictions) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("exercise_type", p.getExerciseType());
            map.put("duration_min", p.getDurationMin());
            map.put("intensity", p.getIntensity());
            map.put("heart_rate", p.getHeartRate());
            map.put("calories_burned", p.getCaloriesBurned());
            map.put("calories_per_min", p.getCaloriesPerMin());
            map.put("bmi", p.getBmi());
            map.put("met_value", p.getMetValue());
            map.put("date", p.getDate());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
