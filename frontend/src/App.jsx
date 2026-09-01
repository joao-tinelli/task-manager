import { useState, useEffect } from 'react'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/tasks'

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleCreateTask = async (taskData) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      if (!res.ok) throw new Error('Failed to create task')
      await fetchTasks()
      showSuccess('Task created successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateTask = async (id, taskData) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      if (!res.ok) throw new Error('Failed to update task')
      setEditingTask(null)
      await fetchTasks()
      showSuccess('Task updated successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      await fetchTasks()
      showSuccess('Task deleted successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      await fetchTasks()
      showSuccess('Status updated!')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="app-container">
      <h1>Task Manager</h1>
      
      {error && <div className="error-msg">{error}</div>}
      {successMsg && <div className="success-msg">{successMsg}</div>}

      <div className="card">
        <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
        <TaskForm 
          onSubmit={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
          initialData={editingTask}
          onCancel={editingTask ? () => setEditingTask(null) : null}
        />
      </div>

      <div className="card">
        <h2>Your Tasks</h2>
        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">No tasks found. Create one above!</div>
        ) : (
          <TaskList 
            tasks={tasks} 
            onDelete={handleDeleteTask}
            onEdit={setEditingTask}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  )
}

export default App
