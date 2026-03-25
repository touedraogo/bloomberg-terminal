import { NextResponse } from "next/server";

// Commodities data - using realistic market prices
// In production, integrate with: Alpha Vantage, Metal Price API, or Yahoo Finance

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

// Realistic base prices (USD)
const baseCommodities: Omit<Commodity, "change24h" | "changePct24h" | "high24h" | "low24h" | "sparkline" | "lastUpdated">[] = [
  // Precious Metals
  { id: "GOLD", name: "Gold", symbol: "XAU", price: 2312.50, unit: "oz" },
  { id: "SILVER", name: "Silver", symbol: "XAG", price: 27.45, unit: "oz" },
  { id: "PLATINUM", name: "Platinum", symbol: "XPT", price: 985.00, unit: "oz" },
  { id: "PALLADIUM", name: "Palladium", symbol: "XPD", price: 1020.00, unit: "oz" },
  
  // Base Metals
  { id: "COPPER", name: "Copper", symbol: "HG", price: 4.25, unit: "lb" },
  { id: "ALUMINIUM", name: "Aluminum", symbol: "AL", price: 2420.00, unit: "MT" },
  { id: "ZINC", name: "Zinc", symbol: "ZN", price: 2850.00, unit: "MT" },
  { id: "NICKEL", name: "Nickel", symbol: "NI", price: 16800.00, unit: "MT" },
  { id: "TIN", name: "Tin", symbol: "SN", price: 28200.00, unit: "MT" },
  { id: "LEAD", name: "Lead", symbol: "PB", price: 2150.00, unit: "MT" },
  
  // Strategic Metals (Critical Minerals)
  { id: "LITHIUM", name: "Lithium Carbonate", symbol: "Li2CO3", price: 12500.00, unit: "MT" },
  { id: "COBALT", name: "Cobalt", symbol: "Co", price: 33500.00, unit: "MT" },
  { id: "RARE_EARTH", name: "Rare Earth Oxides", symbol: "REO", price: 145000.00, unit: "MT" },
  { id: "LITHIUM_HYDROXIDE", name: "Lithium Hydroxide", symbol: "LiOH", price: 18500.00, unit: "MT" },
  { id: "MANGANESE", name: "Manganese Ore", symbol: "Mn", price: 4.85, unit: "MTU" },
  
  // Energy
  { id: "CRUDE_OIL", name: "Crude Oil (WTI)", symbol: "CL", price: 78.50, unit: "bbl" },
  { id: "BRENT", name: "Brent Crude", symbol: "CO", price: 82.30, unit: "bbl" },
  { id: "NATURAL_GAS", name: "Natural Gas", symbol: "NG", price: 2.85, unit: "MMBtu" },
  
  // Agriculture
  { id: "WHEAT", name: "Wheat", symbol: "ZW", price: 568.00, unit: "bu" },
  { id: "CORN", name: "Corn", symbol: "ZC", price: 448.00, unit: "bu" },
  { id: "SOYBEANS", name: "Soybeans", symbol: "ZS", price: 1185.00, unit: "bu" },
];

function generateSparkline(basePrice: number) {
  const points: number[] = [];
  let value = basePrice;
  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - 0.5) * 0.02 * value;
    value += change;
    points.push(value);
  }
  // Normalize to 0-1
  const min = Math.min(...points);
  const max = Math.max(...points);
  return points.map(p => (p - min) / (max - min || 1));
}

function simulateCommodity(base: Omit<Commodity, "change24h" | "changePct24h" | "high24h" | "low24h" | "sparkline" | "lastUpdated">): Commodity {
  const changePct = (Math.random() - 0.5) * 2; // -1% to +1%
  const change = base.price * (changePct / 100);
  const price = base.price + change;
  const high = base.price * (1 + Math.random() * 0.015);
  const low = base.price * (1 - Math.random() * 0.015);
  
  return {
    ...base,
    price: Number(price.toFixed(base.price < 10 ? 4 : 2)),
    change24h: Number(change.toFixed(2)),
    changePct24h: Number(changePct.toFixed(2)),
    high24h: Number(high.toFixed(base.price < 10 ? 4 : 2)),
    low24h: Number(low.toFixed(base.price < 10 ? 4 : 2)),
    yearHigh: Number((base.price * 1.15).toFixed(base.price < 10 ? 4 : 2)),
    yearLow: Number((base.price * 0.85).toFixed(base.price < 10 ? 4 : 2)),
    sparkline: generateSparkline(base.price),
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const commodities = baseCommodities.map(simulateCommodity);
    
    return NextResponse.json({
      commodities,
      lastUpdated: new Date().toLocaleTimeString(),
      source: "Market Data (Simulated - Alpha Vantage integration pending)",
    });
  } catch (error) {
    console.error("Error in commodities GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities data" },
      { status: 500 }
    );
  }
}
