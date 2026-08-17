package com.security.spring_security.Service;

import com.security.spring_security.Model.CaloriePrediction;
import com.security.spring_security.dao.CaloriePredictionRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CaloriePredictionService {

    @Autowired
    private CaloriePredictionRepo repo;

    public CaloriePrediction savePrediction(int userId, String exerciseType, int durationMin,
                                            int intensity, int heartRate, double caloriesBurned,
                                            double caloriesPerMin, double bmi, double metValue, String date) {
        CaloriePrediction p = new CaloriePrediction();
        p.setUserId(userId);
        p.setExerciseType(exerciseType);
        p.setDurationMin(durationMin);
        p.setIntensity(intensity);
        p.setHeartRate(heartRate);
        p.setCaloriesBurned(caloriesBurned);
        p.setCaloriesPerMin(caloriesPerMin);
        p.setBmi(bmi);
        p.setMetValue(metValue);
        p.setDate(date);
        return repo.save(p);
    }

    public List<CaloriePrediction> getPredictions(int userId) {
        return repo.findByUserIdOrderByDateDesc(userId);
    }
}
