package com.security.spring_security.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.security.spring_security.Model.WorkoutPlan;
import com.security.spring_security.dao.WorkoutPlanRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class WorkoutPlanService {

    private static final String ML_SERVICE_URL = "https://v0-v0educationalaiplatformmain.vercel.app";

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private WorkoutPlanRepo workoutPlanRepo;

    @Autowired
    private ObjectMapper objectMapper;

    // Return the first non-null value found for any of the given keys (frontend sends
    // both raw wizard keys like "height" and pre-mapped keys like "height_cm")
    private Object firstValue(Map<String, Object> profile, String... keys) {
        for (String key : keys) {
            if (profile.containsKey(key) && profile.get(key) != null) {
                return profile.get(key);
            }
        }
        return null;
    }

    public Map<String, Object> generateWorkoutPlan(Map<String, Object> userProfile) {
        String url = ML_SERVICE_URL + "/generate-workout-plan";

        Map<String, Object> apiRequest = new HashMap<>();

        // Required fields from API documentation
        Object age = firstValue(userProfile, "age");
        Object height = firstValue(userProfile, "height", "height_cm");
        Object weight = firstValue(userProfile, "weight", "weight_kg");
        Object duration = firstValue(userProfile, "duration", "workout_duration_minutes");
        Object daysPerWeek = firstValue(userProfile, "workout_days_per_week", "days_per_week");

        // Derive days per week from the selected workout_days list when the count is absent
        if (daysPerWeek == null && userProfile.get("workout_days") instanceof java.util.List) {
            daysPerWeek = ((java.util.List<?>) userProfile.get("workout_days")).size();
        }

        apiRequest.put("age", age != null ? ((Number) age).intValue() : 25);
        apiRequest.put("gender", firstValue(userProfile, "gender") != null ? firstValue(userProfile, "gender") : "Male");
        apiRequest.put("height_cm", height != null ? ((Number) height).doubleValue() : 175);
        apiRequest.put("weight_kg", weight != null ? ((Number) weight).doubleValue() : 70);

        // Calculate BMI from height and weight (real values or defaults)
        double heightCm = height != null ? ((Number) height).doubleValue() : 175;
        double weightKg = weight != null ? ((Number) weight).doubleValue() : 70;
        double heightM = heightCm / 100;
        double bmi = weightKg / (heightM * heightM);
        apiRequest.put("bmi", Math.round(bmi * 10.0) / 10.0);

        Object bodyFat = firstValue(userProfile, "body_fat_pct");
        apiRequest.put("body_fat_pct", bodyFat != null ? ((Number) bodyFat).doubleValue() : 0);
        apiRequest.put("fitness_level", firstValue(userProfile, "fitness_level") != null ? firstValue(userProfile, "fitness_level") : "Beginner");
        apiRequest.put("goal", firstValue(userProfile, "goal") != null ? firstValue(userProfile, "goal") : "General Fitness");
        
        // Handle medical conditions as array
        if (userProfile.containsKey("medical_conditions")) {
            Object conditions = userProfile.get("medical_conditions");
            if (conditions instanceof java.util.List) {
                apiRequest.put("medical_conditions", conditions);
            } else {
                apiRequest.put("medical_conditions", Collections.singletonList(conditions != null ? conditions : "None"));
            }
        } else {
            apiRequest.put("medical_conditions", Collections.singletonList("None"));
        }
        
        apiRequest.put("workout_location", firstValue(userProfile, "workout_location") != null ? firstValue(userProfile, "workout_location") : "Gym");

        // Handle equipment as array (accept both "equipment" and "available_equipment")
        Object equipment = firstValue(userProfile, "equipment", "available_equipment");
        if (equipment instanceof java.util.List) {
            apiRequest.put("available_equipment", equipment);
        } else if (equipment != null) {
            apiRequest.put("available_equipment", Collections.singletonList(equipment));
        } else {
            apiRequest.put("available_equipment", Collections.singletonList("None"));
        }

        apiRequest.put("workout_days_per_week", daysPerWeek != null ? ((Number) daysPerWeek).intValue() : 4);
        
        // Handle workout days as array
        if (userProfile.containsKey("workout_days")) {
            Object days = userProfile.get("workout_days");
            if (days instanceof java.util.List) {
                apiRequest.put("workout_days", days);
            } else {
                apiRequest.put("workout_days", java.util.Collections.emptyList());
            }
        } else {
            apiRequest.put("workout_days", java.util.Collections.emptyList());
        }
        
        apiRequest.put("workout_duration_minutes", duration != null ? ((Number) duration).intValue() : 45);
        apiRequest.put("preferred_style", firstValue(userProfile, "preferred_style") != null ? firstValue(userProfile, "preferred_style") : "Mixed");
        
        // Handle target muscle groups as array
        if (userProfile.containsKey("target_muscle_groups")) {
            Object groups = userProfile.get("target_muscle_groups");
            if (groups instanceof java.util.List) {
                apiRequest.put("target_muscle_groups", groups);
            } else {
                apiRequest.put("target_muscle_groups", java.util.Collections.emptyList());
            }
        } else {
            apiRequest.put("target_muscle_groups", java.util.Collections.emptyList());
        }
        
        Object sleepHours = firstValue(userProfile, "sleep_hours");
        apiRequest.put("sleep_hours", sleepHours != null ? ((Number) sleepHours).doubleValue() : 7);
        apiRequest.put("daily_activity_level", firstValue(userProfile, "daily_activity_level") != null ? firstValue(userProfile, "daily_activity_level") : "Moderate");
        Object experience = firstValue(userProfile, "experience", "fitness_level");
        apiRequest.put("experience", experience != null ? experience : "Beginner");
        apiRequest.put("previous_injuries", firstValue(userProfile, "previous_injuries") != null ? firstValue(userProfile, "previous_injuries") : "None");
        Object heartRate = firstValue(userProfile, "heart_rate");
        apiRequest.put("heart_rate", heartRate != null ? ((Number) heartRate).intValue() : 0);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(apiRequest, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Workout plan service returned an empty response");
            }
            return body;

        } catch (HttpClientErrorException e) {
            throw new RuntimeException("ML service validation error: " + e.getResponseBodyAsString());
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Workout plan service is currently unavailable. Please try again later.");
        } catch (ResourceAccessException e) {
            throw new RuntimeException("Could not connect to workout plan service. Please check your connection and try again.");
        }
    }

    @Transactional
    public Map<String, Object> generateAndSaveWorkoutPlan(int userId, Map<String, Object> userProfile) {
        Map<String, Object> planData = generateWorkoutPlan(userProfile);

        try {
            // Delete previous workout plan for this user if exists (single active plan rule)
            workoutPlanRepo.deleteByUserId(userId);

            WorkoutPlan plan = new WorkoutPlan();
            plan.setUserId(userId);
            plan.setGoal(firstValue(userProfile, "goal") != null ? firstValue(userProfile, "goal").toString() : "General Fitness");
            plan.setFitnessLevel(firstValue(userProfile, "fitness_level", "fitnessLevel") != null ? firstValue(userProfile, "fitness_level", "fitnessLevel").toString() : "Beginner");

            Object days = firstValue(userProfile, "workout_days_per_week", "days_per_week");
            if (days == null && userProfile.get("workout_days") instanceof java.util.List) {
                days = ((java.util.List<?>) userProfile.get("workout_days")).size();
            }
            plan.setDaysPerWeek(days != null ? ((Number) days).intValue() : 4);

            Object duration = firstValue(userProfile, "duration", "workout_duration_minutes");
            plan.setDurationMinutes(duration != null ? ((Number) duration).intValue() : 45);

            plan.setPlanJson(objectMapper.writeValueAsString(planData));
            LocalDateTime now = LocalDateTime.now();
            plan.setCreatedAt(now);
            plan.setExpiresAt(now.plusDays(7)); // 7-day expiration policy

            workoutPlanRepo.save(plan);
        } catch (Exception e) {
            System.err.println("Failed to persist workout plan for user " + userId + ": " + e.getMessage());
        }

        return planData;
    }

    @Transactional
    public Map<String, Object> getLatestWorkoutPlan(int userId) {
        Optional<WorkoutPlan> optPlan = workoutPlanRepo.findTopByUserIdOrderByIdDesc(userId);
        if (optPlan.isEmpty()) {
            return null;
        }

        WorkoutPlan plan = optPlan.get();
        LocalDateTime now = LocalDateTime.now();

        // 7-day expiration check: delete if expired
        if (plan.getExpiresAt() != null && now.isAfter(plan.getExpiresAt())) {
            workoutPlanRepo.delete(plan);
            return null;
        }

        try {
            if (plan.getPlanJson() != null && !plan.getPlanJson().isBlank()) {
                return objectMapper.readValue(plan.getPlanJson(), new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception e) {
            System.err.println("Failed to deserialize workout plan JSON: " + e.getMessage());
        }

        return null;
    }
}
