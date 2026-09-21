package com.example.taskmanager.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${cors.allowed-origins:${CORS_ALLOWED_ORIGINS:http://localhost:5173}}")
public class InfoController {

    @GetMapping("/info")
    public Map<String, String> getInfo() {
        String hostname = System.getenv("HOSTNAME");
        if (hostname == null || hostname.isBlank()) {
            try {
                hostname = InetAddress.getLocalHost().getHostName();
            } catch (UnknownHostException e) {
                hostname = "unknown";
            }
        }
        return Map.of(
                "name", "Task Manager REST API",
                "version", "1.0.0",
                "description", "Initial setup for Task Manager application",
                "hostname", hostname);
    }
}
