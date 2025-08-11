import { createContext, useContext, useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"; 

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(prevMessages => [...prevMessages, ...data.messages]);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

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
        onMessagePlayed,
        loading,
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
