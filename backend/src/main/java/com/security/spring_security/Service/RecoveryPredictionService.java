package com.security.spring_security.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service for communicating with the Recovery Prediction ML model.
 * 
 * ML Model API: POST https://recovery-model.onrender.com/predict_recovery
 * Request:  { sleep_hours, resting_heart_rate, previous_workout_intensity, muscle_soreness, water_intake_liters }
 * Response: { recovery_score (as string), recovery_recommendations }
 */
@Service
public class RecoveryPredictionService {

    private static final Logger log = LoggerFactory.getLogger(RecoveryPredictionService.class);
    private static final String RECOVERY_API_URL = "https://recovery-model.onrender.com/predict_recovery";

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Calls the ML model and returns the recovery prediction.
     *
     * Frontend sends:  { sleep_hours, heart_rate, intensity, stress_level, water_intake }
     * Frontend expects: { recovery_score, recovery_recommendations }
     */
    @SuppressWarnings("unchecked")
    // @Cacheable(value = "recovery-predictions",
    //     key = "T(String).format('recovery_%s_%s_%s_%s_%s', " +
    //           "#input['sleep_hours'], #input['resting_heart_rate'], #input['previous_workout_intensity'], " +
    //           "#input['muscle_soreness'], #input['water_intake_liters'])", sync = true)
    public Map<String, Object> predictRecovery(Map<String, Object> input) {
        // Validate required fields
        validateInput(input);

        // Map frontend values → ML model values
        Map<String, Object> mlRequest = new HashMap<>();
        mlRequest.put("sleep_hours", ((Number) input.get("sleep_hours")).doubleValue());
        mlRequest.put("resting_heart_rate", ((Number) input.get("resting_heart_rate")).intValue());
        mlRequest.put("previous_workout_intensity", ((Number) input.get("previous_workout_intensity")).intValue());
        mlRequest.put("muscle_soreness", ((Number) input.get("muscle_soreness")).intValue());
        mlRequest.put("water_intake_liters", ((Number) input.get("water_intake_liters")).doubleValue());

        // Call the ML model
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(mlRequest, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    RECOVERY_API_URL, HttpMethod.POST, requestEntity, Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("API Response: {}", response.getBody());
                return transformResponse(response.getBody());
            }
            throw new RuntimeException("ML model returned invalid response with status: " + response.getStatusCode());

        } catch (HttpClientErrorException e) {
            throw new RuntimeException("ML model rejected input: " + e.getResponseBodyAsString());
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("ML model service error: " + e.getResponseBodyAsString());
        } catch (ResourceAccessException e) {
            throw new RuntimeException("Could not connect to recovery prediction service. Please try again later.");
        } catch (RuntimeException e) {
            throw e; // re-throw our own RuntimeExceptions
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error calling recovery prediction model: " + e.getMessage());
        }
    }

    /**
     * Transform ML response → frontend-expected format.
     *
     * ML returns:       { recovery_score, recovery_recommendations }
     * Frontend expects: { recovery_score, recovery_recommendations }
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> transformResponse(Map<String, Object> mlResponse) {
        Map<String, Object> result = new HashMap<>();
        
        // Handle different response formats from the API
        Object recoveryScoreObj = mlResponse.get("recovery_score");
        
        if (recoveryScoreObj == null) {
            // Try alternative field names
            recoveryScoreObj = mlResponse.get("score");
            if (recoveryScoreObj == null) {
                recoveryScoreObj = mlResponse.get("predicted_recovery_score");
            }
        }
        
        double score = 0.0;
        if (recoveryScoreObj != null) {
            try {
                if (recoveryScoreObj instanceof Number) {
                    score = ((Number) recoveryScoreObj).doubleValue();
                } else {
                    String recoveryScoreStr = recoveryScoreObj.toString();
                    score = Double.parseDouble(recoveryScoreStr);
                }
            } catch (NumberFormatException e) {
                score = 0.0;
            }
        }
        
        result.put("recovery_score", score);
        
        // Handle recommendations
        Object recommendations = mlResponse.get("recovery_recommendations");
        if (recommendations == null) {
            recommendations = mlResponse.get("recommendations");
        }
        result.put("recovery_recommendations", recommendations);

        return result;
    }

    private void validateInput(Map<String, Object> input) {
        String[] requiredFields = {"sleep_hours", "resting_heart_rate", "previous_workout_intensity", "muscle_soreness", "water_intake_liters"};
        for (String field : requiredFields) {
            if (!input.containsKey(field) || input.get(field) == null) {
                throw new IllegalArgumentException("Missing required field: " + field);
            }
        }

        double sleepHours = ((Number) input.get("sleep_hours")).doubleValue();
        if (sleepHours < 0 || sleepHours > 24) {
            throw new IllegalArgumentException("Sleep hours must be between 0 and 24");
        }

        int heartRate = ((Number) input.get("resting_heart_rate")).intValue();
        if (heartRate < 40 || heartRate > 220) {
            throw new IllegalArgumentException("Heart rate must be between 40 and 220");
        }

        int intensity = ((Number) input.get("previous_workout_intensity")).intValue();
        if (intensity < 1 || intensity > 10) {
            throw new IllegalArgumentException("Intensity must be between 1 and 10");
        }

        int stressLevel = ((Number) input.get("muscle_soreness")).intValue();
        if (stressLevel < 1 || stressLevel > 10) {
            throw new IllegalArgumentException("Stress level must be between 1 and 10");
        }

        double waterIntake = ((Number) input.get("water_intake_liters")).doubleValue();
        if (waterIntake < 0 || waterIntake > 20) {
            throw new IllegalArgumentException("Water intake must be between 0 and 20 liters");
        }
    }
}