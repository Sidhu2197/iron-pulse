package com.security.spring_security.Model;
import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
@Data
public class UpdateProfileRequest {
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    @Min(value = 0, message = "Age must be positive")
    private Integer age;
    @Min(value = 0, message = "Height must be positive")
    private Double height;
    @Min(value = 0, message = "Weight must be positive")
    private Double weight;
}