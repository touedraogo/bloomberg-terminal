"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Send, X } from "lucide-react";
import { useState } from "react";
import { BloombergButton } from "../core/bloomberg-button";
import { bloombergColors } from "../lib/theme-config";

interface CryptoAnalysisProps {
  cryptoData: unknown;
  isDarkMode: boolean;
}

export function CryptoAnalysis({ cryptoData, isDarkMode }: CryptoAnalysisProps) {
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getContext = () => {
    if (!cryptoData || typeof cryptoData !== "object") return "";
    const data = cryptoData as { assets?: { symbol: string; price: number; changePct24h: number }[] };
    let ctx = "CRYPTO PRICES:\n";
    const assets = data.assets || [];
    for (const asset of assets.slice(0, 10)) {
      const change = asset.changePct24h >= 0 ? `+${asset.changePct24h}` : `${asset.changePct24h}`;
      ctx += `  ${asset.symbol}: $${asset.price?.toLocaleString()} (${change}%)\n`;
    }
    return ctx;
  };

  const analyzeCrypto = async () => {
    setIsLoading(true);
    setMessages([{ role: "user", content: "Analyse les tendances crypto actuelles" }]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Basé sur ces données crypto:\n${getContext()}\n\nFournis une analyse du marché crypto en français.` }],
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
          messages: [{ role: "user", content: `${question}\n\nContexte crypto:\n${getContext()}` }],
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
    <div className="p-4 border rounded-sm mt-4" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold">AI CRYPTO ANALYSIS</h3>
        <div className="flex gap-2">
          <BloombergButton color="accent" onClick={analyzeCrypto} disabled={isLoading} className="flex items-center gap-1 text-xs">
            <RefreshCw className="h-3 w-3" />
            ANALYSE
          </BloombergButton>
          {messages.length > 0 && (
            <BloombergButton color="red" onClick={() => setMessages([])} className="flex items-center gap-1 text-xs">
              <X className="h-3 w-3" />
              CLEAR
            </BloombergButton>
          )}
        </div>
      </div>

      <div className="p-3 mb-4 border rounded-sm text-xs" style={{ borderColor: colors.border, backgroundColor: colors.background, minHeight: "80px" }}>
        {isLoading && messages.length === 0 ? (
          <Skeleton className="h-16 w-full" />
        ) : messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "text-right" : ""}>
                <span className="font-bold">{msg.role === "user" ? "VOUS: " : "AI: "}</span>
                <span>{msg.content}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Cliquez ANALYSE pour une analyse du marché crypto.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          placeholder="Posez une question sur le marché crypto..."
          className="flex-1 px-3 py-2 text-xs rounded-sm border"
          style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
        />
        <BloombergButton color="accent" onClick={askQuestion} disabled={isLoading || !input.trim()}>
          <Send className="h-3 w-3" />
        </BloombergButton>
      </div>
    </div>
  );
}
