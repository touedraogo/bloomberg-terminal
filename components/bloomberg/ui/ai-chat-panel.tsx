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
  cryptoData: unknown;
  commoditiesData: unknown;
  isDarkMode: boolean;
}

export function AIChatPanel({
  isOpen,
  onClose,
  initialPrompt,
  currentView,
  marketData,
  cryptoData,
  commoditiesData,
  isDarkMode,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState(initialPrompt || "");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"context" | "free">("context");
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

  const getPrefilledPrompt = () => {
    const dataContext = getContextForView();
    return `Based on this data:\n${dataContext}\n\nProvide a brief market analysis and insights.`;
  };

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

    if (currentView === "crypto" && cryptoData && typeof cryptoData === "object") {
      const data = cryptoData as { assets?: { symbol: string; price: number; changePct24h: number }[] };
      context += "CRYPTO PRICES:\n";
      const assets = data.assets || [];
      for (const asset of assets.slice(0, 10)) {
        const change = asset.changePct24h >= 0 ? `+${asset.changePct24h}` : `${asset.changePct24h}`;
        context += `  ${asset.symbol}: $${asset.price?.toLocaleString()} (${change}%)\n`;
      }
    }

    if (currentView === "commodities" && commoditiesData && typeof commoditiesData === "object") {
      const data = commoditiesData as { commodities?: { name: string; price: number; changePct24h: number }[] };
      context += "COMMODITIES PRICES:\n";
      const commodities = data.commodities || [];
      for (const c of commodities.slice(0, 10)) {
        const change = c.changePct24h >= 0 ? `+${c.changePct24h}` : `${c.changePct24h}`;
        context += `  ${c.name}: $${c.price?.toLocaleString()} (${change}%)\n`;
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
          marketData: mode === "context" ? { context: getContextForView(), currentView } : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        const content = data.choices?.[0]?.message?.content || "No response";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content },
        ]);
      }
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

        {/* Mode Selection */}
        <div className="flex items-center gap-6 px-4 py-2 border-b" style={{ borderColor: colors.border }}>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="radio"
              name="aimode"
              checked={mode === "context"}
              onChange={() => {
                setMode("context");
                setInput(getPrefilledPrompt());
              }}
              className="accent-orange-500"
            />
            <span>Avec Contexte (pré-rempli)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="radio"
              name="aimode"
              checked={mode === "free"}
              onChange={() => {
                setMode("free");
                setInput("");
              }}
              className="accent-orange-500"
            />
            <span>Libre</span>
          </label>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-xs py-8" style={{ color: colors.textSecondary }}>
              {mode === "context" 
                ? "Le prompt est pré-rempli avec les données actuelles. Modifiez-le ou envoyez directement."
                : "Tapez votre question et appuyez sur Entrée."}
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
              placeholder={mode === "context" ? "Question avec contexte marché..." : "Question libre..."}
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
