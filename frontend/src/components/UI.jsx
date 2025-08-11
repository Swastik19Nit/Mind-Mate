import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { Vid } from "./VideoFeed";
import { Mic, MicOff, History } from "lucide-react";
import ChatHistoryModal from "./ChatHistorySidebar";  // The file is still named ChatHistorySidebar.jsx but exports ChatHistoryModal

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
    fetch(`${apiUrl}/user`, {
      credentials: "include"
    })
      .then((res) => res.json())
      .then((userData) => {
        setUser(userData);
      })
      .catch((err) => console.error('Error fetching user:', err));
  }, []);

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message) {
      chat(text);
      input.current.value = "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);

    fetch(`${apiUrl}/logout`, { credentials: "include" })
      .then(() => {
        window.location.reload();
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChatHistory(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Chat History"
              >
                <History size={24} />
              </button>
              
              {user && (
                <div className="relative ml-4 pointer-events-auto">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="z-10 w-10 h-10 rounded-full cursor-pointer"
                      onClick={() => setShowMenu(!showMenu)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = ""; // Clear the broken image
                        e.target.style.display = "none"; // Hide the img element
                        // Show the fallback initial instead
                        e.target.parentElement.querySelector('.fallback-initial').style.display = "flex";
                      }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full cursor-pointer fallback-initial"
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-50">
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left hover:bg-gray-200"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Input Area */}
          <div className="flex-grow" />
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

      {/* Chat History Modal */}
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
