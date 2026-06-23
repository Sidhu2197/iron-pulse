package com.security.spring_security.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;

import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

@Data
@Entity
@Table(name = "foods")
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
public class Food implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String foodName;
    private double calories;
    private double protein;
    private double fats;
    private String serving;
}
