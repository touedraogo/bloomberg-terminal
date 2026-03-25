"use client";

import { useQuery } from "@tanstack/react-query";
import { bloombergColors } from "../lib/theme-config";
import { useState, useEffect } from "react";
import { Sparkline } from "../ui/sparkline";

interface Commodity {
  id: string;
  name: string;
  symbol: string;
  price: number;
  unit: string;
  change24h: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  yearHigh: number;
  yearLow: number;
  sparkline: number[];
  lastUpdated: string;
}

interface CommoditiesViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

export default function CommoditiesView({ isDarkMode, onBack }: CommoditiesViewProps) {
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["commoditiesData"],
    queryFn: async () => {
      const response = await fetch("/api/commodities");
      if (!response.ok) throw new Error("Failed to fetch commodities data");
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  useEffect(() => {
    if (data?.commodities) {
      setCommodities(data.commodities);
    }
  }, [data]);

  const categories = [
    { id: "all", name: "All" },
    { id: "precious", name: "Precious Metals", symbols: ["GOLD", "SILVER", "PLATINUM", "PALLADIUM"] },
    { id: "base", name: "Base Metals", symbols: ["COPPER", "ALUMINIUM", "ZINC", "NICKEL", "TIN", "LEAD"] },
    { id: "strategic", name: "Strategic Metals", symbols: ["LITHIUM", "COBALT", "RARE_EARTH", "LITHIUM_HYDROXIDE", "MANGANESE"] },
    { id: "energy", name: "Energy", symbols: ["CRUDE_OIL", "BRENT", "NATURAL_GAS"] },
    { id: "agriculture", name: "Agriculture", symbols: ["WHEAT", "CORN", "SOYBEANS"] },
  ];

  const filteredCommodities = activeCategory === "all" 
    ? commodities 
    : commodities.filter(c => {
        const cat = categories.find(cat => cat.id === activeCategory);
        return cat?.symbols?.includes(c.id);
      });

  const handleRefresh = () => refetch();

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-pulse text-center">
          <p className="text-lg font-mono">Loading commodities data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-mono">Error loading commodities data</p>
        <button
          type="button"
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
            type="button"
            onClick={onBack}
            className="px-3 py-1 bg-bbg-secondary hover:bg-bbg-hover rounded text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">COMMODITIES</h1>
          <span className="text-sm text-gray-400">
            {data?.lastUpdated || new Date().toLocaleTimeString()}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-3 py-1 bg-bbg-secondary hover:bg-bbg-hover rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-2 border-b border-gray-700 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              activeCategory === cat.id 
                ? "bg-bbg-accent text-white" 
                : "bg-bbg-secondary hover:bg-bbg-hover"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm font-mono">
          <thead className="sticky top-0 bg-bbg-primary">
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left font-bold">COMMODITY</th>
              <th className="px-3 py-2 text-right font-bold">PRICE</th>
              <th className="px-3 py-2 text-right font-bold">24H CHANGE</th>
              <th className="px-3 py-2 text-right font-bold">24H RANGE</th>
              <th className="px-3 py-2 text-right font-bold">52W HIGH</th>
              <th className="px-3 py-2 text-right font-bold">52W LOW</th>
              <th className="px-3 py-2 text-center font-bold">CHART</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommodities.map((commodity) => (
              <tr
                key={commodity.id}
                className="border-b border-gray-800 hover:bg-bbg-hover"
              >
                <td className="px-3 py-2">
                  <div>
                    <span className="font-bold">{commodity.symbol}</span>
                    <span className="text-gray-400 ml-2 text-xs">{commodity.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-bold">
                  ${commodity.price.toLocaleString(undefined, {
                    minimumFractionDigits: commodity.price < 10 ? 4 : 2,
                    maximumFractionDigits: commodity.price < 10 ? 4 : 2,
                  })}
                  <span className="text-xs text-gray-400 ml-1">/{commodity.unit}</span>
                </td>
                <td
                  className={`px-3 py-2 text-right font-bold ${
                    commodity.changePct24h >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {commodity.changePct24h >= 0 ? "+" : ""}
                  {commodity.changePct24h.toFixed(2)}%
                  <span className="text-xs ml-1">
                    ({commodity.change24h >= 0 ? "+" : ""}${commodity.change24h.toFixed(2)})
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-400 text-xs">
                  {commodity.low24h.toFixed(2)} - {commodity.high24h.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right text-green-400 text-xs">
                  ${commodity.yearHigh.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right text-red-400 text-xs">
                  ${commodity.yearLow.toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <div className="w-24 h-8 mx-auto">
                    <Sparkline
                      data={commodity.sparkline}
                      color={
                        commodity.changePct24h >= 0
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
        {data?.source} | Auto-refresh: 30s | oz=ounce | MT=metric ton | bbl=barrel | bu=bushel
      </div>
    </div>
  );
}
