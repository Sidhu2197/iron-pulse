package com.security.spring_security.Config;

import com.security.spring_security.Service.SimpleCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class CacheCleanupScheduler {

    @Autowired
    private SimpleCacheService cacheService;

    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    public void cleanupExpiredCache() {
        cacheService.cleanup();
    }
}
