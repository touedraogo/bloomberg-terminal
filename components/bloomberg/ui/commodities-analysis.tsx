"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Send, X } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CommoditiesAnalysisProps {
  commoditiesData: unknown;
  isDarkMode: boolean;
}

export function CommoditiesAnalysis({ commoditiesData, isDarkMode }: CommoditiesAnalysisProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getContext = () => {
    if (!commoditiesData || typeof commoditiesData !== "object") return "";
    const data = commoditiesData as { commodities?: { name: string; price: number; changePct24h: number }[] };
    let ctx = "COMMODITIES PRICES:\n";
    const commodities = data.commodities || [];
    for (const c of commodities.slice(0, 10)) {
      const change = c.changePct24h >= 0 ? `+${c.changePct24h}` : `${c.changePct24h}`;
      ctx += `  ${c.name}: $${c.price?.toLocaleString()} (${change}%)\n`;
    }
    return ctx;
  };

  const analyzeCommodities = async () => {
    setIsLoading(true);
    setMessages([{ role: "user", content: "Analyse les tendances des matières premières" }]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Basé sur ces données:\n${getContext()}\n\nFournis une analyse du marché des matières premières en français.` }],
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.choices?.[0]?.message?.content || "No response" }]);
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
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.choices?.[0]?.message?.content || "No response" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur de connexion" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-bold text-white">AI - Analyse Commodities</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={analyzeCommodities}
            disabled={isLoading}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            ANALYSE
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              CLEAR
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
        {isLoading && messages.length === 0 ? (
          <Skeleton className="h-16 w-full" />
        ) : messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`text-sm p-3 rounded ${
                msg.role === "user"
                  ? "bg-orange-600 text-white text-right ml-16"
                  : "bg-gray-800 text-gray-200 mr-16 prose prose-sm prose-invert max-w-none"
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
          <p className="text-sm text-gray-400">Cliquez ANALYSE pour une analyse du marché des matières premières.</p>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && askQuestion()}
          placeholder="Posez une question sur les matières premières..."
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
  );
}
