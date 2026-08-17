package com.security.spring_security.dao;

import com.security.spring_security.Model.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepo extends JpaRepository<Food, Integer> {

    List<Food> findByFoodNameContainingIgnoreCase(String query);
}
