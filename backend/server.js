require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const auth = require('./middlewares/auth');
const User = require('./models/user');
const Task = require('./models/task');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');

const sseClients = [];

const app = express();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// RabbitMQ Setup
let channel;
async function setupRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URI);
  channel = await connection.createChannel();
  await channel.assertExchange('tasks', 'x-delayed-message', {
    durable: true,
    arguments: { 'x-delayed-type': 'direct' }
  });
  await channel.assertQueue('task_queue');
  await channel.bindQueue('task_queue', 'tasks', '');
}

// Auth Routes
// server.js (backend)
// Modify the notifications stream endpoint
app.get('/api/notifications/stream', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).end();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add client to list
    const newClient = { id: decoded.userId, res };
    sseClients.push(newClient);

    // Remove on disconnect
    req.on('close', () => {
      sseClients.splice(sseClients.indexOf(newClient), 1);
    });

  } catch (error) {
    res.status(401).end();
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.status(201).json({ token });
    
  } catch (error) {
    console.error("Signup error:", error); // Debug log
    res.status(500).json({ error: "Server error" });
  }
});

// server.js
// Login Route - Updated with case-insensitive email matching
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Case-insensitive email search
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      userId: user._id.toString() 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Task Routes
app.post('/api/tasks', auth, async (req, res) => {
  try {
    const task = new Task({
      userId: req.userId,
      ...req.body
    });
    await task.save();

    const delay = Math.max(task.scheduledTime - Date.now(), 0);
    channel.publish('tasks', '', Buffer.from(task._id.toString()), {
      headers: { 'x-delay': delay }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// server.js
app.get('/api/auth/verify', auth, (req, res) => {
  res.json({ valid: true });
});

app.get('/api/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notification Stream (SSE)
app.get('/api/notifications/stream', auth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Store the connection
  const client = {
    id: req.userId,
    res
  };

  sseClients.push(client);

  // Remove client when connection closes
  req.on('close', () => {
    sseClients.splice(sseClients.indexOf(client), 1);
  });
});


app.post('/api/notify', auth, (req, res) => {
  const { userId, message } = req.body;
  
  sseClients.forEach(client => {
    if (client.id === userId) {
      client.res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  });
  
  res.status(200).json({ success: true });
});

// Server Initialization
setupRabbitMQ().then(() => {
  app.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('RabbitMQ connected');
  });
});