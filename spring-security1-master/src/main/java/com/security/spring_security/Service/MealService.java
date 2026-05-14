package com.security.spring_security.Service;

import com.security.spring_security.Model.Meal;
import com.security.spring_security.dao.MealRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MealService {

    @Autowired
    private MealRepo repo;

    public Meal logMeal(int userId, String foodName, double calories, double protein, double fats, String date) {
        Meal m = new Meal();
        m.setUserId(userId);
        m.setFoodName(foodName);
        m.setCalories(calories);
        m.setProtein(protein);
        m.setFats(fats);
        m.setDate(date != null && !date.isBlank() ? date : LocalDate.now().toString());
        return repo.save(m);
    }

    public List<Meal> getMeals(int userId) {
        return repo.findByUserIdOrderByDateDesc(userId);
    }

    public Map<String, Object> getTodaySummary(int userId) {
        String today = LocalDate.now().toString();
        List<Meal> todayMeals = repo.findByUserIdAndDate(userId, today);

        double totalCalories = todayMeals.stream().mapToDouble(Meal::getCalories).sum();
        double totalProtein = todayMeals.stream().mapToDouble(Meal::getProtein).sum();
        double totalFats = todayMeals.stream().mapToDouble(Meal::getFats).sum();

        Map<String, Object> summary = new HashMap<>();

        Map<String, Object> cal = new HashMap<>();
        cal.put("current", totalCalories);
        cal.put("target", 2200);
        summary.put("calories", cal);

        Map<String, Object> pro = new HashMap<>();
        pro.put("current", totalProtein);
        pro.put("target", 150);
        summary.put("protein", pro);

        Map<String, Object> fat = new HashMap<>();
        fat.put("current", totalFats);
        fat.put("target", 70);
        summary.put("fats", fat);

        return summary;
    }
}
