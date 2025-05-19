import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function CreateTask({ onTaskCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    notificationType: 'email'
  });
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        ...formData,
        scheduledTime: new Date(formData.scheduledTime).toISOString()
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create task');
    
    onTaskCreated();
    setFormData({ 
      title: '', 
      description: '', 
      scheduledTime: '', 
      notificationType: 'email' 
    });
    setError('');
  } catch (err) {
    setError(err.message);
    console.error('Task creation error:', err);
  }
};

  return (
    <div className="create-task">
      <h3>Create New Task</h3>
      {error && <div className="error">{error}</div>}
      // In CreateTask.jsx's return statement
<form onSubmit={handleSubmit}>
  <input
    type="text"
    placeholder="Task Title"
    value={formData.title}
    onChange={(e) => setFormData({...formData, title: e.target.value})}
    required
  />
  <textarea
    placeholder="Description"
    value={formData.description}
    onChange={(e) => setFormData({...formData, description: e.target.value})}
  />
  <input
    type="datetime-local"
    value={formData.scheduledTime}
    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
    required
  />
  <select
    value={formData.notificationType}
    onChange={(e) => setFormData({...formData, notificationType: e.target.value})}
  >
    <option value="email">Email</option>
    <option value="in-app">In-App</option>
  </select>
  <button type="submit">Create Task</button>
</form>
    </div>
  );
}