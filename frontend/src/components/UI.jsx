import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { Vid } from "./VideoFeed";
import { Mic, MicOff } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"; 

export const UI = ({ hidden }) => {
  const input = useRef();
  const { chat, loading, message } = useChat();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [Camera, setCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg flex items-center justify-between">
          <div>
            <h1 className="font-black text-xl">Mental Health Counselor</h1>
            <p>Your Path to Mental Wellness</p>
          </div>

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
                    e.target.src = "";
                  }}
                />
              ) : (
                <div
                  className="w-10 h-10 flex items-center justify-center bg-gray-300 text-white rounded-full cursor-pointer"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "?"}
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

        <div className="w-full flex flex-col items-end justify-center gap-4">
          <button
            onClick={() => {
              const frame = vidRef.current;
              frame.style.display = Camera ? "none" : "block";
              setCamera(!Camera);
            }}
            className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md"
          >
            📷 Toggle Camera
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
          <input
            className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-100 bg-white"
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
            className={`p-4 rounded-md ${
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
            className={`bg-blue-500 hover:bg-blue-600 text-white p-4 px-10 font-semibold uppercase rounded-md ${
              loading || message ? "cursor-not-allowed opacity-30" : ""
            }`}
          >
            Send
          </button>
        </div>
      </div>
      <div id="Vid" ref={vidRef}>
        <Vid />
      </div>
    </>
  );
};
