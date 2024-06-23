import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const API_KEY = process.env.GEMINI_AI_API_KEY || "-";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "h1LKJj2ynlroiWrS8bX0";
console.log(elevenLabsApiKey)

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

//This code should be again de-commented
// const lipSyncMessage = async (message) => {
//   const time = new Date().getTime();
//   console.log(`Starting conversion for message ${message}`);
//   await execCommand(
//     `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
//   );
//   console.log(`Conversion done in ${new Date().getTime() - time}ms`);
//   await execCommand(
//     `.\\audios\\rhubarb.exe -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
//   );
//   console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
// };

let conversationHistory = [];

async function run(userMessage) {
  const prompt = `
    You are a mental health counselor whose job is to relive stress of person and provide solutions to their problems.
    Your name is Lisa.
    Your behvae as per the emotions of users.
    You can also tell Jokes, poem, Phrases if needed to cheer them up.
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
  console.log(text);

  const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();

  let messages = JSON.parse(jsonText);

  if (messages.messages) {
    messages = messages.messages;
  }

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const fileName = `audios/message_${i}.mp3`;
    const textInput = message.text;
    await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
    await lipSyncMessage(i);
    message.audio = await audioFileToBase64(fileName);
    message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
  }

  conversationHistory = [...conversationHistory, `User: ${userMessage}`, ...messages.map(m => `Lisa: ${m.text}`)];

  return messages;
}

app.post("/chat", async (req, res) => {
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
  if (!elevenLabsApiKey || API_KEY === "-") {
    res.send({
      messages: [
        {
          text: "Please , don't forget to add your API keys!",
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