package com.security.spring_security.Model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "calorie_predictions")
public class CaloriePrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int userId;
    private String exerciseType;
    private int durationMin;
    private int intensity;       // 1=Low, 2=Medium, 3=High
    private int heartRate;
    private double caloriesBurned;
    private double caloriesPerMin;
    private double bmi;
    private double metValue;
    private String date;         // yyyy-MM-dd
}
