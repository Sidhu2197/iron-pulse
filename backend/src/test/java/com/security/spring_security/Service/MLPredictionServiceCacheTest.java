package com.security.spring_security.Service;

import com.security.spring_security.Config.PredictionCacheKeyGenerator;
import com.security.spring_security.Exceptions.MLPredictionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(MLPredictionServiceCacheTest.CacheTestConfig.class)
class MLPredictionServiceCacheTest {

    @Autowired
    private MLPredictionService service;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private CacheManager cacheManager;

    @BeforeEach
    void clearCachesAndMockInteractions() {
        cacheManager.getCache("ml-predictions").clear();
        cacheManager.getCache("exercises").clear();
        clearInvocations(restTemplate);
    }

    @Test
    void repeatedPredictionUsesCacheAndARelevantChangeMisses() throws Exception {
        Map<String, Object> mlResponse = Map.of("calories_burned", 320.0, "bmi", 22.1);
        when(restTemplate.exchange(
                eq("http://ml/predict"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(mlResponse, HttpStatus.OK));

        Map<String, Object> initialInput = validInput();
        Map<String, Object> equivalentInput = validInput();
        equivalentInput.put("weight_kg", 70);

        assertThat(service.predictCalories(initialInput)).isEqualTo(mlResponse);
        assertThat(service.predictCalories(equivalentInput)).isEqualTo(mlResponse);

        Map<String, Object> changedInput = validInput();
        changedInput.put("heart_rate", 151);
        assertThat(service.predictCalories(changedInput)).isEqualTo(mlResponse);

        verify(restTemplate, times(2)).exchange(
                eq("http://ml/predict"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void exercisesAreCachedAfterTheFirstSuccessfulResponse() {
        Map<String, Object> exercises = Map.of("exercises", List.of("Running", "Swimming"));
        when(restTemplate.getForEntity("http://ml/exercises", Map.class))
                .thenReturn(new ResponseEntity<>(exercises, HttpStatus.OK));

        assertThat(service.getSupportedExercises()).isEqualTo(exercises);
        assertThat(service.getSupportedExercises()).isEqualTo(exercises);

        verify(restTemplate, times(1)).getForEntity("http://ml/exercises", Map.class);
    }

    @Test
    void invalidPredictionIsNotSentToTheMlService() {
        Map<String, Object> invalidInput = validInput();
        invalidInput.remove("heart_rate");

        assertThatThrownBy(() -> service.predictCalories(invalidInput))
                .isInstanceOf(MLPredictionException.class)
                .hasMessageContaining("Missing required field: heart_rate");

        verifyNoInteractions(restTemplate);
    }

    @Test
    void failedMlRequestsAreNotCached() {
        when(restTemplate.exchange(
                eq("http://ml/predict"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new ResourceAccessException("ML service unavailable"));

        assertThatThrownBy(() -> service.predictCalories(validInput()))
                .isInstanceOf(MLPredictionException.class);
        assertThatThrownBy(() -> service.predictCalories(validInput()))
                .isInstanceOf(MLPredictionException.class);

        verify(restTemplate, times(2)).exchange(
                eq("http://ml/predict"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
    }

    private Map<String, Object> validInput() {
        Map<String, Object> input = new HashMap<>();
        input.put("age", 30);
        input.put("gender", 1);
        input.put("weight_kg", 70.0);
        input.put("height_cm", 175.0);
        input.put("body_fat_pct", 18.0);
        input.put("exercise_type", "Running");
        input.put("duration_min", 30);
        input.put("intensity", 2);
        input.put("heart_rate", 150);
        return input;
    }

    @Configuration(proxyBeanMethods = false)
    @EnableCaching
    static class CacheTestConfig {

        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("ml-predictions", "exercises");
        }

        @Bean
        RestTemplate restTemplate() {
            return mock(RestTemplate.class);
        }

        @Bean
        PredictionCacheKeyGenerator predictionCacheKeyGenerator() {
            return new PredictionCacheKeyGenerator();
        }

        @Bean
        MLPredictionService mlPredictionService(RestTemplate restTemplate) {
            return new MLPredictionService(restTemplate, "http://ml");
        }
    }
}
