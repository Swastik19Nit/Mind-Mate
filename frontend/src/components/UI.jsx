import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { Vid } from "./VideoFeed";
import {
  Mic,
  MicOff,
  History,
  LogOut,
  User,
  Send,
  Camera as CameraIcon,
  MessageCircle,
  Sun,
  Moon,
} from "lucide-react";
import ChatHistoryModal from "./ChatHistorySidebar";
import { ChatPanel } from "./ChatPanel";
import { useTheme } from "../hooks/useTheme";

const SUGGESTED_PROMPTS = [
  "I've been feeling anxious lately",
  "I can't sleep well",
  "I just need someone to talk to",
];

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"; 

export const UI = ({ hidden }) => {
  const input = useRef();
  const { chat, loading, message, transcript, avatarModel, toggleAvatarModel } =
    useChat();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [Camera, setCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
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
      setShowChatPanel(true);
    }
  };

  const sendPrompt = (text) => {
    if (!loading && !message) {
      chat(text);
      setShowChatPanel(true);
    }
  };

  const handleLogout = () => {
    fetch(`${apiUrl}/logout`, { credentials: "include" })
      .then(() => {
        localStorage.clear();
        window.location.replace("/");
      })
      .catch(err => {
        console.error("Logout failed:", err);
        localStorage.clear();
        window.location.replace("/");
      });
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-transparent z-10">
        <div className="w-full h-full flex flex-col p-4">
          {/* Top Bar */}
          <div className="w-full bg-calm-surface dark:bg-calmd-surface border border-calm-border dark:border-calmd-border p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h1 className="font-black text-xl text-calm-ink dark:text-calmd-ink">Mind-Mate</h1>
              <p className="text-sm text-calm-muted dark:text-calmd-muted">Your path to mental wellness</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Avatar toggle */}
              <button
                onClick={toggleAvatarModel}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border border-calm-border dark:border-calmd-border hover:border-calm-accent dark:hover:border-calmd-accent text-calm-ink dark:text-calmd-ink bg-calm-bg dark:bg-calmd-bg"
                title="Switch avatar"
              >
                <span>{avatarModel === "swastik" ? "🧑 Swastik's version" : "🤖 Lisa"}</span>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-calm-ink dark:text-calmd-ink hover:bg-calm-bg dark:hover:bg-calmd-bg transition-colors"
                title={theme === "dark" ? "Switch to light" : "Switch to dark"}
              >
                {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
              </button>

              <button
                onClick={() => setShowChatPanel((v) => !v)}
                className="p-2 rounded-full text-calm-ink dark:text-calmd-ink hover:bg-calm-bg dark:hover:bg-calmd-bg transition-colors"
                title="Conversation"
              >
                <MessageCircle size={22} />
              </button>

              <button
                onClick={() => setShowChatHistory(true)}
                className="p-2 rounded-full text-calm-ink dark:text-calmd-ink hover:bg-calm-bg dark:hover:bg-calmd-bg transition-colors"
                title="Chat History"
              >
                <History size={22} />
              </button>

              {user && (
                <div className="profile-menu relative">
                  <div
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-calm-bg dark:hover:bg-calmd-bg rounded-lg"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <div className="w-8 h-8 rounded-full bg-calm-accent dark:bg-calmd-accent flex items-center justify-center text-white">
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
                    <span className="font-medium text-calm-ink dark:text-calmd-ink">{user.name || user.email}</span>
                  </div>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-calm-surface dark:bg-calmd-surface rounded-xl shadow-lg border border-calm-border dark:border-calmd-border overflow-hidden">
                      <div className="p-3 border-b border-calm-border dark:border-calmd-border">
                        <p className="font-medium text-calm-ink dark:text-calmd-ink">{user.name}</p>
                        <p className="text-sm text-calm-muted dark:text-calmd-muted">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-calm-bg dark:hover:bg-calmd-bg flex items-center gap-2"
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

          {/* Spacer — avatar (Canvas) shows through here */}
          <div className="flex-grow" />

          {/* Input Area */}
          <div className="w-full max-w-screen-sm mx-auto">
            {/* Suggested prompts — only before the conversation starts */}
            {transcript.length === 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendPrompt(p)}
                    disabled={loading || message}
                    className="px-4 py-2 text-sm rounded-full bg-calm-surface dark:bg-calmd-surface border border-calm-border dark:border-calmd-border text-calm-ink dark:text-calmd-ink hover:border-calm-accent dark:hover:border-calmd-accent shadow-sm transition-colors disabled:opacity-40"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 bg-calm-surface dark:bg-calmd-surface border border-calm-border dark:border-calmd-border rounded-full shadow-sm px-2 py-2">
              <input
                className="flex-1 bg-transparent px-4 py-2 text-calm-ink dark:text-calmd-ink placeholder:text-calm-muted dark:placeholder:text-calmd-muted focus:outline-none"
                placeholder="Type a message…"
                ref={input}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />
              {/* Camera toggle */}
              <button
                onClick={() => {
                  const frame = vidRef.current;
                  frame.style.display = Camera ? "none" : "block";
                  setCamera(!Camera);
                }}
                className="p-2.5 rounded-full text-calm-muted dark:text-calmd-muted hover:bg-calm-bg dark:hover:bg-calmd-bg hover:text-calm-accent dark:hover:text-calmd-accent transition-colors"
                title="Toggle camera"
              >
                <CameraIcon size={20} />
              </button>
              {/* Mic toggle */}
              <button
                onClick={toggleRecording}
                className={`p-2.5 rounded-full transition-colors ${
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "text-calm-muted dark:text-calmd-muted hover:bg-calm-bg dark:hover:bg-calmd-bg hover:text-calm-accent dark:hover:text-calmd-accent"
                }`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              {/* Send */}
              <button
                disabled={loading || message}
                onClick={sendMessage}
                className={`p-2.5 rounded-full bg-calm-accent dark:bg-calmd-accent text-white hover:bg-calm-accent-hover dark:hover:bg-calmd-accent-hover transition-colors ${
                  loading || message ? "cursor-not-allowed opacity-40" : ""
                }`}
                title="Send"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChatPanel
        isOpen={showChatPanel}
        onClose={() => setShowChatPanel(false)}
      />

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
