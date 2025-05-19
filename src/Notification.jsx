import { useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.token) return;

    // Update the EventSource connection
const eventSource = new EventSource(
  `http://localhost:3000/api/notifications/stream?token=${user.token}`
);
    eventSource.onmessage = (e) => {
      const notification = JSON.parse(e.data);
      setNotifications(prev => [
        ...prev, 
        { ...notification, id: Date.now() }
      ]);
    };

    return () => eventSource.close();
  }, [user?.token]);

  return (
    <div className="notification-container">
      {notifications.map(n => (
        <div key={n.id} className={`notification ${n.type}`}>
          <span className="notification-icon">
            {n.type === 'email' ? '📧' : '🔔'}
          </span>
          {n.message}
        </div>
      ))}
    </div>
  );
}