package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskRequestDTO;
import com.example.taskmanager.dto.TaskResponseDTO;
import com.example.taskmanager.dto.TaskStatusUpdateDTO;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.TaskStatus;
import com.example.taskmanager.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository repository;

    @InjectMocks
    private TaskService service;

    @Test
    void createTask_shouldReturnCreatedTask() {
        TaskRequestDTO req = new TaskRequestDTO();
        req.setTitle("Test Task");
        req.setDescription("Description");

        Task savedTask = new Task();
        savedTask.setId(1L);
        savedTask.setTitle("Test Task");
        savedTask.setDescription("Description");
        savedTask.setStatus(TaskStatus.TODO);
        savedTask.setCreatedAt(LocalDateTime.now());
        savedTask.setUpdatedAt(LocalDateTime.now());

        when(repository.save(any(Task.class))).thenReturn(savedTask);

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
        when(repository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.getTaskById(1L));
    }

    @Test
    void updateTaskStatus_shouldUpdateStatus() {
        Task existingTask = new Task();
        existingTask.setId(1L);
        existingTask.setTitle("Test Task");
        existingTask.setStatus(TaskStatus.TODO);
        existingTask.setCreatedAt(LocalDateTime.now());
        existingTask.setUpdatedAt(LocalDateTime.now());

        when(repository.findById(1L)).thenReturn(Optional.of(existingTask));
        when(repository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskStatusUpdateDTO updateReq = new TaskStatusUpdateDTO();
        updateReq.setStatus(TaskStatus.IN_PROGRESS);

        TaskResponseDTO updated = service.updateTaskStatus(1L, updateReq);
        assertEquals(TaskStatus.IN_PROGRESS, updated.getStatus());
    }
}
