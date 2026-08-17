package com.security.spring_security.Service;

import com.security.spring_security.Model.Food;
import com.security.spring_security.dao.FoodRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodService {

    @Autowired
    private FoodRepo repo;

    // Removed caching for food search due to high query variability and 30MB Redis limit
    public List<Food> searchFoods(String query) {
        return repo.findByFoodNameContainingIgnoreCase(query);
    }

    public Food createFood(Food food) {
        return repo.save(food);
    }

    public Food updateFood(Food food) {
        if (!repo.existsById(food.getId())) {
            throw new RuntimeException("Food not found with id: " + food.getId());
        }
        return repo.save(food);
    }

    public void deleteFood(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Food not found with id: " + id);
        }
        repo.deleteById(id);
    }
}
