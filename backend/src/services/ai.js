import Groq from 'groq-sdk';
import { createAudioFileFromText, lipSyncMessage, audioFileToBase64, readJsonTranscript } from './audio.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '-' });

// Global conversation history (shared across users — to be replaced with per-user Map later)
let conversationHistory = [];

export const run = async (userMessage) => {
  const prompt = `
    You are a mental health counselor named Lisa whose job is to relieve stress and provide support.
    You behave according to the user's emotions and can tell jokes, poems, or phrases to cheer them up.
    Always reply with a JSON array of up to 3 messages. Each message must have:
      - text: your response
      - facialExpression: one of smile, sad, angry, surprised, empathetic, curious, default
      - animation: one of Talking_1, Laughing, Idle, Angry
    Choose facialExpression and animation that genuinely match the emotional tone of each message.
    Return ONLY the raw JSON array, no markdown, no code blocks.

    Conversation history: ${conversationHistory.join('\n')}
    User message: ${userMessage}
  `;

  const result = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
  });

  const text = result.choices[0]?.message?.content || '';
  const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  let messages = JSON.parse(jsonText);

  if (messages.messages) messages = messages.messages;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const fileName = `audios/message_${i}.mp3`;
    try {
      const generatedFile = await createAudioFileFromText(message.text, fileName);
      const jsonFile = await lipSyncMessage(generatedFile);
      message.audio = await audioFileToBase64(generatedFile);
      message.lipsync = await readJsonTranscript(jsonFile);
    } catch (error) {
      console.error('Error processing message:', error);
      message.audio = null;
      message.lipsync = null;
    }
  }

  conversationHistory = [
    ...conversationHistory,
    `User: ${userMessage}`,
    ...messages.map((m) => `Lisa: ${m.text}`),
  ].slice(-20);

  return messages;
};
