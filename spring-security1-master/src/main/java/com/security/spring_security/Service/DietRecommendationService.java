package com.security.spring_security.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;

import java.util.*;

/**
 * Service for communicating with the Diet Recommendation ML model.
 * 
 * ML Model API: POST /recommend
 * Request:  { age, gender("Male"/"Female"), height, weight, goal("Muscle Gain"/"Weight Loss"), meal_type, diet_type }
 * Response: { recommendations: [{ food_name, protein, calories, carbs, fat }] }
 */
@Service
public class DietRecommendationService {

    @Value("${diet.ml.service.url:https://diet-recommendation-model.onrender.com}")
    private String mlServiceBaseUrl;

    private String recommendUrl;

    @Autowired
    private RestTemplate restTemplate;

    @PostConstruct
    public void init() {
        this.recommendUrl = mlServiceBaseUrl + "/recommend";
    }

    /**
     * Calls the ML model and returns the food plan in the format the frontend expects.
     *
     * Frontend sends:  { age, gender("male"/"female"), height, weight, goal("fat_loss"/"muscle_gain"), meal_type, diet_type }
     * Frontend expects: { items: [{ food_name, calories, protein, fats, serving }], total_calories, total_protein, total_fats }
     */
    @SuppressWarnings("unchecked")
    @Cacheable(value = "diet-recommendations",
        key = "T(String).format('diet_%s_%s_%s_%s_%s_%s_%s', " +
              "#input['age'], #input['gender'], #input['weight'], " +
              "#input['height'], #input['goal'], #input['meal_type'], #input['diet_type'])", sync = true)
    public Map<String, Object> generateFoodPlan(Map<String, Object> input) {
        // Validate required fields
        validateInput(input);

        // Map frontend values → ML model values
        Map<String, Object> mlRequest = new HashMap<>();
        mlRequest.put("age", ((Number) input.get("age")).intValue());
        mlRequest.put("height", ((Number) input.get("height")).doubleValue());
        mlRequest.put("weight", ((Number) input.get("weight")).doubleValue());
        mlRequest.put("meal_type", input.get("meal_type"));
        mlRequest.put("diet_type", input.get("diet_type"));

        // gender: "male" → "Male", "female" → "Female"
        String gender = (String) input.get("gender");
        mlRequest.put("gender", capitalizeFirst(gender));

        // goal: "fat_loss" → "Weight Loss", "muscle_gain" → "Muscle Gain"
        String goal = (String) input.get("goal");
        mlRequest.put("goal", mapGoal(goal));

        // Call the ML model
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(mlRequest, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    recommendUrl, HttpMethod.POST, requestEntity, Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return transformResponse(response.getBody());
            }
            throw new RuntimeException("ML model returned invalid response with status: " + response.getStatusCode());

        } catch (HttpClientErrorException e) {
            throw new RuntimeException("ML model rejected input: " + e.getResponseBodyAsString());
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("ML model service error: " + e.getResponseBodyAsString());
        } catch (ResourceAccessException e) {
            throw new RuntimeException("Could not connect to diet recommendation service. Please try again later.");
        } catch (RuntimeException e) {
            throw e; // re-throw our own RuntimeExceptions
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error calling diet recommendation model: " + e.getMessage());
        }
    }

    /**
     * Transform ML response → frontend-expected format.
     *
     * ML returns:       { recommendations: [{ food_name, protein, calories, carbs, fat }] }
     * Frontend expects: { items: [{ food_name, calories, protein, fats, serving }], total_calories, total_protein, total_fats }
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> transformResponse(Map<String, Object> mlResponse) {
        List<Map<String, Object>> recommendations = (List<Map<String, Object>>) mlResponse.get("recommendations");

        if (recommendations == null || recommendations.isEmpty()) {
            throw new RuntimeException("ML model returned no food recommendations.");
        }

        List<Map<String, Object>> items = new ArrayList<>();
        double totalCalories = 0;
        double totalProtein = 0;
        double totalFats = 0;

        for (Map<String, Object> rec : recommendations) {
            Map<String, Object> item = new HashMap<>();
            item.put("food_name", rec.get("food_name"));

            double calories = toDouble(rec.get("calories"));
            double protein = toDouble(rec.get("protein"));
            double fats = toDouble(rec.get("fat")); // ML returns "fat", frontend expects "fats"
            double carbs = toDouble(rec.get("carbs"));

            item.put("calories", Math.round(calories));
            item.put("protein", Math.round(protein));
            item.put("fats", Math.round(fats));
            item.put("carbs", Math.round(carbs));
            item.put("serving", "1 serving"); // ML doesn't return serving, provide default

            items.add(item);

            totalCalories += calories;
            totalProtein += protein;
            totalFats += fats;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("total_calories", Math.round(totalCalories));
        result.put("total_protein", Math.round(totalProtein));
        result.put("total_fats", Math.round(totalFats));

        return result;
    }

    private void validateInput(Map<String, Object> input) {
        String[] requiredFields = {"age", "gender", "height", "weight", "goal", "meal_type", "diet_type"};
        for (String field : requiredFields) {
            if (!input.containsKey(field) || input.get(field) == null) {
                throw new IllegalArgumentException("Missing required field: " + field);
            }
        }

        int age = ((Number) input.get("age")).intValue();
        if (age < 1 || age > 120) {
            throw new IllegalArgumentException("Age must be between 1 and 120");
        }

        String gender = (String) input.get("gender");
        if (!gender.equalsIgnoreCase("male") && !gender.equalsIgnoreCase("female")) {
            throw new IllegalArgumentException("Gender must be 'male' or 'female'");
        }

        String goal = (String) input.get("goal");
        if (!goal.equals("fat_loss") && !goal.equals("muscle_gain")) {
            throw new IllegalArgumentException("Goal must be 'fat_loss' or 'muscle_gain'");
        }

        String mealType = (String) input.get("meal_type");
        if (!mealType.equals("breakfast") && !mealType.equals("lunch") && !mealType.equals("dinner")) {
            throw new IllegalArgumentException("Meal type must be 'breakfast', 'lunch', or 'dinner'");
        }
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }

    private String mapGoal(String frontendGoal) {
        return switch (frontendGoal) {
            case "fat_loss" -> "Weight Loss";
            case "muscle_gain" -> "Muscle Gain";
            default -> frontendGoal;
        };
    }

    private double toDouble(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }
}
