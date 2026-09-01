function TaskList({ tasks, onDelete, onEdit, onStatusChange }) {
  
  const getStatusDisplay = (status) => {
    const map = {
      TODO: 'To Do',
      IN_PROGRESS: 'In Progress',
      DONE: 'Done'
    }
    return map[status] || status
  }

  const nextStatus = (current) => {
    if (current === 'TODO') return 'IN_PROGRESS'
    if (current === 'IN_PROGRESS') return 'DONE'
    return 'TODO'
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task.id} className="task-item">
          <div className="task-content">
            <h3 className="task-title">{task.title}</h3>
            {task.description && <p className="task-desc">{task.description}</p>}
            
            <div 
              className={`task-status status-${task.status}`} 
              onClick={() => onStatusChange(task.id, nextStatus(task.status))}
              title="Click to advance status"
            >
              {getStatusDisplay(task.status)}
            </div>
          </div>
          <div className="task-actions">
            <button className="btn btn-small btn-secondary" onClick={() => onEdit(task)}>
              Edit
            </button>
            <button className="btn btn-small btn-danger" onClick={() => onDelete(task.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TaskList
