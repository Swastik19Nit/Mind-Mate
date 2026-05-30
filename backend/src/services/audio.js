import { exec } from 'child_process';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { PassThrough } from 'stream';
import { ElevenLabsClient } from 'elevenlabs';

const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
const RHUBARB_PATH = process.env.RHUBARB_PATH || './bin/rhubarb';

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

const execCommand = (command) =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });

export const createAudioFileFromText = async (text, fileName) => {
  const voiceData = await client.voices.get(VOICE_ID);
  if (!voiceData) throw new Error('Voice not found');

  const audioResponse = await client.textToSpeech.convert(VOICE_ID, {
    output_format: 'mp3_44100_128',
    text,
    modelId: 'eleven_monolingual_v2',
  });

  return new Promise((resolve, reject) => {
    if (!(audioResponse instanceof PassThrough)) {
      return reject(new Error('Audio response is not a stream'));
    }
    const fileStream = createWriteStream(fileName);
    audioResponse.pipe(fileStream);
    fileStream.on('finish', () => resolve(fileName));
    fileStream.on('error', reject);
  });
};

export const lipSyncMessage = async (fileName) => {
  const wavFile = fileName.replace('.mp3', '.wav');
  const jsonFile = fileName.replace('.mp3', '.json');
  await execCommand(`ffmpeg -y -i ${fileName} ${wavFile}`);
  await execCommand(`${RHUBARB_PATH} -f json -o ${jsonFile} ${wavFile} -r phonetic`);
  return jsonFile;
};

export const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, 'utf8');
  return JSON.parse(data);
};

export const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString('base64');
};
