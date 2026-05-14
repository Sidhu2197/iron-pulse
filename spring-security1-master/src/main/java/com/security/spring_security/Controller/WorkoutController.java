package com.security.spring_security.Controller;

import com.security.spring_security.Model.User;
import com.security.spring_security.Model.Workout;
import com.security.spring_security.Service.UserService;
import com.security.spring_security.Service.WorkoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    @Autowired
    private WorkoutService workoutService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> logWorkout(Authentication authentication,
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
            String workoutName = (String) body.get("workout_name");
            int duration = ((Number) body.get("duration")).intValue();
            int caloriesBurned = ((Number) body.get("calories_burned")).intValue();
            String date = body.containsKey("date") && body.get("date") != null && !((String) body.get("date")).isBlank()
                    ? (String) body.get("date")
                    : LocalDate.now().toString();

            workoutService.logWorkout(user.getId(), workoutName, duration, caloriesBurned, date);
            response.put("success", true);
            response.put("message", "Workout logged successfully!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to log workout: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getWorkouts(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
        }

        String email = authentication.getName();
        User user = userService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
        }

        List<Workout> workouts = workoutService.getWorkouts(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (Workout w : workouts) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", w.getId());
            map.put("workout_name", w.getWorkoutName());
            map.put("duration", w.getDuration());
            map.put("calories_burned", w.getCaloriesBurned());
            map.put("date", w.getDate());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
