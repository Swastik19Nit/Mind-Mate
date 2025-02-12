import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, MessageCircle } from 'lucide-react';

const ChatHistory = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response = await fetch('http://localhost:3000/chats', {
                credentials: 'include'
            });
            const data = await response.json();
            setChats(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching chats:', error);
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return format(new Date(date), 'MMM d, yyyy h:mm a');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (selectedChat) {
        return (
            <div className="p-4">
                <button
                    onClick={() => setSelectedChat(null)}
                    className="flex items-center text-blue-500 mb-4"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Chat List
                </button>
                <div className="space-y-4">
                    {selectedChat.messages.map((message, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg ${message.sender === 'user'
                                    ? 'bg-blue-100 ml-auto max-w-[80%]'
                                    : 'bg-gray-100 mr-auto max-w-[80%]'
                                }`}
                        >
                            <div className="font-semibold mb-1">
                                {message.sender === 'user' ? 'You' : 'Lisa'}
                            </div>
                            <div>{message.text}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {formatDate(message.timestamp)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Chat History</h2>
            <div className="space-y-4">
                {chats.length === 0 ? (
                    <div className="text-center text-gray-500">No chat history found</div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat._id}
                            onClick={() => setSelectedChat(chat)}
                            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
                                    <div>
                                        <div className="font-semibold">
                                            Chat Session
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Started: {formatDate(chat.startedAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {chat.messages.length} messages
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatHistory;