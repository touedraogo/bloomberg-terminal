"use client";

import { useState } from "react";
import { SwissPricesAnalysis } from "../ui/swiss-prices-analysis";

interface SwissPricesViewProps {
  isDarkMode: boolean;
  onBack?: () => void;
}

export function SwissPricesView({ isDarkMode, onBack }: SwissPricesViewProps) {
  const [iframeError, setIframeError] = useState(false);
  const bcvUrl = "https://www.bcv.ch/fr/home/informations-financieres/metaux-precieux.html";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-700 bg-bbg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1 bg-bbg-secondary hover:bg-bbg-hover rounded text-sm"
              >
                ← Back
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold">PRIX SUISSE (BCV)</h2>
              <p className="text-xs text-gray-400">
                Métaux précieux depuis BCV.ch
              </p>
            </div>
          </div>
          <a
            href={bcvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded text-xs bg-bbg-accent hover:bg-orange-600"
          >
            Ouvrir BCV ↗
          </a>
        </div>
      </div>

      {/* Embedded BCV Page - réduit pour laisser place à l'IA */}
      <div className="h-[50%] overflow-hidden bg-bbg-primary">
        {iframeError ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-gray-400 mb-4">
              BCV ne permet pas l&apos;intégration iframe.
            </p>
            <a
              href={bcvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-bbg-accent hover:bg-orange-600 rounded text-sm"
            >
              Ouvrir BCV dans une nouvelle fenêtre ↗
            </a>
          </div>
        ) : (
          <iframe
            src={bcvUrl}
            className="w-full h-full border-0"
            title="BCV Precious Metals Prices"
            sandbox="allow-scripts allow-forms"
            onError={() => setIframeError(true)}
          />
        )}
      </div>

      {/* AI Analysis Panel */}
      <div className="h-[50%] overflow-auto p-4">
        <SwissPricesAnalysis isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
