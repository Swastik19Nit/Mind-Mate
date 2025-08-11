import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ChatHistoryModal = ({ isOpen, onClose }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  const fetchChats = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/chats`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      setChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
    return () => {
      // Cleanup when modal closes
      setChats([]);
      setSelectedChat(null);
      setError(null);
    };
  }, [isOpen]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white rounded-lg w-[90%] max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Chat History</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading chats...</p>
            </div>
          ) : selectedChat ? (
            <div>
              <button
                onClick={() => setSelectedChat(null)}
                className="mb-4 text-blue-500 hover:text-blue-600 flex items-center gap-2"
              >
                ← Back to Chat List
              </button>
              <div className="space-y-4">
                {selectedChat.messages?.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-100 ml-auto'
                        : 'bg-gray-100'
                    } max-w-[80%]`}
                  >
                    <div className="font-semibold mb-1">
                      {message.sender === 'user' ? 'You' : 'Lisa'}
                    </div>
                    <div>{message.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {chats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No chat history found
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <MessageCircle size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Chat Session</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(chat.startedAt)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {chat.messages?.length || 0} messages
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryModal;