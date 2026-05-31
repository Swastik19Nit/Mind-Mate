import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, ChevronLeft } from 'lucide-react';

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

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-calm-ink/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-calm-surface dark:bg-calmd-surface rounded-2xl w-[90%] max-w-3xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-calm-border dark:border-calmd-border">
          <h2 className="text-xl font-semibold text-calm-ink dark:text-calmd-ink">Chat History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-calm-bg dark:hover:bg-calmd-bg rounded-full text-calm-muted dark:text-calmd-muted transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-calm-accent dark:border-calmd-accent mx-auto"></div>
              <p className="mt-2 text-calm-muted dark:text-calmd-muted">Loading chats…</p>
            </div>
          ) : selectedChat ? (
            <div>
              <button
                onClick={() => setSelectedChat(null)}
                className="mb-4 text-calm-accent dark:text-calmd-accent hover:text-calm-accent-hover dark:hover:text-calmd-accent-hover flex items-center gap-2 font-medium"
              >
                <ChevronLeft size={18} /> Back to all conversations
              </button>
              <div className="space-y-4">
                {selectedChat.messages?.map((message, index) => {
                  const isUser = message.sender === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 text-calm-ink dark:text-calmd-ink leading-relaxed ${
                          isUser
                            ? "bg-calm-user dark:bg-calmd-user rounded-2xl rounded-tr-sm"
                            : "bg-calm-lisa dark:bg-calmd-lisa rounded-2xl rounded-tl-sm"
                        }`}
                      >
                        {message.text}
                      </div>
                      <span className="text-[11px] text-calm-muted dark:text-calmd-muted mt-1 px-1">
                        {isUser ? "You" : "Lisa"}
                        {message.timestamp ? ` · ${formatTime(message.timestamp)}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {chats.length === 0 ? (
                <div className="text-center py-8 text-calm-muted dark:text-calmd-muted">
                  No chat history found
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className="border border-calm-border dark:border-calmd-border rounded-xl p-4 cursor-pointer hover:bg-calm-bg dark:hover:bg-calmd-bg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-calm-lisa dark:bg-calmd-lisa rounded-full">
                        <MessageCircle size={20} className="text-calm-accent dark:text-calmd-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-calm-ink dark:text-calmd-ink">Chat Session</div>
                        <div className="text-sm text-calm-muted dark:text-calmd-muted">
                          {formatDate(chat.startedAt)}
                        </div>
                        <div className="text-sm text-calm-muted dark:text-calmd-muted">
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