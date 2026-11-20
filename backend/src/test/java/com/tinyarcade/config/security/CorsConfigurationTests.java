package com.tinyarcade.config.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class CorsConfigurationTests {

    @Test
    void allowsOnlyConfiguredFrontendOrigins() {
        var source = new SecurityConfig().corsConfigurationSource(
                " https://board.example.com, https://preview.example.com ");
        var configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("OPTIONS", "/api/auth/login"));

        assertEquals("https://board.example.com", configuration.checkOrigin("https://board.example.com"));
        assertEquals("https://preview.example.com", configuration.checkOrigin("https://preview.example.com"));
        assertNull(configuration.checkOrigin("https://other.example.com"));
        assertTrue(configuration.checkHttpMethod(org.springframework.http.HttpMethod.POST)
                .contains(org.springframework.http.HttpMethod.POST));
        assertEquals(java.util.List.of("Authorization", "Content-Type"),
                configuration.checkHeaders(java.util.List.of("Authorization", "Content-Type")));
    }

    @Test
    void emptySettingDoesNotAllowExternalOrigins() {
        var source = new SecurityConfig().corsConfigurationSource("");
        var configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("OPTIONS", "/api/posts"));

        assertNull(configuration.checkOrigin("https://board.example.com"));
    }
}
