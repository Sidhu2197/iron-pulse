package com.security.spring_security.Model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "workouts")
public class Workout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int userId;
    private String workoutName;
    private int duration;        // in minutes
    private int caloriesBurned;
    private String date;         // yyyy-MM-dd
}
