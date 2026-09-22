package com.example.taskmanager.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InfoControllerTest {

    private MockMvc mockMvc;

    @InjectMocks
    private InfoController infoController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(infoController).build();
    }

    @Test
    void getInfo_shouldReturnInstanceIdentification() throws Exception {
        mockMvc.perform(get("/api/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.application").value("task-manager"))
                .andExpect(jsonPath("$.hostname").isNotEmpty())
                .andExpect(jsonPath("$.ip").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }
}
