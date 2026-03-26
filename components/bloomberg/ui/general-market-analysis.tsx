"use client";

import { useState } from "react";
import { RefreshCw, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MarketData } from "../types";

interface GeneralMarketAnalysisProps {
  marketData: MarketData;
  colors: {
    background: string;
    surface: string;
    text: string;
    border: string;
    accent: string;
    positive: string;
    negative: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function GeneralMarketAnalysis({ marketData, colors }: GeneralMarketAnalysisProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getContext = () => {
    if (!marketData) return "";
    let ctx = "DONNÉES DU MARCHÉ:\n";
    
    const allItems = [
      ...(marketData.americas || []),
      ...(marketData.emea || []),
      ...(marketData.asiaPacific || []),
    ];
    
    if (allItems.length > 0) {
      ctx += "\n📊 DONNÉES DE MARCHÉ:\n";
      allItems.slice(0, 15).forEach((item) => {
        const sign = item.change >= 0 ? "+" : "";
        ctx += `  ${item.id}: ${item.value?.toFixed(2)} (${sign}${item.pctChange?.toFixed(2)}%)\n`;
      });
    }
    
    return ctx;
  };

  const generateMarketOverview = async () => {
    setIsLoading(true);
    setMessages([{ role: "user", content: "Analyse les conditions actuelles du marché" }]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${getContext()}\n\nFournis un aperçu des conditions actuelles du marché en français, en te basant sur les données ci-dessus.` }],
          marketData: { fullMarketData: marketData },
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.choices?.[0]?.message?.content || "No response" },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur de connexion" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    const question = input;
    setInput("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${question}\n\nContexte:\n${getContext()}` }],
          marketData: { fullMarketData: marketData },
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.choices?.[0]?.message?.content || "No response" },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur de connexion" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="text-sm font-bold text-white">AI - Analyse Marché</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={generateMarketOverview}
            disabled={isLoading}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            MARCHÉ
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              CLEAR
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-3 min-h-0">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Analyse en cours...
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`text-sm p-3 rounded mb-2 ${
                msg.role === "user"
                  ? "bg-orange-600 text-white text-right ml-32"
                  : "bg-gray-800 text-gray-200 mr-32 prose prose-sm prose-invert max-w-none"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">
            Cliquez sur MARCHÉ pour générer une analyse IA des conditions actuelles du marché, ou posez une question ci-dessous.
          </p>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && askQuestion()}
            placeholder="Posez une question sur les tendances du marché..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={askQuestion}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
