package com.security.spring_security.Config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class HttpCacheConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new CacheControlInterceptor());
    }

    private static class CacheControlInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            String method = request.getMethod();
            String path = request.getRequestURI();

            // No caching for mutating requests
            if (!"GET".equalsIgnoreCase(method)) {
                response.setHeader("Cache-Control", "no-store");
                return true;
            }

            // Static food data — cache aggressively
            if (path.startsWith("/api/foods")) {
                response.setHeader("Cache-Control", "public, max-age=3600");
                return true;
            }

            // Exercise list — static, cache aggressively
            if (path.equals("/api/calorie-predictions/exercises")) {
                response.setHeader("Cache-Control", "public, max-age=3600");
                return true;
            }

            // Health check — always fresh
            if (path.equals("/api/calorie-predictions/health")) {
                response.setHeader("Cache-Control", "no-cache");
                return true;
            }

            // Dashboard — dynamic user summary, no cache
            if (path.startsWith("/api/dashboard")) {
                response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                return true;
            }

            // User profile — private, no cache
            if (path.equals("/api/me")) {
                response.setHeader("Cache-Control", "private, no-cache");
                return true;
            }

            // Workouts and meals — private, short cache
            if (path.startsWith("/api/workouts") || path.startsWith("/api/meals")) {
                response.setHeader("Cache-Control", "private, max-age=60");
                return true;
            }

            // Predictions — private, short cache
            if (path.startsWith("/api/calorie-predictions")) {
                response.setHeader("Cache-Control", "private, max-age=300");
                return true;
            }

            // Default
            response.setHeader("Cache-Control", "no-cache");
            return true;
        }
    }
}
