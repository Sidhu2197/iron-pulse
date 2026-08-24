package com.security.spring_security.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "workout_plans")
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private int userId;

    private String goal;
    private String fitnessLevel;
    private int daysPerWeek;
    private int durationMinutes;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String planJson;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
