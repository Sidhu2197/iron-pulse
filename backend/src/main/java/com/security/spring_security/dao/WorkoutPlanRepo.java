package com.security.spring_security.dao;

import com.security.spring_security.Model.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface WorkoutPlanRepo extends JpaRepository<WorkoutPlan, Integer> {

    Optional<WorkoutPlan> findTopByUserIdOrderByIdDesc(int userId);

    @Transactional
    void deleteByUserId(int userId);
}
