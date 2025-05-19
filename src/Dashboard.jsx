import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import CreateTask from './CreateTask';
import TaskList from './TaskList';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadTasks = async () => {
  try {
    const res = await fetch('/api/tasks', {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    const data = await res.json();
    setTasks(data);
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
};
    
    loadTasks();
  }, [user.token]);

  return (
    <div className="dashboard">
      <header>
        <h1>My Day Planner</h1>
        <button onClick={logout}>Logout</button>
      </header>
      
      <CreateTask onTaskCreated={() => loadTasks()} />
      <TaskList tasks={tasks} />
    </div>
  );
}