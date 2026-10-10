package com.security.spring_security.Config;

import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Map;

/**
 * Builds a stable, non-sensitive cache key for calorie prediction inputs.
 * Redis still prefixes the result with the cache name (ml-predictions::).
 */
@Component("predictionCacheKeyGenerator")
public class PredictionCacheKeyGenerator implements KeyGenerator {

    private static final List<String> FIELDS = List.of(
            "age", "gender", "weight_kg", "height_cm", "body_fat_pct",
            "exercise_type", "duration_min", "intensity", "heart_rate");

    @Override
    public Object generate(Object target, Method method, Object... params) {
        if (params.length != 1 || !(params[0] instanceof Map<?, ?> input)) {
            throw new IllegalArgumentException("Prediction cache key requires one input map");
        }

        StringBuilder canonicalInput = new StringBuilder();
        for (String field : FIELDS) {
            Object value = input.get(field);
            canonicalInput.append(field)
                    .append('=')
                    .append(canonicalValue(value))
                    .append('\n');
        }

        return "pred_" + sha256(canonicalInput.toString());
    }

    private String canonicalValue(Object value) {
        if (value instanceof Number number) {
            try {
                return new BigDecimal(number.toString()).stripTrailingZeros().toPlainString();
            } catch (NumberFormatException ignored) {
                // Let the service's validation produce the API's normal validation error.
                return number.toString();
            }
        }
        return String.valueOf(value);
    }

    private String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
