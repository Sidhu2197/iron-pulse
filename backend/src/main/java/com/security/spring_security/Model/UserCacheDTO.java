package com.security.spring_security.Model;

import java.io.Serializable;

/**
 * Lightweight DTO for Redis caching.
 * Excludes sensitive fields (password)
 * that should never be stored in an external cache.
 */
public class UserCacheDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private int id;
    private String username;
    private String email;
    private int age;
    private double height;
    private double weight;
    private String gender;
    private String activity;
    private String goal;
    private Integer targetCalories;
    private Integer targetProtein;
    private Integer targetFats;
    private Integer targetCarbs;
    private boolean hasConfiguredMacros;

    public UserCacheDTO() {
    }

    public UserCacheDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.age = user.getAge();
        this.height = user.getHeight();
        this.weight = user.getWeight();
        this.gender = user.getGender();
        this.activity = user.getActivity();
        this.goal = user.getGoal();
        this.targetCalories = user.getTargetCalories();
        this.targetProtein = user.getTargetProtein();
        this.targetFats = user.getTargetFats();
        this.targetCarbs = user.getTargetCarbs();
        this.hasConfiguredMacros = user.isHasConfiguredMacros();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public double getHeight() {
        return height;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public int getTargetCalories() {
        return targetCalories;
    }

    public void setTargetCalories(int targetCalories) {
        this.targetCalories = targetCalories;
    }

    public int getTargetProtein() {
        return targetProtein;
    }

    public void setTargetProtein(int targetProtein) {
        this.targetProtein = targetProtein;
    }

    public int getTargetFats() {
        return targetFats;
    }

    public void setTargetFats(int targetFats) {
        this.targetFats = targetFats;
    }

    public int getTargetCarbs() {
        return targetCarbs;
    }

    public void setTargetCarbs(int targetCarbs) {
        this.targetCarbs = targetCarbs;
    }

    public boolean isHasConfiguredMacros() {
        return hasConfiguredMacros;
    }

    public void setHasConfiguredMacros(boolean hasConfiguredMacros) {
        this.hasConfiguredMacros = hasConfiguredMacros;
    }
}
