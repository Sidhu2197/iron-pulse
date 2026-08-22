package com.security.spring_security.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import lombok.Data;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

@Data
@Table(name = "users")
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", 
             message = "Email is invalid")
    @Column(unique = true)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
    
    @Column(nullable = false)
    private int age;
    
    private double height;   // in cm
    private double weight;   // in kg
    
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isVerified = false;
    
    private String verificationToken;
    
    @Column(nullable = false, columnDefinition = "int default 0")
    private int failedLoginAttempts = 0;
    
    private java.time.LocalDateTime lockoutTime;

    // Macro target preferences persisted in DB (no defaults — set via user wizard)
    private String gender;
    private String activity;
    private String goal;
    private Integer targetCalories;
    private Integer targetProtein;
    private Integer targetFats;
    private Integer targetCarbs;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean hasConfiguredMacros = false;

}