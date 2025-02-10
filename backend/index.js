import { exec } from "child_process";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ElevenLabsClient } from 'elevenlabs';
import { PassThrough } from 'stream';
import { writeFile } from 'fs/promises';
import session from "express-session";
import passport from "./auth.js";
import mongoose from 'mongoose';
import MongoStore from "connect-mongo";

dotenv.config();

const API_KEY = process.env.GEMINI_AI_API_KEY || "-";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

const app = express();
const port = 3000;
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
    origin: "http://localhost:5173", 
    credentials: true, 
  })
);

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Use your MongoDB URI
      collectionName: "sessions", // The collection where session data will be stored
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/check", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});


app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    if (req.user) {
      res.redirect("http://localhost:5173 ");
    } else {
      res.redirect("http://localhost:5173");
    }
  }
);

app.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user); // Send user info from the session
  } else {
    res.status(401).send("User not authenticated");
  }
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
      if (err) {
          return next(err);
      }
      res.redirect('/');
  });
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

    if (audioResponse instanceof PassThrough) {
      const chunks = [];

      audioResponse.on('data', (chunk) => {
        chunks.push(chunk);
      });

      audioResponse.on('end', async () => {
        const audioBuffer = Buffer.concat(chunks);
        await writeFile(fileName, audioBuffer);
        console.log(`Audio file created: ${fileName}`);
      });

      audioResponse.on('error', (err) => {
        console.error('Error processing the audio stream:', err);
      });
    } else {
      throw new Error('Audio response is not a stream');
    }

    return fileName;
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
        await createAudioFileFromText(textInput, fileName);
        const jsonFile = await lipSyncMessage(fileName);
        message.audio = await audioFileToBase64(fileName);
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

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      res.send({
        messages: [
          {
            text: "How can I help you?",
            audio: await audioFileToBase64("audios/intro_0.wav"),
            lipsync: await readJsonTranscript("audios/intro_0.json"),
            facialExpression: "smile",
            animation: "Talking_1",
          }
        ],
      });
      return;
    }
    if (!ELEVENLABS_API_KEY || API_KEY === "-") {
      res.send({
        messages: [
          {
            text: "Please, don't forget to add your API keys!",
            audio: await audioFileToBase64("audios/api_0.wav"),
            lipsync: await readJsonTranscript("audios/api_0.json"),
            facialExpression: "angry",
            animation: "Angry",
          }
        ],
      });
      return;
    }

    const messages = await run(userMessage);
    res.send({ messages });
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

app.listen(port, () => {
  console.log(`Bot listening on port ${port}`);
});
