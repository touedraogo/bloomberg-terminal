"use client";

import { useState, useEffect, useRef } from "react";
import { bloombergColors } from "../lib/theme-config";
import { BloombergButton } from "../core/bloomberg-button";
import { X, Bot, Send, Loader2 } from "lucide-react";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  currentView: string;
  marketData: any;
  isDarkMode: boolean;
}

export function AIChatPanel({
  isOpen,
  onClose,
  initialPrompt,
  currentView,
  marketData,
  isDarkMode,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState(initialPrompt || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getContextForView = () => {
    let context = `Bloomberg Terminal - ${currentView.toUpperCase()}\n\n`;

    if (currentView === "market" && marketData) {
      context += "MARKET OVERVIEW:\n";
      ["americas", "emea", "asiaPacific"].forEach((region) => {
        const items = marketData[region] || [];
        if (items.length > 0) {
          context += `${region.toUpperCase()}:\n`;
          items.slice(0, 5).forEach((item: any) => {
            const change = item.pctChange >= 0 ? `+${item.pctChange}` : item.pctChange;
            context += `  ${item.id}: ${item.value?.toLocaleString()} (${change}%)\n`;
          });
        }
      });
    }

    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/deerflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          context: getContextForView(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response || "No response received" },
        ]);
      }
    } catch (err) {
      setError("Failed to connect to DeerFlow agent");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div
        className="relative w-full max-w-3xl h-[80vh] border-2 shadow-lg flex flex-col rounded-sm"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: colors.border, backgroundColor: colors.header }}
        >
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-bold">AI ASSISTANT (DeerFlow)</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-sm" style={{ color: colors.textSecondary }}>
              Ask me anything about the market data. Press Enter to send.
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block max-w-[80%] px-4 py-2 rounded text-sm ${
                  msg.role === "user"
                    ? "text-left"
                    : "text-left"
                }`}
                style={{
                  backgroundColor:
                    msg.role === "user" ? colors.accent : colors.background,
                  color: msg.role === "user" ? "#000" : colors.text,
                }}
              >
                <div className="font-bold text-xs mb-1">
                  {msg.role === "user" ? "YOU" : "DEERFLOW"}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>DeerFlow is thinking...</span>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">Error: {error}</div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="p-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the market data..."
              className="flex-1 p-3 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{ backgroundColor: colors.background, color: colors.text }}
              rows={2}
            />
            <BloombergButton color="accent" onClick={handleSend} disabled={isLoading}>
              <Send className="w-4 h-4" />
            </BloombergButton>
          </div>
        </div>
      </div>
    </div>
  );
}
