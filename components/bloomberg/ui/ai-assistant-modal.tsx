"use client";

import { useState, useEffect, useRef } from "react";
import { bloombergColors } from "../lib/theme-config";
import { BloombergButton } from "../core/bloomberg-button";
import { X, Send, Bot } from "lucide-react";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  marketData: any;
  cryptoData: any;
  commoditiesData: any;
  isDarkMode: boolean;
}

export function AIAssistantModal({
  isOpen,
  onClose,
  currentView,
  marketData,
  cryptoData,
  commoditiesData,
  isDarkMode,
}: AIAssistantModalProps) {
  const [mode, setMode] = useState<"context" | "free">("context");
  const [customPrompt, setCustomPrompt] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getContextForView = () => {
    const timestamp = new Date().toLocaleString();
    let context = `Bloomberg Terminal - ${currentView.toUpperCase()} - ${timestamp}\n\n`;

    if (currentView === "market" && marketData) {
      context += "MARKET OVERVIEW:\n";
      ["americas", "emea", "asiaPacific"].forEach((region) => {
        const items = marketData[region] || [];
        if (items.length > 0) {
          context += `\n${region.toUpperCase()}:\n`;
          items.slice(0, 5).forEach((item: any) => {
            const change = item.pctChange >= 0 ? `+${item.pctChange}` : item.pctChange;
            context += `  ${item.id}: ${item.value?.toLocaleString()} (${change}%)\n`;
          });
        }
      });
    }

    if (currentView === "crypto" && cryptoData?.assets) {
      context += "CRYPTO ASSETS:\n";
      cryptoData.assets.slice(0, 10).forEach((asset: any) => {
        const change = asset.changePct24h >= 0 ? `+${asset.changePct24h}` : asset.changePct24h;
        context += `  ${asset.symbol}: $${asset.price?.toLocaleString()} (${change}%)\n`;
      });
    }

    if (currentView === "commodities" && commoditiesData?.commodities) {
      context += "COMMODITIES:\n";
      commoditiesData.commodities.slice(0, 8).forEach((c: any) => {
        const change = c.changePct24h >= 0 ? `+${c.changePct24h}` : c.changePct24h;
        context += `  ${c.name}: $${c.price?.toLocaleString()}/oz (${change}%)\n`;
      });
    }

    if (currentView === "news") {
      context += "LATEST NEWS:\n(Consult the news view for recent headlines)\n";
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
    const encodedPrompt = encodeURIComponent(prompt);
    
    const deerFlowUrl = `http://192.168.2.2:2026?prompt=${encodedPrompt}`;
    const zeroClawUrl = `http://192.168.2.2:42617?prompt=${encodedPrompt}`;
    
    const openedWindow = window.open(deerFlowUrl, "_blank");
    if (!openedWindow || openedWindow.closed) {
      window.open(zeroClawUrl, "_blank");
    }
  };

  const contextPreview = getContextForView().slice(0, 500) + (getContextForView().length > 500 ? "..." : "");

  return (
    <dialog
      open={true}
      className="fixed inset-0 z-50 w-full h-full p-0 m-0 max-w-none max-h-none border-none bg-transparent overflow-hidden"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />

      <div className="relative w-full h-full flex items-center justify-center">
        <div
          ref={modalRef}
          className="w-[600px] max-h-[80vh] border-2 shadow-lg flex flex-col rounded-sm"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <div 
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: colors.border, backgroundColor: colors.header }}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-bold">AI ASSISTANT</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div 
            className="flex gap-4 px-4 py-3 border-b"
            style={{ borderColor: colors.border }}
          >
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="aimode"
                checked={mode === "context"}
                onChange={() => setMode("context")}
                className="accent-orange-500"
              />
              <span>Avec Contexte</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="aimode"
                checked={mode === "free"}
                onChange={() => setMode("free")}
                className="accent-orange-500"
              />
              <span>Libre</span>
            </label>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {mode === "context" && (
              <div className="mb-4">
                <label className="block text-xs font-bold mb-2" style={{ color: colors.textSecondary }}>
                  Contexte actuel:
                </label>
                <div 
                  className="p-3 rounded text-xs font-mono overflow-auto max-h-48"
                  style={{ backgroundColor: colors.background, color: colors.text }}
                >
                  <pre className="whitespace-pre-wrap">{contextPreview}</pre>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-bold mb-2" style={{ color: colors.textSecondary }}>
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
                className="w-full p-3 rounded text-sm font-mono h-32 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{ backgroundColor: colors.background, color: colors.text }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs" style={{ color: colors.textSecondary }}>Suggestions:</span>
              {mode === "context" ? (
                <>
                  <button
                    onClick={() => setCustomPrompt("Analyse la tendance generale du marche.")}
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: colors.border, color: colors.text }}
                  >
                    Analyse marche
                  </button>
                  <button
                    onClick={() => setCustomPrompt("Quel est le meilleur investissement actuellement?")}
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: colors.border, color: colors.text }}
                  >
                    Recommandation
                  </button>
                  <button
                    onClick={() => setCustomPrompt("Explique les mouvements du jour.")}
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: colors.border, color: colors.text }}
                  >
                    Mouvements
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCustomPrompt("Explain cryptocurrency to a beginner.")}
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: colors.border, color: colors.text }}
                  >
                    Crypto basics
                  </button>
                  <button
                    onClick={() => setCustomPrompt("What is dollar-cost averaging?")}
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: colors.border, color: colors.text }}
                  >
                    DCA strategy
                  </button>
                </>
              )}
            </div>
          </div>

          <div 
            className="px-4 py-3 border-t flex justify-end gap-2"
            style={{ borderColor: colors.border }}
          >
            <BloombergButton color="default" onClick={onClose}>
              ANNULER
            </BloombergButton>
            <BloombergButton 
              color="accent" 
              onClick={handleSend}
              className="flex items-center gap-1"
            >
<Send className="w-3 h-3" />
              ENVOYER A DEERFLOW
            </BloombergButton>
          </div>
        </div>
      </div>
    </dialog>
  );
}
