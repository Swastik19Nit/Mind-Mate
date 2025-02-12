import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  text: String,
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  facialExpression: String,
  animation: String,
  audio: String,
  lipsync: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;