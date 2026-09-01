package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskRequestDTO;
import com.example.taskmanager.dto.TaskResponseDTO;
import com.example.taskmanager.dto.TaskStatusUpdateDTO;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.TaskStatus;
import com.example.taskmanager.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class TaskServiceTest {

    private TaskRepository repository;
    private TaskService service;

    @BeforeEach
    void setUp() {
        repository = new TaskRepository();
        service = new TaskService(repository);
    }

    @Test
    void createTask_shouldReturnCreatedTask() {
        TaskRequestDTO req = new TaskRequestDTO();
        req.setTitle("Test Task");
        req.setDescription("Description");

        TaskResponseDTO res = service.createTask(req);

        assertNotNull(res.getId());
        assertEquals("Test Task", res.getTitle());
        assertEquals("Description", res.getDescription());
        assertEquals(TaskStatus.TODO, res.getStatus());
        assertNotNull(res.getCreatedAt());
        assertNotNull(res.getUpdatedAt());
    }

    @Test
    void getTaskById_whenNotFound_shouldThrowException() {
        assertThrows(ResponseStatusException.class, () -> service.getTaskById(1L));
    }

    @Test
    void updateTaskStatus_shouldUpdateStatus() {
        TaskRequestDTO req = new TaskRequestDTO();
        req.setTitle("Test Task");
        TaskResponseDTO created = service.createTask(req);

        TaskStatusUpdateDTO updateReq = new TaskStatusUpdateDTO();
        updateReq.setStatus(TaskStatus.IN_PROGRESS);

        TaskResponseDTO updated = service.updateTaskStatus(created.getId(), updateReq);
        assertEquals(TaskStatus.IN_PROGRESS, updated.getStatus());
    }
}
