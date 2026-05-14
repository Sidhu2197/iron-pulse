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

    public List<Food> searchFoods(String query) {
        return repo.findByFoodNameContainingIgnoreCase(query);
    }
}
