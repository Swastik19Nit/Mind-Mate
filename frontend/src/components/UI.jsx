import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { Vid } from "./VideoFeed";
import { Mic, MicOff, History, LogOut, User } from "lucide-react";
import ChatHistoryModal from "./ChatHistorySidebar";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"; 

export const UI = ({ hidden }) => {
  const input = useRef();
  const { chat, loading, message } = useChat();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [Camera, setCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const vidRef = useRef();

  // Speech recognition setup
  const recognition = useRef(null);
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        input.current.value = transcript;
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognition.current?.stop();
    } else {
      recognition.current?.start();
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    // Fetch user data when component mounts
    fetch(`${apiUrl}/user`, { credentials: "include" })
      .then((res) => res.json())
      .then((userData) => {
        setUser(userData);
      })
      .catch((err) => console.error('Error fetching user:', err));

    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.profile-menu')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message) {
      chat(text);
      input.current.value = "";
    }
  };

  const handleLogout = () => {
    fetch(`${apiUrl}/logout`, { credentials: "include" })
      .then(() => {
        localStorage.removeItem("user");
        window.location.href = "/";
      })
      .catch(err => console.error("Logout failed:", err));
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-transparent z-10">
        <div className="w-full h-full flex flex-col p-4">
          {/* Top Bar */}
          <div className="w-full backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <h1 className="font-black text-xl">Mental Health Counselor</h1>
              <p>Your Path to Mental Wellness</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowChatHistory(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Chat History"
              >
                <History size={24} />
              </button>
              
              {user && (
                <div className="profile-menu relative">
                  <div
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-lg"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt="Profile"
                          className="w-full h-full rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <span className="font-medium">{user.name || user.email}</span>
                  </div>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border overflow-hidden">
                      <div className="p-3 border-b">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-grow" />

          {/* Input Area */}
          <div className="w-full max-w-screen-sm mx-auto flex items-center gap-2">
            <input
              className="flex-1 placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-white shadow-lg"
              placeholder="Type a message..."
              ref={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            <button
              onClick={toggleRecording}
              className={`p-4 rounded-md shadow-lg ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button
              disabled={loading || message}
              onClick={sendMessage}
              className={`bg-blue-500 hover:bg-blue-600 text-white p-4 px-10 font-semibold uppercase rounded-md shadow-lg ${
                loading || message ? "cursor-not-allowed opacity-30" : ""
              }`}
            >
              Send
            </button>
            <button
              onClick={() => {
                const frame = vidRef.current;
                frame.style.display = Camera ? "none" : "block";
                setCamera(!Camera);
              }}
              className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md shadow-lg"
            >
              📷
            </button>
          </div>
        </div>
      </div>

      <ChatHistoryModal 
        isOpen={showChatHistory} 
        onClose={() => setShowChatHistory(false)} 
      />
      
      <div id="Vid" ref={vidRef} className="fixed bottom-0 right-0 m-[50px] z-20">
        <Vid />
      </div>
    </>
  );
};
