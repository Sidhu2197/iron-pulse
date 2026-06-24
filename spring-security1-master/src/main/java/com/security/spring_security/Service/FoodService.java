package com.security.spring_security.Service;

import com.security.spring_security.Model.Food;
import com.security.spring_security.dao.FoodRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodService {

    @Autowired
    private FoodRepo repo;

    @Cacheable(value = "foods", key = "#query.toLowerCase()")
    public List<Food> searchFoods(String query) {
        return repo.findByFoodNameContainingIgnoreCase(query);
    }

    @CacheEvict(value = "foods", allEntries = true)
    public Food createFood(Food food) {
        return repo.save(food);
    }

    @CacheEvict(value = "foods", allEntries = true)
    public Food updateFood(Food food) {
        if (!repo.existsById(food.getId())) {
            throw new RuntimeException("Food not found with id: " + food.getId());
        }
        return repo.save(food);
    }

    @CacheEvict(value = "foods", allEntries = true)
    public void deleteFood(int id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("Food not found with id: " + id);
        }
        repo.deleteById(id);
    }
}
