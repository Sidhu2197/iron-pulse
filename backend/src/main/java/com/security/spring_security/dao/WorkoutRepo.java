package com.security.spring_security.dao;

import com.security.spring_security.Model.Workout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkoutRepo extends JpaRepository<Workout, Integer> {

    List<Workout> findByUserIdOrderByDateDesc(int userId);
}
