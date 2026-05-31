import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useChat } from "../hooks/useChat";

const formatTime = (ts) => {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3 w-fit rounded-2xl rounded-tl-sm bg-calm-lisa dark:bg-calmd-lisa">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-calm-accent dark:bg-calmd-accent animate-typing"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);

export const ChatPanel = ({ isOpen, onClose }) => {
  const { transcript, loading } = useChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, loading, isOpen]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-40 bg-calm-surface dark:bg-calmd-surface border-l border-calm-border dark:border-calmd-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-calm-border dark:border-calmd-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-calm-accent dark:bg-calmd-accent" />
          <h2 className="font-semibold text-calm-ink dark:text-calmd-ink">Conversation with Lisa</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-calm-muted dark:text-calmd-muted hover:bg-calm-bg dark:hover:bg-calmd-bg transition-colors"
          aria-label="Close conversation"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {transcript.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-calm-muted dark:text-calmd-muted">
            <p className="text-calm-ink dark:text-calmd-ink font-medium mb-1">I'm here with you.</p>
            <p className="text-sm">Share whatever is on your mind — there's no rush.</p>
          </div>
        ) : (
          transcript.map((m, i) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={i}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 leading-relaxed ${
                    isUser
                      ? "bg-calm-user dark:bg-calmd-user text-calm-ink dark:text-calmd-ink rounded-2xl rounded-tr-sm"
                      : m.isError
                      ? "bg-red-50 text-red-700 rounded-2xl rounded-tl-sm"
                      : "bg-calm-lisa dark:bg-calmd-lisa text-calm-ink dark:text-calmd-ink rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[11px] text-calm-muted dark:text-calmd-muted mt-1 px-1">
                  {isUser ? "You" : "Lisa"} · {formatTime(m.timestamp)}
                </span>
              </div>
            );
          })
        )}
        {loading && (
          <div className="flex flex-col items-start">
            <TypingIndicator />
            <span className="text-[11px] text-calm-muted dark:text-calmd-muted mt-1 px-1">
              Lisa is typing…
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
