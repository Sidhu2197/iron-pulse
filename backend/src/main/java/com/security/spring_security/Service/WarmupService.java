package com.security.spring_security.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.CompletableFuture;

@Service
public class WarmupService {

    private static final Logger log = LoggerFactory.getLogger(WarmupService.class);

    private static final String[] ML_SERVICE_DOCS_ENDPOINTS = {
        "https://diet-recommendation-model.onrender.com/docs",
        "https://recovery-model.onrender.com/docs",
        "https://calories-predictor-1-jttt.onrender.com/docs",
        "https://v0-v0educationalaiplatformmain.vercel.app/docs"
    };

    private final RestTemplate restTemplate;

    public WarmupService() {
        this.restTemplate = new RestTemplate();
    }

    @Async
    public CompletableFuture<Void> warmupAllServices() {
        log.info("Starting ML service warmup...");
        
        for (String url : ML_SERVICE_DOCS_ENDPOINTS) {
            warmupService(url);
        }
        
        return CompletableFuture.completedFuture(null);
    }

    private void warmupService(String url) {
        try {
            log.debug("Warming up service: {}", url);
            restTemplate.getForObject(url, String.class);
            log.info("Successfully warmed up: {}", url);
        } catch (Exception e) {
            log.warn("Failed to warm up service {} (this is acceptable during warmup): {}", url, e.getMessage());
        }
    }
}
