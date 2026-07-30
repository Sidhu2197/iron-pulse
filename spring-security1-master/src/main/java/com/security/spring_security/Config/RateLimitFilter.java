package com.security.spring_security.Config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static class RateLimitBucket {
        private final long windowMillis;
        private final int limit;
        private long startTime;
        private int count;

        public RateLimitBucket(long windowMillis, int limit) {
            this.windowMillis = windowMillis;
            this.limit = limit;
            this.startTime = System.currentTimeMillis();
            this.count = 0;
        }

        public synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();
            if (now - startTime > windowMillis) {
                startTime = now;
                count = 1;
                return true;
            }
            if (count < limit) {
                count++;
                return true;
            }
            return false;
        }
    }

    private final Map<String, Map<String, RateLimitBucket>> bucketsByIp = new ConcurrentHashMap<>();

    private RateLimitBucket getBucket(String ip, String bucketKey, long windowMillis, int limit) {
        bucketsByIp.putIfAbsent(ip, new ConcurrentHashMap<>());
        Map<String, RateLimitBucket> ipBuckets = bucketsByIp.get(ip);
        ipBuckets.putIfAbsent(bucketKey, new RateLimitBucket(windowMillis, limit));
        return ipBuckets.get(bucketKey);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        
        // Only apply to /api endpoints
        if (!path.startsWith("/api")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = getClientIP(request);

        RateLimitBucket bucket;

        if (path.equals("/api/register")) {
            bucket = getBucket(ip, "register", TimeUnit.HOURS.toMillis(1), 5); // 5 per hour
        } else if (path.equals("/api/login")) {
            bucket = getBucket(ip, "login", TimeUnit.MINUTES.toMillis(1), 10); // 10 per minute
        } else if (path.equals("/api/auth/forgot-password")) {
            bucket = getBucket(ip, "forgot-password", TimeUnit.HOURS.toMillis(1), 3); // 3 per hour
        } else if (path.equals("/api/resend-verification")) {
            bucket = getBucket(ip, "resend-verification", TimeUnit.HOURS.toMillis(1), 3); // 3 per hour
        } else {
            bucket = getBucket(ip, "global", TimeUnit.MINUTES.toMillis(1), 100); // 100 per minute for all other API endpoints
        }

        if (!bucket.tryConsume()) {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write("{\"success\": false, \"message\": \"Too many requests. Please try again later.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim(); // Get the first IP in the list
    }
}
