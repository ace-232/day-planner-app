require('dotenv').config();
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Task = require('./models/task');
const User = require('./models/user');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Worker connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Email Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function processNotification(taskId) {
  try {
    const task = await Task.findById(taskId);
    if (!task || task.status === 'sent') return;

    const user = await User.findById(task.userId);
    
    switch(task.notificationType) {
      case 'email':
        await transporter.sendMail({
          to: user.email,
          subject: 'Task Reminder',
          text: `Your task "${task.title}" is due now!`
        });
        break;

      case 'in-app':
  try {
    await axios.post('http://localhost:3000/api/notify', {
      userId: task.userId.toString(),
      message: {
        type: 'in-app',
        content: `Task due: ${task.title}`,
        taskId: task._id
      }
    }, {
      headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` }
    });
  } catch (error) {
    console.error('SSE notification failed:', error.message);
  }
  break;
    }

    task.status = 'sent';
    await task.save();
  } catch (error) {
    console.error(`Notification failed: ${error.message}`);
    const task = await Task.findById(taskId);
    task.retries += 1;
    
    if(task.retries <= 3) {
      const delay = Math.pow(2, task.retries) * 5000; // Exponential backoff
      const channel = await amqp.connect(process.env.RABBITMQ_URI);
      const ch = await channel.createChannel();
      await ch.publish('tasks', '', Buffer.from(taskId.toString()), {
        headers: { 'x-delay': delay }
      });
    } else {
      task.status = 'failed';
    }
    
    await task.save();
  }
}

// RabbitMQ Consumer
async function startWorker() {
  const connection = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();
  
  await channel.assertQueue('task_queue');
  channel.consume('task_queue', async (msg) => {
    if (msg !== null) {
      await processNotification(msg.content.toString());
      channel.ack(msg);
    }
  });
}

startWorker().catch(console.error);