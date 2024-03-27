# MindMate Backend

To start the backend server, follow these steps:

1. Install dependencies using Yarn:
    ```
    yarn
    ```

2. Download FFmpeg Build:
   - Download the FFmpeg build from the following link: [FFmpeg Build](https://drive.google.com/file/d/1c0sOb1EA_u7USQck8fTaQiCRJpEWEjLp/view?usp=sharing)
   
3. Extract FFmpeg Build:
   - Extract the downloaded FFmpeg build to a backend directory in your project.
4. Add OpenAI and ElevenLabs API keys to the .env.example file.
    - [OpenAI](https://openai.com) - Get your OpenAI API key by creating a account Here.
    - [Eleven Labs](https://www.eleven-labs.com) - Get your Eleven Labs API key by creating a account Here.
6. Start the backend server:
    ```
    yarn start
    ```
7. Go to (http://localhost:3000/voices) and get voice id of Rachel and paste it on code line 15 const voiceID = "" in index.js;

8. Save the file and Ready to Go!
