package com.security.spring_security.Exceptions;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private String getServiceNameFromRequest(HttpServletRequest request) {
        if (request == null || request.getRequestURI() == null) {
            return "Server";
        }
        String uri = request.getRequestURI().toLowerCase();
        if (uri.contains("/meals") || uri.contains("/foods")) {
            return "Meal Service";
        } else if (uri.contains("/workouts")) {
            return "Workout Service";
        } else if (uri.contains("/calorie")) {
            return "Calorie AI Service";
        } else if (uri.contains("/recovery")) {
            return "Recovery AI Service";
        } else if (uri.contains("/auth") || uri.contains("/login") || uri.contains("/register") || uri.contains("/verify")) {
            return "Authentication Service";
        }
        return "Server";
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        response.put("success", false);
        response.put("message", "Validation failed");
        response.put("errors", errors);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        String message = ex.getMessage();
        if (message != null && (message.contains("account with this email") ||
                message.contains("User not found") ||
                message.contains("Incorrect") ||
                message.contains("already exists"))) {
            response.put("message", message);
        } else {
            String serviceName = getServiceNameFromRequest(request);
            response.put("message", "Could not connect to " + serviceName + ".");
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Throwable.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Throwable ex, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        String serviceName = getServiceNameFromRequest(request);
        response.put("message", "Could not connect to " + serviceName + ".");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
