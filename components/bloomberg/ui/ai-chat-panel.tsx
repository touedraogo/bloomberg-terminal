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
  marketData: unknown;
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
  const [useContext, setUseContext] = useState(true);
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

    if (currentView === "market" && marketData && typeof marketData === "object") {
      const data = marketData as Record<string, { id: string; value: number; pctChange: number }[]>;
      context += "MARKET OVERVIEW:\n";
      const regions = ["americas", "emea", "asiaPacific"];
      for (const region of regions) {
        const items = data[region] || [];
        if (items.length > 0) {
          context += `${region.toUpperCase()}:\n`;
          for (const item of items.slice(0, 5)) {
            const change = item.pctChange >= 0 ? `+${item.pctChange}` : `${item.pctChange}`;
            context += `  ${item.id}: ${item.value?.toLocaleString()} (${change}%)\n`;
          }
        }
      }
    }

    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          marketData: useContext ? { context: getContextForView(), currentView } : undefined,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let fullResponse = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                fullResponse += parsed.choices[0].delta.content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullResponse || "No response" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to get AI response" },
      ]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-full max-w-2xl h-[70vh] border-2 shadow-xl flex flex-col rounded-sm"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: colors.border, backgroundColor: colors.header }}
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold">AI ASSISTANT</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-4 px-4 py-2 border-b" style={{ borderColor: colors.border }}>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={useContext}
              onChange={(e) => setUseContext(e.target.checked)}
              className="accent-orange-500"
            />
            <span>Inclure contexte marché</span>
          </label>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-xs py-8" style={{ color: colors.textSecondary }}>
              Tapez votre question et appuyez sur Entrée
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`${msg.role === "user" ? "text-right" : "text-left"}`}
            >
              <div
                className="inline-block max-w-[85%] px-3 py-2 rounded text-xs"
                style={{
                  backgroundColor: msg.role === "user" ? colors.accent : colors.background,
                  color: msg.role === "user" ? "#000" : colors.text,
                }}
              >
                <div className="font-bold mb-1" style={{ color: msg.role === "user" ? "#000" : colors.textSecondary }}>
                  {msg.role === "user" ? "VOUS" : "AI"}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyse en cours...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t" style={{ borderColor: colors.border }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={useContext ? "Question avec contexte marché..." : "Question libre..."}
              className="flex-1 px-3 py-2 rounded text-xs focus:outline-none focus:ring-1"
              style={{ backgroundColor: colors.background, color: colors.text }}
            />
            <BloombergButton color="accent" onClick={handleSend} disabled={isLoading}>
              <Send className="w-3 h-3" />
            </BloombergButton>
          </div>
        </div>
      </div>
    </div>
  );
}
