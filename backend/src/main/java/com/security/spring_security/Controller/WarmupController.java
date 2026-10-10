package com.security.spring_security.Controller;

import com.security.spring_security.Service.WarmupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.concurrent.ConcurrentLinkedQueue;

@RestController
@RequestMapping("/api")
public class WarmupController {

    private static final Logger log = LoggerFactory.getLogger(WarmupController.class);

    private static final int MAX_REQUESTS = 2;
    private static final long TIME_WINDOW_MINUTES = 10;

    private final ConcurrentLinkedQueue<Instant> requestTimestamps = new ConcurrentLinkedQueue<>();

    @Autowired
    private WarmupService warmupService;

    @PostMapping("/warmup")
    public ResponseEntity<Void> warmup() {
        Instant now = Instant.now();
        Instant tenMinutesAgo = now.minus(TIME_WINDOW_MINUTES, java.time.temporal.ChronoUnit.MINUTES);

        // Remove timestamps older than 10 minutes
        requestTimestamps.removeIf(timestamp -> timestamp.isBefore(tenMinutesAgo));

        // Check if we've exceeded the rate limit
        if (requestTimestamps.size() >= MAX_REQUESTS) {
            log.debug("Warmup rate limit exceeded ({} requests in last {} minutes), skipping", 
                requestTimestamps.size(), TIME_WINDOW_MINUTES);
            return ResponseEntity.ok().build();
        }

        // Add current timestamp and trigger warmup
        requestTimestamps.add(now);
        log.info("Triggering ML service warmup (request #{} in last {} minutes)", 
            requestTimestamps.size(), TIME_WINDOW_MINUTES);
        
        warmupService.warmupAllServices();
        
        return ResponseEntity.ok().build();
    }
}
