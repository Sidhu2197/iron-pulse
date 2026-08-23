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

    @Autowired
    private com.security.spring_security.dao.UserRepo userRepo;

    public Map<String, Object> getTodaySummary(int userId, String dateParam) {
        String targetDate = (dateParam != null && !dateParam.isBlank()) ? dateParam : LocalDate.now().toString();
        List<Meal> todayMeals = repo.findByUserIdAndDate(userId, targetDate);

        // Fallback: If no meals found for client date, check server local date
        if (todayMeals.isEmpty() && !targetDate.equals(LocalDate.now().toString())) {
            todayMeals = repo.findByUserIdAndDate(userId, LocalDate.now().toString());
        }

        double totalCalories = todayMeals.stream().mapToDouble(Meal::getCalories).sum();
        double totalProtein = todayMeals.stream().mapToDouble(Meal::getProtein).sum();
        double totalFats = todayMeals.stream().mapToDouble(Meal::getFats).sum();

        com.security.spring_security.Model.User user = userRepo.findById(userId).orElse(null);
        int targetCal = user != null && user.getTargetCalories() > 0 ? user.getTargetCalories() : 2200;
        int targetPro = user != null && user.getTargetProtein() > 0 ? user.getTargetProtein() : 150;
        int targetFat = user != null && user.getTargetFats() > 0 ? user.getTargetFats() : 70;
        int targetCarb = user != null && user.getTargetCarbs() > 0 ? user.getTargetCarbs() : 240;

        Map<String, Object> summary = new HashMap<>();

        Map<String, Object> cal = new HashMap<>();
        cal.put("current", totalCalories);
        cal.put("target", targetCal);
        summary.put("calories", cal);

        Map<String, Object> pro = new HashMap<>();
        pro.put("current", totalProtein);
        pro.put("target", targetPro);
        summary.put("protein", pro);

        Map<String, Object> fat = new HashMap<>();
        fat.put("current", totalFats);
        fat.put("target", targetFat);
        summary.put("fats", fat);

        Map<String, Object> carb = new HashMap<>();
        carb.put("current", 0);
        carb.put("target", targetCarb);
        summary.put("carbs", carb);

        return summary;
    }

    public Map<String, Object> getTodaySummary(int userId) {
        return getTodaySummary(userId, null);
    }
}
