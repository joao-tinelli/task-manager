import { useState, useEffect } from 'react'

function TaskForm({ onSubmit, initialData, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('TODO')

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description || '')
      setStatus(initialData.status)
    } else {
      setTitle('')
      setDescription('')
      setStatus('TODO')
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    
    onSubmit({ title, description, status })
    
    if (!initialData) {
      setTitle('')
      setDescription('')
      setStatus('TODO')
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div>
        <input 
          type="text" 
          placeholder="Task title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
        />
      </div>
      <div>
        <textarea 
          placeholder="Task description (optional)" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
        />
      </div>
      <div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="btn" disabled={!title.trim()}>
          {initialData ? 'Update Task' : 'Add Task'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default TaskForm
