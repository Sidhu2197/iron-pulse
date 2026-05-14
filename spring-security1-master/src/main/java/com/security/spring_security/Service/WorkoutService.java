package com.security.spring_security.Service;

import com.security.spring_security.Model.Workout;
import com.security.spring_security.dao.WorkoutRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkoutService {

    @Autowired
    private WorkoutRepo repo;

    public Workout logWorkout(int userId, String workoutName, int duration, int caloriesBurned, String date) {
        Workout w = new Workout();
        w.setUserId(userId);
        w.setWorkoutName(workoutName);
        w.setDuration(duration);
        w.setCaloriesBurned(caloriesBurned);
        w.setDate(date);
        return repo.save(w);
    }

    public List<Workout> getWorkouts(int userId) {
        return repo.findByUserIdOrderByDateDesc(userId);
    }
}
