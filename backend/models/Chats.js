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
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
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
  },
  contextSummary: {
    type: String,
    default: ''
  },
  topics: [String],
  emotions: [String],
  importance: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  }
});

// Method to summarize chat context
chatSchema.methods.generateSummary = function() {
  const topicsMap = new Map();
  const emotionsMap = new Map();
  
  this.messages.forEach(msg => {
    // Extract topics from messages
    const words = msg.text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);
      
    words.forEach(word => {
      topicsMap.set(word, (topicsMap.get(word) || 0) + 1);
    });
    
    // Track emotions
    if (msg.facialExpression) {
      emotionsMap.set(msg.facialExpression, (emotionsMap.get(msg.facialExpression) || 0) + 1);
    }
  });
  
  // Get top topics and emotions
  this.topics = Array.from(topicsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
    
  this.emotions = Array.from(emotionsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion]) => emotion);
    
  this.contextSummary = `Chat focused on ${this.topics.join(', ')} with emotions: ${this.emotions.join(', ')}`;
  
  return this.contextSummary;
};

// Method to calculate chat importance
chatSchema.methods.calculateImportance = function() {
  const factors = {
    messageCount: Math.min(this.messages.length / 10, 1), // Max 1 point for message count
    emotionalVariety: this.emotions.length / 5, // Max 1 point for emotional range
    topicFocus: this.topics.length / 5, // Max 1 point for topic variety
    recency: 0 // Will be calculated based on lastMessageAt
  };
  
  // Calculate recency factor (max 2 points for very recent chats)
  const daysSinceLastMessage = (Date.now() - this.lastMessageAt) / (1000 * 60 * 60 * 24);
  factors.recency = Math.max(0, 2 - (daysSinceLastMessage / 7)); // Decay over a week
  
  this.importance = Math.round(
    (factors.messageCount + factors.emotionalVariety + factors.topicFocus + factors.recency) * 2
  );
  
  return this.importance;
};

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;