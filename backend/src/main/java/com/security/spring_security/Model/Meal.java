package com.security.spring_security.Model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "meals")
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int userId;
    private String foodName;
    private double calories;
    private double protein;
    private double fats;
    private String date;    // yyyy-MM-dd
}
