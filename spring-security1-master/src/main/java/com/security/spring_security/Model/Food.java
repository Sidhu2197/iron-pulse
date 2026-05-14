package com.security.spring_security.Model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "foods")
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String foodName;
    private double calories;
    private double protein;
    private double fats;
    private String serving;
}
