const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  scheduledTime: { type: Date, required: true },
  notificationType: { 
    type: String, 
    enum: ['sms', 'in-app'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed'], 
    default: 'pending' 
  },
  retries: { type: Number, default: 0 }
});

module.exports = mongoose.model('Task', taskSchema);