package com.security.spring_security.Model;
import lombok.Data;
import jakarta.validation.constraints.Min;
@Data
public class UpdateMacrosRequest {
    private String gender;
    private String activity;
    private String goal;
    @Min(value = 0, message = "Age must be positive")
    private Integer age;
    @Min(value = 0, message = "Height must be positive")
    private Double height;
    @Min(value = 0, message = "Weight must be positive")
    private Double weight;
    @Min(value = 0, message = "Calories must be positive")
    private Integer calories;
    @Min(value = 0, message = "Protein must be positive")
    private Integer protein;
    @Min(value = 0, message = "Fats must be positive")
    private Integer fats;
    @Min(value = 0, message = "Carbs must be positive")
    private Integer carbs;
}