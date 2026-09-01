package com.example.taskmanager.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class InfoController {

    @GetMapping("/info")
    public Map<String, String> getInfo() {
        return Map.of(
            "name", "Task Manager REST API",
            "version", "1.0.0",
            "description", "Initial setup for Task Manager application"
        );
    }
}
