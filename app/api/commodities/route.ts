import { NextResponse } from "next/server";

// Realistic commodity prices (March 2026)
// Source: Market data (update manually or integrate AlphaVantage)

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

// Realistic base prices USD (March 2026)
const baseCommodities: Omit<Commodity, "change24h" | "changePct24h" | "high24h" | "low24h" | "sparkline" | "lastUpdated">[] = [
  // Precious Metals (USD/oz)
  { id: "GOLD", name: "Gold", symbol: "XAU", price: 3034.50, unit: "oz" },
  { id: "SILVER", name: "Silver", symbol: "XAG", price: 32.85, unit: "oz" },
  { id: "PLATINUM", name: "Platinum", symbol: "XPT", price: 978.00, unit: "oz" },
  { id: "PALLADIUM", name: "Palladium", symbol: "XPD", price: 1015.00, unit: "oz" },
  
  // Base Metals (USD/MT unless noted)
  { id: "COPPER", name: "Copper", symbol: "HG", price: 4.12, unit: "lb" },
  { id: "ALUMINIUM", name: "Aluminum", symbol: "AL", price: 2580.00, unit: "MT" },
  { id: "ZINC", name: "Zinc", symbol: "ZN", price: 2920.00, unit: "MT" },
  { id: "NICKEL", name: "Nickel", symbol: "NI", price: 16250.00, unit: "MT" },
  { id: "TIN", name: "Tin", symbol: "SN", price: 31200.00, unit: "MT" },
  { id: "LEAD", name: "Lead", symbol: "PB", price: 2180.00, unit: "MT" },
  
  // Strategic Minerals (Critical Minerals)
  { id: "LITHIUM", name: "Lithium Carbonate", symbol: "Li2CO3", price: 9800.00, unit: "MT" },
  { id: "COBALT", name: "Cobalt", symbol: "Co", price: 28500.00, unit: "MT" },
  { id: "RARE_EARTH", name: "Rare Earth Oxides", symbol: "REO", price: 138000.00, unit: "MT" },
  { id: "LITHIUM_HYDROXIDE", name: "Lithium Hydroxide", symbol: "LiOH", price: 14200.00, unit: "MT" },
  { id: "MANGANESE", name: "Manganese Ore", symbol: "Mn", price: 4.45, unit: "MTU" },
  
  // Energy (USD)
  { id: "CRUDE_OIL", name: "Crude Oil (WTI)", symbol: "CL", price: 71.85, unit: "bbl" },
  { id: "BRENT", name: "Brent Crude", symbol: "CO", price: 75.40, unit: "bbl" },
  { id: "NATURAL_GAS", name: "Natural Gas", symbol: "NG", price: 3.12, unit: "MMBtu" },
  
  // Agriculture (USD)
  { id: "WHEAT", name: "Wheat", symbol: "ZW", price: 548.00, unit: "bu" },
  { id: "CORN", name: "Corn", symbol: "ZC", price: 452.00, unit: "bu" },
  { id: "SOYBEANS", name: "Soybeans", symbol: "ZS", price: 1028.00, unit: "bu" },
];

function generateSparkline(basePrice: number) {
  const points: number[] = [];
  let value = basePrice;
  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - 0.5) * 0.01 * value;
    value += change;
    points.push(value);
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  return points.map(p => (p - min) / (max - min || 1));
}

function simulateCommodity(base: Omit<Commodity, "change24h" | "changePct24h" | "high24h" | "low24h" | "sparkline" | "lastUpdated">): Commodity {
  const changePct = (Math.random() - 0.5) * 1.5;
  const change = base.price * (changePct / 100);
  const price = base.price + change;
  const high = base.price * (1 + Math.random() * 0.01);
  const low = base.price * (1 - Math.random() * 0.01);
  
  return {
    ...base,
    price: Number(price.toFixed(base.price < 10 ? 4 : 2)),
    change24h: Number(change.toFixed(2)),
    changePct24h: Number(changePct.toFixed(2)),
    high24h: Number(high.toFixed(base.price < 10 ? 4 : 2)),
    low24h: Number(low.toFixed(base.price < 10 ? 4 : 2)),
    yearHigh: Number((base.price * 1.12).toFixed(base.price < 10 ? 4 : 2)),
    yearLow: Number((base.price * 0.88).toFixed(base.price < 10 ? 4 : 2)),
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
      source: "Market Data (Base prices March 2026)",
    });
  } catch (error) {
    console.error("Error in commodities GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities data" },
      { status: 500 }
    );
  }
}
