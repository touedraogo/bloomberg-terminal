"use client";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@ai-sdk/react";
import { RefreshCw, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BloombergButton } from "../core/bloomberg-button";
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

export function GeneralMarketAnalysis({ marketData, colors }: GeneralMarketAnalysisProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } =
    useChat({
      api: "/api/ai",
      body: {
        marketData: {
          fullMarketData: marketData,
        },
      },
      id: "general-market-analysis",
    });

  const generateMarketOverview = () => {
    setMessages([
      {
        id: "system-1",
        role: "system",
        content: "Tu es un analyste financier IA. Fournis un bref aperçu du marché en français.",
      },
      {
        id: "user-1",
        role: "user",
        content:
          "Fournis un bref aperçu des conditions actuelles du marché basées sur les données fournies, en français.",
      },
    ]);
  };

  const clearChat = () => {
    setMessages([]);
  };

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
          <Skeleton className="h-16 w-full" />
        ) : error ? (
          <div className="bg-red-900/50 text-red-200 p-3 rounded text-sm">
            Erreur: {error.message}. Veuillez réessayer.
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
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
            placeholder="Posez une question sur les tendances du marché..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
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
