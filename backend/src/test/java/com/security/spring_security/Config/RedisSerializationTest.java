package com.security.spring_security.Config;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RedisSerializationTest {

    @Test
    void predictionResponseMapRoundTripsThroughTheRedisSerializer() {
        Map<String, Object> prediction = new LinkedHashMap<>();
        prediction.put("calories_burned", 320.5);
        prediction.put("bmi", 22.1);
        prediction.put("details", List.of("estimated", "calorie prediction"));

        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer();
        Object deserialized = serializer.deserialize(serializer.serialize(prediction));

        assertThat(deserialized).isEqualTo(prediction);
    }
}
