package com.example.taskmanager.dto;

import com.example.taskmanager.model.TaskStatus;

public class TaskStatusUpdateDTO {
    private TaskStatus status;

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }
}
