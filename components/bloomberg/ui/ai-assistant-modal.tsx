"use client";

import { useState } from "react";
import { bloombergColors } from "../lib/theme-config";
import { X, Send, ChevronDown } from "lucide-react";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  marketData: any;
  cryptoData: any;
  commoditiesData: any;
}

export function AIAssistantModal({
  isOpen,
  onClose,
  currentView,
  marketData,
  cryptoData,
  commoditiesData,
}: AIAssistantModalProps) {
  const [mode, setMode] = useState<"context" | "free">("context");
  const [customPrompt, setCustomPrompt] = useState("");

  if (!isOpen) return null;

  const getContextForView = () => {
    const timestamp = new Date().toLocaleString();
    let context = `Bloomberg Terminal - ${currentView.toUpperCase()} - ${timestamp}\n\n`;

    if (currentView === "market" && marketData) {
      context += "📊 MARKET OVERVIEW:\n";
      ["americas", "emea", "asiaPacific"].forEach((region) => {
        const items = marketData[region] || [];
        if (items.length > 0) {
          context += `\n${region.toUpperCase()}:\n`;
          items.slice(0, 5).forEach((item: any) => {
            const change = item.pctChange >= 0 ? `+${item.pctChange}` : item.pctChange;
            context += `• ${item.id}: ${item.value?.toLocaleString()} (${change}%)\n`;
          });
        }
      });
    }

    if (currentView === "crypto" && cryptoData?.assets) {
      context += "💰 CRYPTO ASSETS:\n";
      cryptoData.assets.slice(0, 10).forEach((asset: any) => {
        const change = asset.changePct24h >= 0 ? `+${asset.changePct24h}` : asset.changePct24h;
        context += `• ${asset.symbol}: $${asset.price?.toLocaleString()} (${change}%)\n`;
      });
    }

    if (currentView === "commodities" && commoditiesData?.commodities) {
      context += "📈 COMMODITIES:\n";
      commoditiesData.commodities.slice(0, 8).forEach((c: any) => {
        const change = c.changePct24h >= 0 ? `+${c.changePct24h}` : c.changePct24h;
        context += `• ${c.name}: $${c.price?.toLocaleString()}/oz (${change}%)\n`;
      });
    }

    if (currentView === "news") {
      context += "📰 LATEST NEWS:\n";
      context += "(See news view for recent headlines)\n";
    }

    return context;
  };

  const getFullPrompt = () => {
    if (mode === "free") {
      return customPrompt;
    }

    const context = getContextForView();
    return `${context}\n\n---\n\nUser request: ${customPrompt || "Analyse this data and provide insights."}`;
  };

  const handleSend = () => {
    const prompt = getFullPrompt();
    
    // Encode for URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Try to open ZeroClaw/Hermes via deep link
    // This will work if the agent supports deep links
    const deepLink = `zeroclaw://ask?prompt=${encodedPrompt}`;
    
    // Also try HTTP to local agent
    const localAgentUrl = `http://localhost:8081/chat`;
    
    // Try ZeroClaw (default port 4096)
    const zeroClawUrl = `http://localhost:4096/ask?prompt=${encodedPrompt}`;
    
    // Open the most likely agent
    window.open(zeroClawUrl, "_blank");
  };

  const contextPreview = getContextForView().slice(0, 500) + (getContextForView().length > 500 ? "..." : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div 
        className="w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl flex flex-col"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-bold">AI ASSISTANT</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "context"}
                onChange={() => setMode("context")}
                className="accent-green-500"
              />
              <span className="text-sm">Avec Contexte</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "free"}
                onChange={() => setMode("free")}
                className="accent-green-500"
              />
              <span className="text-sm">Libre</span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {mode === "context" && (
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Contexte actuel:
              </label>
              <div 
                className="p-3 rounded text-xs font-mono overflow-auto max-h-48"
                style={{ backgroundColor: "#0a0a0a" }}
              >
                <pre className="whitespace-pre-wrap">{contextPreview}</pre>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2 text-gray-400">
              Votre question:
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                mode === "context"
                  ? "Que pensez-vous de cette tendance? Analyse les données..."
                  : "Posez votre question à l'agent IA..."
              }
              className="w-full p-3 rounded text-sm font-mono h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ backgroundColor: "#0a0a0a" }}
            />
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Suggestions:</span>
            {mode === "context" && (
              <>
                <button
                  onClick={() => setCustomPrompt("Analyse la tendance générale du marché.")}
                  className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                >
                  Analyse marché
                </button>
                <button
                  onClick={() => setCustomPrompt("Quel est le meilleur investissement actuellement?")}
                  className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                >
                  Recommandation
                </button>
                <button
                  onClick={() => setCustomPrompt("Explique les mouvements du jour.")}
                  className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                >
                  Mouvements
                </button>
              </>
            )}
            {mode === "free" && (
              <>
                <button
                  onClick={() => setCustomPrompt("Explain cryptocurrency to a beginner.")}
                  className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                >
                  Crypto basics
                </button>
                <button
                  onClick={() => setCustomPrompt("What is dollar-cost averaging?")}
                  className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                >
                  DCA strategy
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-700 rounded hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={mode === "context" && !customPrompt}
            className="px-4 py-2 text-sm bg-green-700 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer à ZeroClaw
          </button>
        </div>
      </div>
    </div>
  );
}
