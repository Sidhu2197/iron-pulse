package com.security.spring_security.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.security.spring_security.Exceptions.MLPredictionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

import jakarta.annotation.PostConstruct;

/**
 * Service for handling ML model predictions and communication with external ML service.
 * 
 * <p>This service provides integration with the calorie prediction ML model, including:
 * <ul>
 *   <li>Prediction requests with input validation</li>
 *   <li>Health check monitoring</li>
 *   <li>Dynamic exercise type synchronization</li>
 *   <li>Result caching for performance optimization</li>
 * </ul>
 * 
 * @author System
 * @version 1.0
 * @since 2024
 */
@Service
public class MLPredictionService {

    @Value("${ml.service.url}")
    private String mlServiceBaseUrl;

    @Value("${ml.service.timeout.connect:5000}")
    private int connectTimeout;

    @Value("${ml.service.timeout.read:10000}")
    private int readTimeout;

    private String mlModelUrl;
    private String mlHealthUrl;
    private String mlExercisesUrl;
    
    private final List<String> VALID_EXERCISES = new ArrayList<>(Arrays.asList(
        "Cycling", "Elliptical", "HIIT", "Jump Rope", "Rowing", 
        "Running", "Swimming", "Walking", "Weight Training", "Yoga"
    ));

    @Value("${ml.service.cache.ttl:300}")
    private long cacheTtlSeconds;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private SimpleCacheService cacheService;

    private final ObjectMapper objectMapper;

    public MLPredictionService() {
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        this.mlModelUrl = mlServiceBaseUrl + "/predict";
        this.mlHealthUrl = mlServiceBaseUrl + "/health";
        this.mlExercisesUrl = mlServiceBaseUrl + "/exercises";
        
        // Initialize with default exercises, will be updated dynamically
        updateExerciseList();
    }

    private void updateExerciseList() {
        try {
            Map<String, Object> exercisesData = getSupportedExercises();
            if (exercisesData != null && exercisesData.containsKey("exercises")) {
                @SuppressWarnings("unchecked")
                List<String> dynamicExercises = (List<String>) exercisesData.get("exercises");
                if (dynamicExercises != null && !dynamicExercises.isEmpty()) {
                    VALID_EXERCISES.clear();
                    VALID_EXERCISES.addAll(dynamicExercises);
                }
            }
        } catch (Exception e) {
            // Keep default exercises if dynamic update fails
            System.err.println("Failed to update exercise list from ML model: " + e.getMessage());
        }
    }

    /**
     * Predicts calories burned based on input parameters.
     * 
     * <p>This method validates input, checks cache, and calls the external ML model.
     * Results are cached for improved performance.
     * 
     * @param input Map containing required prediction parameters:
     *              age (int), gender (int: 0=Female, 1=Male), weight_kg (double),
     *              height_cm (double), body_fat_pct (double), exercise_type (String),
     *              duration_min (int), intensity (int: 1=Low, 2=Medium, 3=High),
     *              heart_rate (int)
     * @return Map containing prediction results including calories_burned, calories_per_min, bmi, etc.
     * @throws MLPredictionException if validation fails, ML service is unavailable, or other errors occur
     */
    public Map<String, Object> predictCalories(Map<String, Object> input) throws MLPredictionException {
        try {
            // Check cache first
            String cacheKey = cacheService.generatePredictionKey(input);
            Object cachedResult = cacheService.get(cacheKey);
            if (cachedResult != null) {
                return (Map<String, Object>) cachedResult;
            }

            // Validate input parameters according to API spec
            validateInput(input);

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Create request entity with exact format expected by API
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(input, headers);

            // Call ML model with improved error handling
            ResponseEntity<Map> response = restTemplate.exchange(
                mlModelUrl,
                HttpMethod.POST,
                requestEntity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                
                // Cache the result
                cacheService.put(cacheKey, result, cacheTtlSeconds, TimeUnit.SECONDS);
                
                return result;
            } else {
                throw new MLPredictionException(
                    MLPredictionException.ErrorType.ML_SERVICE_ERROR,
                    "ML model returned invalid response with status: " + response.getStatusCode()
                );
            }

        } catch (IllegalArgumentException e) {
            throw new MLPredictionException(
                MLPredictionException.ErrorType.VALIDATION_ERROR,
                "Invalid input: " + e.getMessage(),
                e
            );
        } catch (HttpClientErrorException e) {
            throw new MLPredictionException(
                MLPredictionException.ErrorType.VALIDATION_ERROR,
                "ML service rejected input: " + e.getResponseBodyAsString(),
                e
            );
        } catch (HttpServerErrorException e) {
            throw new MLPredictionException(
                MLPredictionException.ErrorType.ML_SERVICE_ERROR,
                "ML service error: " + e.getResponseBodyAsString(),
                e
            );
        } catch (ResourceAccessException e) {
            throw new MLPredictionException(
                MLPredictionException.ErrorType.NETWORK_ERROR,
                "Network connectivity issue: " + e.getMessage(),
                e
            );
        } catch (MLPredictionException e) {
            throw e;
        } catch (Exception e) {
            throw new MLPredictionException(
                MLPredictionException.ErrorType.UNKNOWN_ERROR,
                "Unexpected error during ML prediction: " + e.getMessage(),
                e
            );
        }
    }

    private void validateInput(Map<String, Object> input) {
        // Check all required fields according to API spec
        String[] requiredFields = {"age", "gender", "weight_kg", "height_cm", "body_fat_pct", "exercise_type", "duration_min", "intensity", "heart_rate"};
        
        for (String field : requiredFields) {
            if (!input.containsKey(field) || input.get(field) == null) {
                throw new IllegalArgumentException("Missing required field: " + field);
            }
        }

        // Validate field types and ranges according to API spec
        try {
            // Age - integer
            int age = ((Number) input.get("age")).intValue();
            if (age < 1 || age > 120) {
                throw new IllegalArgumentException("Age must be between 1 and 120");
            }

            // Gender - integer (0=Female, 1=Male)
            int gender = ((Number) input.get("gender")).intValue();
            if (gender != 0 && gender != 1) {
                throw new IllegalArgumentException("Gender must be 0 (Female) or 1 (Male)");
            }

            // Weight - number
            double weight = ((Number) input.get("weight_kg")).doubleValue();
            if (weight < 20 || weight > 300) {
                throw new IllegalArgumentException("Weight must be between 20 and 300 kg");
            }

            // Height - number
            double height = ((Number) input.get("height_cm")).doubleValue();
            if (height < 50 || height > 250) {
                throw new IllegalArgumentException("Height must be between 50 and 250 cm");
            }

            // Body Fat % - number
            double bodyFat = ((Number) input.get("body_fat_pct")).doubleValue();
            if (bodyFat < 1 || bodyFat > 60) {
                throw new IllegalArgumentException("Body fat percentage must be between 1 and 60");
            }

            // Duration - integer
            int duration = ((Number) input.get("duration_min")).intValue();
            if (duration < 1 || duration > 480) {
                throw new IllegalArgumentException("Duration must be between 1 and 480 minutes");
            }

            // Intensity - integer
            int intensity = ((Number) input.get("intensity")).intValue();
            if (intensity < 1 || intensity > 3) {
                throw new IllegalArgumentException("Intensity must be 1 (Low), 2 (Medium), or 3 (High)");
            }

            // Heart Rate - integer
            int heartRate = ((Number) input.get("heart_rate")).intValue();
            if (heartRate < 40 || heartRate > 220) {
                throw new IllegalArgumentException("Heart rate must be between 40 and 220 BPM");
            }

        } catch (ClassCastException e) {
            throw new IllegalArgumentException("Invalid numeric format in input parameters");
        }

        // Validate exercise type against API's supported exercises
        String exerciseType = (String) input.get("exercise_type");
        if (!VALID_EXERCISES.contains(exerciseType)) {
            throw new IllegalArgumentException("Invalid exercise type: " + exerciseType + 
                ". Valid types are: " + String.join(", ", VALID_EXERCISES));
        }
    }

    /**
     * Checks if the ML model service is healthy and responsive.
     * 
     * @return true if the ML service responds successfully, false otherwise
     */
    public boolean checkModelHealth() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(mlHealthUrl, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Retrieves the list of supported exercises from the ML model.
     * 
     * @return Map containing exercise list and MET values from the ML service
     * @throws RuntimeException if unable to retrieve exercises from ML service
     */
    public Map<String, Object> getSupportedExercises() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(mlExercisesUrl, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }
            throw new RuntimeException("Failed to get exercises from ML model");
        } catch (Exception e) {
            throw new RuntimeException("Failed to get supported exercises: " + e.getMessage(), e);
        }
    }
}
