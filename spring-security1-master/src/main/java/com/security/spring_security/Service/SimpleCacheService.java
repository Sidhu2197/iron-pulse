package com.security.spring_security.Service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class SimpleCacheService {
    
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();
    
    private static class CacheEntry {
        private final Object value;
        private final long timestamp;
        private final long ttlMillis;
        
        public CacheEntry(Object value, long ttlMillis) {
            this.value = value;
            this.timestamp = System.currentTimeMillis();
            this.ttlMillis = ttlMillis;
        }
        
        public boolean isExpired() {
            return System.currentTimeMillis() - timestamp > ttlMillis;
        }
        
        public Object getValue() {
            return value;
        }
    }
    
    public void put(String key, Object value, long ttl, TimeUnit timeUnit) {
        long ttlMillis = timeUnit.toMillis(ttl);
        cache.put(key, new CacheEntry(value, ttlMillis));
    }
    
    public Object get(String key) {
        CacheEntry entry = cache.get(key);
        if (entry == null || entry.isExpired()) {
            cache.remove(key);
            return null;
        }
        return entry.getValue();
    }
    
    public void remove(String key) {
        cache.remove(key);
    }
    
    public void clear() {
        cache.clear();
    }
    
    public void cleanup() {
        cache.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
    
    // Generate cache key for ML predictions
    public String generatePredictionKey(Map<String, Object> input) {
        return String.format("pred_%s_%s_%s_%s_%s_%s_%s_%s_%s",
            input.get("age"), input.get("gender"), input.get("weight_kg"), 
            input.get("height_cm"), input.get("body_fat_pct"), input.get("exercise_type"),
            input.get("duration_min"), input.get("intensity"), input.get("heart_rate"));
    }
}
