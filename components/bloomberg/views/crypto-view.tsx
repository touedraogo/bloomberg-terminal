"use client";

import { useQuery } from "@tanstack/react-query";
import { bloombergColors } from "../lib/theme-config";
import { useState, useEffect } from "react";
import { Sparkline } from "../ui/sparkline";
import { CryptoAnalysis } from "../ui/crypto-analysis";

interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  changePct24h: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
  lastUpdated: string;
}

interface CryptoViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

export default function CryptoView({ isDarkMode, onBack }: CryptoViewProps) {
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;
  const [cryptoData, setCryptoData] = useState<CryptoAsset[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cryptoData"],
    queryFn: async () => {
      const response = await fetch("/api/crypto-data");
      if (!response.ok) throw new Error("Failed to fetch crypto data");
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  useEffect(() => {
    if (data?.assets) {
      setCryptoData(data.assets);
    }
  }, [data]);

  const generateSparkline = () => {
    const points: number[] = [];
    let value = 0.5;
    for (let i = 0; i < 20; i++) {
      value += (Math.random() - 0.5) * 0.1;
      value = Math.max(0, Math.min(1, value));
      points.push(value);
    }
    return points;
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-pulse text-center">
          <p className="text-lg font-mono">Loading crypto data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-mono">Error loading crypto data</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-bbg-secondary rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-3 py-1 bg-bbg-secondary hover:bg-bbg-hover rounded text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">CRYPTO ASSETS</h1>
          <span className="text-sm text-gray-400">
            {data?.lastUpdated || new Date().toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-bbg-secondary hover:bg-bbg-hover rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm font-mono">
          <thead className="sticky top-0 bg-bbg-primary">
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left font-bold">ASSET</th>
              <th className="px-3 py-2 text-right font-bold">PRICE</th>
              <th className="px-3 py-2 text-right font-bold">24H CHANGE</th>
              <th className="px-3 py-2 text-right font-bold">24H VOLUME</th>
              <th className="px-3 py-2 text-right font-bold">MARKET CAP</th>
              <th className="px-3 py-2 text-center font-bold">7D CHART</th>
            </tr>
          </thead>
          <tbody>
            {cryptoData.map((asset) => (
              <tr
                key={asset.id}
                className="border-b border-gray-800 hover:bg-bbg-hover"
              >
                <td className="px-3 py-2">
                  <div>
                    <span className="font-bold">{asset.symbol}</span>
                    <span className="text-gray-400 ml-2">{asset.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-bold">
                  ${asset.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  className={`px-3 py-2 text-right font-bold ${
                    asset.changePct24h >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {asset.changePct24h >= 0 ? "+" : ""}
                  {asset.changePct24h.toFixed(2)}%
                  <span className="text-xs ml-1">
                    ({asset.change24h >= 0 ? "+" : ""}${asset.change24h.toFixed(2)})
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-400">
                  ${asset.volume24h.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right text-gray-400">
                  ${asset.marketCap.toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="w-24 h-8 mx-auto">
                    <Sparkline
                      data={asset.sparkline}
                      color={
                        asset.changePct24h >= 0
                          ? colors.positive
                          : colors.negative
                      }
                      width={96}
                      height={32}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
        Data source: Alpha Vantage | Auto-refresh: 30s
      </div>

      {/* AI Analysis */}
      <div className="px-4 pb-4">
        <CryptoAnalysis cryptoData={data} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
