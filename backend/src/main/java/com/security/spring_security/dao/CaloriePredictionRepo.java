package com.security.spring_security.dao;

import com.security.spring_security.Model.CaloriePrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaloriePredictionRepo extends JpaRepository<CaloriePrediction, Integer> {
    List<CaloriePrediction> findByUserIdOrderByDateDesc(int userId);
}
