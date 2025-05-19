Day Planner App-
The Day Planner App is a full-stack productivity tool designed to help users manage daily tasks with smart notifications. Users can create, update, and delete tasks, and receive notifications via email, SMS, and in-app alerts when tasks are due. The app supports real-time updates using server-sent events (SSE) and delayed message delivery via RabbitMQ.


# Notification Service

A scalable notification service supporting email, SMS, and in-app notifications with queue-based processing.

## Features

- **Notification Types**:
  - 📧 Email Notifications
  - 🔔 In-App Notifications (SSE)
- **Queue System**: RabbitMQ for async processing
- **Retry Mechanism**: 3 retries with exponential backoff
- **API Endpoints**:
  - `POST /notifications` - Send notification
  - `GET /users/[id]/notifications` - Get user notifications

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Queue**: RabbitMQ
- **Email**: Nodemailer
- **Auth**: JWT

## Installation

1. Clone repository:
```bash
git clone https://github.com/yourusername/notification-service.git
cd notification-service
Setup Instructions

2. Install Dependencies
npm install

3. Set Environment Variables
Create a .env file:
MONGODB_URI=your_mongodb_connection_string
PORT=5000
RABBITMQ_URL=amqp://localhost
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
INTERNAL_API_KEY=your-secure-key-here

4. Running the Application
Start server:
npm run start
Start worker (in separate terminal):
npm run worker

API Documentation
##Send Notification
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "userId": "user123",
    "message": "Your appointment is confirmed",
    "type": "email"
  }'
##Get User Notifications
curl http://localhost:3000/users/user123/notifications \
  -H "Authorization: Bearer <JWT_TOKEN>"
