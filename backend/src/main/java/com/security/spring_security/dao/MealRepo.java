package com.security.spring_security.dao;

import com.security.spring_security.Model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealRepo extends JpaRepository<Meal, Integer> {

    List<Meal> findByUserIdOrderByDateDesc(int userId);

    List<Meal> findByUserIdAndDate(int userId, String date);
}
