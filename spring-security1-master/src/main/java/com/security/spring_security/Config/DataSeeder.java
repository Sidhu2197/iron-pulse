package com.security.spring_security.Config;

import com.security.spring_security.Model.Food;
import com.security.spring_security.dao.FoodRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private FoodRepo foodRepo;

    @Override
    public void run(String... args) {
        if (foodRepo.count() == 0) {
            foodRepo.saveAll(List.of(
                createFood("Chicken Breast", 165, 31, 3.6, "100g"),
                createFood("Brown Rice", 216, 5, 1.8, "1 cup cooked"),
                createFood("Banana", 105, 1.3, 0.4, "1 medium"),
                createFood("Eggs (2 whole)", 143, 12.6, 9.5, "2 eggs"),
                createFood("Greek Yogurt", 100, 17, 0.7, "170g"),
                createFood("Oatmeal", 154, 5.3, 2.6, "1 cup cooked"),
                createFood("Salmon Fillet", 208, 20, 13, "100g"),
                createFood("Sweet Potato", 103, 2.3, 0.1, "1 medium"),
                createFood("Almonds", 164, 6, 14, "28g"),
                createFood("Avocado", 240, 3, 22, "1 whole"),
                createFood("Paneer Tikka", 260, 18, 20, "100g"),
                createFood("Dal Tadka", 150, 9, 5, "1 bowl"),
                createFood("Chapati", 120, 3.5, 3.7, "1 piece"),
                createFood("Chicken Biryani", 350, 15, 12, "1 plate"),
                createFood("Protein Shake", 180, 30, 3, "1 scoop + milk")
            ));
            System.out.println("✅ Seeded 15 foods into the database.");
        }
    }

    private Food createFood(String name, double calories, double protein, double fats, String serving) {
        Food f = new Food();
        f.setFoodName(name);
        f.setCalories(calories);
        f.setProtein(protein);
        f.setFats(fats);
        f.setServing(serving);
        return f;
    }
}
