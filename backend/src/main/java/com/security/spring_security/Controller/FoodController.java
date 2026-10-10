package com.security.spring_security.Controller;

import com.security.spring_security.Model.Food;
import com.security.spring_security.Service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    @Autowired
    private FoodService foodService;

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> search(@RequestParam("q") String query) {
        List<Food> foods = foodService.searchFoods(query);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Food f : foods) {
            Map<String, Object> map = new HashMap<>();
            map.put("food_name", f.getFoodName());
            map.put("calories", f.getCalories());
            map.put("protein", f.getProtein());
            map.put("fats", f.getFats());
            map.put("serving", f.getServing());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
