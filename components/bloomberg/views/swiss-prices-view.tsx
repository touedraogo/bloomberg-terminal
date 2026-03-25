"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface SwissMetal {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  buyPriceCHF: number;
  sellPriceCHF: number;
  unit: string;
  lastUpdated: string;
}

interface GoldBar {
  weight: string;
  buyPrice: number;
  sellPrice: number;
  certification: string;
}

interface Coin {
  name: string;
  buyPrice: number;
  sellPrice: number;
}

export function SwissPricesView() {
  const [activeTab, setActiveTab] = useState<"metals" | "bars" | "coins">("metals");

  const { data, isLoading, error } = useQuery({
    queryKey: ["swissPrices"],
    queryFn: async () => {
      const response = await fetch("/api/swiss-prices");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="p-4">Chargement des prix BCV...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Erreur de chargement</div>;
  }

  const { preciousMetals, goldBars, coins, lastUpdated, source, sourceUrl } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-700 bg-bbg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">PRIX SUISSE (BCV)</h2>
            <p className="text-xs text-gray-400">
              Source: {source} | Mis à jour: {lastUpdated}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-2 border-b border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("metals")}
          className={`px-3 py-1 rounded text-sm ${
            activeTab === "metals" ? "bg-bbg-accent text-white" : "bg-bbg-secondary"
          }`}
        >
          Métaux Précieux
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bars")}
          className={`px-3 py-1 rounded text-sm ${
            activeTab === "bars" ? "bg-bbg-accent text-white" : "bg-bbg-secondary"
          }`}
        >
          Lingots Or ESG
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coins")}
          className={`px-3 py-1 rounded text-sm ${
            activeTab === "coins" ? "bg-bbg-accent text-white" : "bg-bbg-secondary"
          }`}
        >
          Pièces
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "metals" && (
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-2">Métal</th>
                <th className="text-right py-2 px-2">Achat USD/oz</th>
                <th className="text-right py-2 px-2">Vente USD/oz</th>
                <th className="text-right py-2 px-2">Achat CHF/kg</th>
                <th className="text-right py-2 px-2">Vente CHF/kg</th>
              </tr>
            </thead>
            <tbody>
              {preciousMetals.map((metal) => (
                <tr key={metal.id} className="border-b border-gray-800 hover:bg-bbg-hover">
                  <td className="py-2 px-2 font-bold">{metal.name}</td>
                  <td className="py-2 px-2 text-right text-green-400">
                    ${metal.buyPrice.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right text-red-400">
                    ${metal.sellPrice.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right text-green-400">
                    CHF {metal.buyPriceCHF.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right text-red-400">
                    CHF {metal.sellPriceCHF.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "bars" && (
          <div>
            <h3 className="text-md font-bold mb-2">Lingots et Plaquettes Or ESG</h3>
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 px-2">Poids</th>
                  <th className="text-left py-2 px-2">Certification</th>
                  <th className="text-right py-2 px-2">Achat CHF</th>
                  <th className="text-right py-2 px-2">Vente CHF</th>
                </tr>
              </thead>
              <tbody>
                {goldBars.map((bar, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-bbg-hover">
                    <td className="py-2 px-2 font-bold">{bar.weight}</td>
                    <td className="py-2 px-2 text-gray-400">{bar.certification}</td>
                    <td className="py-2 px-2 text-right text-green-400">
                      CHF {bar.buyPrice.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right text-red-400">
                      CHF {bar.sellPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "coins" && (
          <div>
            <h3 className="text-md font-bold mb-2">Pièces d'Or</h3>
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 px-2">Pièce</th>
                  <th className="text-right py-2 px-2">Achat CHF</th>
                  <th className="text-right py-2 px-2">Vente CHF</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-bbg-hover">
                    <td className="py-2 px-2 font-bold">{coin.name}</td>
                    <td className="py-2 px-2 text-right text-green-400">
                      CHF {coin.buyPrice.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right text-red-400">
                      CHF {coin.sellPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Source: {sourceUrl}
        </a>
      </div>
    </div>
  );
}
