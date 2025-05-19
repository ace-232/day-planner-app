export default function TaskList({ tasks }) {
  return (
    <div className="task-list">
      <h3>Scheduled Tasks</h3>
      {tasks.length === 0 ? (
        <p>No tasks scheduled</p>
      ) : (
        <div className="tasks">
          {tasks.map(task => (
            <div key={task._id} className="task-item">
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`pill ${task.notificationType}`}>
                  {task.notificationType}
                </span>
              </div>
              <p>{task.description}</p>
              <div className="task-footer">
                <span>{new Date(task.scheduledTime).toLocaleString()}</span>
                {task.notified ? '✅' : '⏳'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}