import { exec } from "child_process";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ElevenLabsClient } from 'elevenlabs';
import { PassThrough } from 'stream';
import fs from 'fs/promises';
import session from "express-session";
import passport from "./auth.js";
import mongoose from 'mongoose';
import MongoStore from "connect-mongo";
import {createWriteStream} from 'fs';
import Chat from './models/Chats.js';


dotenv.config();

const API_KEY = process.env.GEMINI_AI_API_KEY || "-";
const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

const app = express();
const PORT = process.env.PORT || 3000; // Use Render's assigned port
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('Error connecting to MongoDB', err);
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    credentials: true, 
  })
);

app.use(
  session({
    secret: "your_secret_key",
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: false, // Set to true only in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log("Redirect URI received:", req.originalUrl);
    next();
  },
  passport.authenticate("google", {
    failureRedirect: "/",
    failureMessage: true,
    session: true
  }),
  (req, res) => {
    // Ensure user is set in session
    req.session.user = req.user;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/');
      }
      const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app`;
      console.log('Redirecting to:', redirectTo);
      res.redirect(redirectTo);
    });
  }
);

app.get("/auth/check", (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// Update logout to properly handle session
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    req.logout(() => {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  });
});

app.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user); // Send user info from the session
  } else {
    res.status(401).send("User not authenticated");
  }
});

app.get('/chats', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ lastMessageAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};


const createAudioFileFromText = async (text, fileName) => {
  try {
    const voiceData = await client.voices.get(VOICE_ID);
    if (!voiceData) {
      throw new Error('Voice not found');
    }

    const audioResponse = await client.textToSpeech.convert(VOICE_ID, {
      output_format: "mp3_44100_128",
      text: text,
      modelId: 'eleven_monolingual_v2'
    });

    return new Promise((resolve, reject) => {
      if (audioResponse instanceof PassThrough) {
        const fileStream = createWriteStream(fileName);
        
        audioResponse.pipe(fileStream);

        fileStream.on('finish', () => {
          console.log(`Audio file created: ${fileName}`);
          resolve(fileName);
        });

        fileStream.on('error', (err) => {
          console.error('Error writing audio file:', err);
          reject(err);
        });
      } else {
        reject(new Error('Audio response is not a stream'));
      }
    });
  } catch (error) {
    console.error('Error in createAudioFileFromText:', error);
    throw error;
  }
};


const lipSyncMessage = async (fileName) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for file ${fileName}`);
  const wavFile = fileName.replace('.mp3', '.wav');

  await execCommand(`ffmpeg -y -i ${fileName} ${wavFile}`);
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);

  const jsonFile = fileName.replace('.mp3', '.json');
  await execCommand(`.\\audios\\rhubarb.exe -f json -o ${jsonFile} ${wavFile} -r phonetic`);
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
  return jsonFile;
};

let conversationHistory = [];

async function run(userMessage) {
  try {
    const prompt = `
      You are a mental health counselor whose job is to relieve stress of the person and provide solutions to their problems.
      Your name is Lisa.
      You behave as per the emotions of users.
      You can also tell jokes, poems, phrases if needed to cheer them up.
      You will always reply with a JSON array of messages. With a maximum of 3 messages.
      Each message has a text, facialExpression, and animation property.
      The different facial expressions are: smile, sad, angry, default.
      The different animations are: Talking_1, Laughing, Idle, and Angry.

      Conversation history: ${conversationHistory.join('\n')}
      User message: ${userMessage}
      User emotion: Stressed
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let messages = JSON.parse(jsonText);

    if (messages.messages) {
      messages = messages.messages;
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const fileName = `audios/message_${i}.mp3`;
      const textInput = message.text;
    
      try {
        const generatedFile = await createAudioFileFromText(textInput, fileName);
        const jsonFile = await lipSyncMessage(generatedFile);
        message.audio = await audioFileToBase64(generatedFile);
        message.lipsync = await readJsonTranscript(jsonFile);
      } catch (error) {
        console.error('Error processing message:', error);
        message.audio = null;
        message.lipsync = null;
      }
    }
    

    conversationHistory = [...conversationHistory, `User: ${userMessage}`, ...messages.map(m => `Lisa: ${m.text}`)];
    return messages;
  } catch (error) {
    console.error('Error in run function:', error);
    throw error;
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Utility function to prune old chats
async function pruneOldChats(userId) {
  const userChats = await Chat.find({ user: userId }).sort({ lastMessageAt: -1 });
  
  if (userChats.length > 30) {
    // Get chats to remove
    const chatsToRemove = userChats.slice(30);
    
    // Remove chats with low importance
    await Chat.deleteMany({
      _id: { $in: chatsToRemove.map(c => c._id) },
      importance: { $lt: 7 } // Keep important chats even if they're old
    });
  }
}

// Utility function to get chat context
async function getChatContext(userId) {
  const recentChats = await Chat.find({ user: userId })
    .sort({ lastMessageAt: -1 })
    .limit(5);
    
  return recentChats.map(chat => ({
    summary: chat.contextSummary,
    topics: chat.topics,
    emotions: chat.emotions,
    lastMessageAt: chat.lastMessageAt
  }));
}

app.post("/chat", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userMessage = req.body.message;
    let chat;

    // Get chat context for AI
    const chatContext = await getChatContext(req.user._id);
    
    // Add context to conversation history
    const contextPrompt = chatContext
      .map(ctx => `Previous context: ${ctx.summary}`)
      .join('\n');
    
    if (!userMessage) {
      const introMessage = {
        text: "How can I help you?",
        audio: await audioFileToBase64("audios/intro_0.wav"),
        lipsync: await readJsonTranscript("audios/intro_0.json"),
        facialExpression: "smile",
        animation: "Talking_1",
        sender: "bot"
      };

      // Create a new chat for the intro message
      chat = new Chat({
        user: req.user._id,
        messages: [introMessage],
        startedAt: new Date(),
        lastMessageAt: new Date()
      });
      await chat.save();

      res.send({ messages: [introMessage] });
      return;
    }

    if (!ELEVENLABS_API_KEY || API_KEY === "-") {
      const apiErrorMessage = {
        text: "Please, don't forget to add your API keys!",
        audio: await audioFileToBase64("audios/api_0.wav"),
        lipsync: await readJsonTranscript("audios/api_0.json"),
        facialExpression: "angry",
        animation: "Angry",
        sender: "bot"
      };

      chat = new Chat({
        user: req.user._id,
        messages: [
          { text: userMessage, sender: "user" },
          apiErrorMessage
        ],
        startedAt: new Date(),
        lastMessageAt: new Date()
      });
      await chat.save();

      res.send({ messages: [apiErrorMessage] });
      return;
    }

    // Get bot response messages with context
    const prompt = `
      ${contextPrompt}
      
      You are a mental health counselor whose job is to relieve stress of the person and provide solutions to their problems.
      Your name is Lisa.
      You behave as per the emotions of users.
      You can also tell jokes, poems, phrases if needed to cheer them up.
      You will always reply with a JSON array of messages. With a maximum of 3 messages.
      Each message has a text, facialExpression, and animation property.
      The different facial expressions are: smile, sad, angry, default.
      The different animations are: Talking_1, Laughing, Idle, and Angry.

      Conversation history: ${conversationHistory.join('\n')}
      User message: ${userMessage}
    `;

    const botMessages = await run(prompt);
    
    // Format messages for storage
    const formattedMessages = [
      { text: userMessage, sender: "user" },
      ...botMessages.map(msg => ({
        ...msg,
        sender: "bot"
      }))
    ];

    // Find existing chat from today or create new one
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    chat = await Chat.findOne({
      user: req.user._id,
      startedAt: { $gte: startOfDay }
    });

    if (chat) {
      chat.messages.push(...formattedMessages);
      chat.lastMessageAt = new Date();
    } else {
      chat = new Chat({
        user: req.user._id,
        messages: formattedMessages,
        startedAt: new Date(),
        lastMessageAt: new Date()
      });
    }
    
    // Generate chat summary and calculate importance
    chat.generateSummary();
    chat.calculateImportance();
    await chat.save();
    
    // Prune old chats if needed
    await pruneOldChats(req.user._id);
    
    res.send({ 
      messages: botMessages,
      context: {
        summary: chat.contextSummary,
        topics: chat.topics,
        emotions: chat.emotions
      }
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});

