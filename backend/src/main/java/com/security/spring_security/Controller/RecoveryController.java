package com.security.spring_security.Controller;

import com.security.spring_security.Service.RecoveryPredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/recovery")
public class RecoveryController {

    @Autowired
    private RecoveryPredictionService recoveryPredictionService;

    @PostMapping("/predict")
    public ResponseEntity<Map<String, Object>> predictRecovery(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Map frontend field names to match API expectations
            Map<String, Object> serviceRequest = new HashMap<>();
            serviceRequest.put("sleep_hours", body.get("sleep_hours"));
            serviceRequest.put("resting_heart_rate", body.get("resting_heart_rate"));
            serviceRequest.put("previous_workout_intensity", body.get("previous_workout_intensity"));
            serviceRequest.put("muscle_soreness", body.get("muscle_soreness"));
            serviceRequest.put("water_intake_liters", body.get("water_intake_liters"));
            
            Map<String, Object> recoveryPrediction = recoveryPredictionService.predictRecovery(serviceRequest);
            response.put("success", true);
            response.put("data", recoveryPrediction);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", "Invalid input: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}