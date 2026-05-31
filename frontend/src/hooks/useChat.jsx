import { createContext, useContext, useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"; 

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (text) => {
    if (!text?.trim()) return;
    // Persist the user's turn in the visible transcript immediately
    setTranscript((prev) => [
      ...prev,
      { sender: "user", text, timestamp: new Date().toISOString() },
    ]);
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        // Drive the avatar playback queue
        setMessages((prevMessages) => [...prevMessages, ...data.messages]);
        // Append Lisa's turns to the persistent transcript
        setTranscript((prev) => [
          ...prev,
          ...data.messages.map((m) => ({
            sender: "bot",
            text: m.text,
            facialExpression: m.facialExpression,
            timestamp: new Date().toISOString(),
          })),
        ]);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setTranscript((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I couldn't reach you just now. Please try again in a moment.",
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avatarModel, setAvatarModel] = useState("default");
  const toggleAvatarModel = () =>
    setAvatarModel((m) => (m === "default" ? "swastik" : "default"));

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        transcript,
        onMessagePlayed,
        loading,
        avatarModel,
        toggleAvatarModel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
