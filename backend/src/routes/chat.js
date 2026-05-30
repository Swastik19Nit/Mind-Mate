import { Router } from 'express';
import Chat from '../models/Chat.js';
import { run } from '../services/ai.js';
import { audioFileToBase64, readJsonTranscript } from '../services/audio.js';

const router = Router();

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
};

async function getChatContext(userId) {
  const recentChats = await Chat.find({ user: userId }).sort({ lastMessageAt: -1 }).limit(5);
  return recentChats.map((chat) => ({
    summary: chat.contextSummary,
    topics: chat.topics,
    emotions: chat.emotions,
    lastMessageAt: chat.lastMessageAt,
  }));
}

async function pruneOldChats(userId) {
  const userChats = await Chat.find({ user: userId }).sort({ lastMessageAt: -1 });
  if (userChats.length > 30) {
    const chatsToRemove = userChats.slice(30);
    await Chat.deleteMany({
      _id: { $in: chatsToRemove.map((c) => c._id) },
      importance: { $lt: 7 },
    });
  }
}

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id }).sort({ lastMessageAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userMessage = req.body.message;
    let chat;

    if (!userMessage) {
      const introMessage = {
        text: 'How can I help you?',
        audio: await audioFileToBase64('audios/intro_0.wav'),
        lipsync: await readJsonTranscript('audios/intro_0.json'),
        facialExpression: 'smile',
        animation: 'Talking_1',
        sender: 'bot',
      };
      chat = new Chat({
        user: req.user._id,
        messages: [introMessage],
        startedAt: new Date(),
        lastMessageAt: new Date(),
      });
      await chat.save();
      return res.send({ messages: [introMessage] });
    }

    if (!process.env.ELEVEN_LABS_API_KEY || (process.env.GROQ_API_KEY || '-') === '-') {
      const apiErrorMessage = {
        text: "Please, don't forget to add your API keys!",
        audio: await audioFileToBase64('audios/api_0.wav'),
        lipsync: await readJsonTranscript('audios/api_0.json'),
        facialExpression: 'angry',
        animation: 'Angry',
        sender: 'bot',
      };
      chat = new Chat({
        user: req.user._id,
        messages: [{ text: userMessage, sender: 'user' }, apiErrorMessage],
        startedAt: new Date(),
        lastMessageAt: new Date(),
      });
      await chat.save();
      return res.send({ messages: [apiErrorMessage] });
    }

    const chatContext = await getChatContext(req.user._id);
    const contextPrompt = chatContext
      .slice(0, 2)
      .map((ctx) => `Previous context: ${ctx.summary}`)
      .join('\n');

    const prompt = contextPrompt ? `${contextPrompt}\n\nUser message: ${userMessage}` : userMessage;
    const botMessages = await run(prompt);

    const formattedMessages = [
      { text: userMessage, sender: 'user' },
      ...botMessages.map((msg) => ({ ...msg, sender: 'bot' })),
    ];

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    chat = await Chat.findOne({ user: req.user._id, startedAt: { $gte: startOfDay } });

    if (chat) {
      chat.messages.push(...formattedMessages);
      chat.lastMessageAt = new Date();
    } else {
      chat = new Chat({
        user: req.user._id,
        messages: formattedMessages,
        startedAt: new Date(),
        lastMessageAt: new Date(),
      });
    }

    chat.generateSummary();
    chat.calculateImportance();
    await chat.save();
    await pruneOldChats(req.user._id);

    res.send({
      messages: botMessages,
      context: {
        summary: chat.contextSummary,
        topics: chat.topics,
        emotions: chat.emotions,
      },
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

export default router;
