"use client";

import { RefreshCw, Send } from "lucide-react";
import { useState } from "react";

interface SwissPricesAnalysisProps {
  isDarkMode: boolean;
}

export function SwissPricesAnalysis({ isDarkMode }: SwissPricesAnalysisProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const askQuestion = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const question = input;
    setInput("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          marketData: { context: "Swiss Precious Metals (BCV)", currentView: "swiss-prices" },
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
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💰</span>
        <h3 className="font-bold text-white">IA - Analyse BCV</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">
            Posez une question sur les métaux précieux ou le marché suisse...
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`text-sm p-2 rounded ${
                msg.role === "user"
                  ? "bg-orange-600 text-white text-right ml-16"
                  : "bg-gray-800 text-gray-200 mr-16"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {isLoading && (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Analyse en cours...
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && askQuestion()}
          placeholder="Question sur les métaux précieux..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={askQuestion}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
