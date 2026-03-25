import { NextResponse } from "next/server";

// Simulated crypto data (in production, use Alpha Vantage Crypto API)
const defaultCryptoAssets = [
  {
    id: "BTC",
    name: "Bitcoin",
    symbol: "BTC",
    price: 67432.18,
    change24h: 1243.56,
    changePct24h: 1.88,
    volume24h: 28500000000,
    marketCap: 1320000000000,
  },
  {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    price: 3524.67,
    change24h: -45.23,
    changePct24h: -1.27,
    volume24h: 15200000000,
    marketCap: 423000000000,
  },
  {
    id: "BNB",
    name: "Binance Coin",
    symbol: "BNB",
    price: 584.32,
    change24h: 8.45,
    changePct24h: 1.47,
    volume24h: 1850000000,
    marketCap: 87200000000,
  },
  {
    id: "SOL",
    name: "Solana",
    symbol: "SOL",
    price: 172.89,
    change24h: 12.34,
    changePct24h: 7.68,
    volume24h: 3420000000,
    marketCap: 78200000000,
  },
  {
    id: "XRP",
    name: "Ripple",
    symbol: "XRP",
    price: 0.5234,
    change24h: -0.0123,
    changePct24h: -2.30,
    volume24h: 1120000000,
    marketCap: 28500000000,
  },
  {
    id: "ADA",
    name: "Cardano",
    symbol: "ADA",
    price: 0.4521,
    change24h: 0.0234,
    changePct24h: 5.46,
    volume24h: 456000000,
    marketCap: 16000000000,
  },
  {
    id: "DOGE",
    name: "Dogecoin",
    symbol: "DOGE",
    price: 0.1234,
    change24h: 0.0089,
    changePct24h: 7.78,
    volume24h: 890000000,
    marketCap: 17600000000,
  },
  {
    id: "DOT",
    name: "Polkadot",
    symbol: "DOT",
    price: 7.23,
    change24h: -0.15,
    changePct24h: -2.03,
    volume24h: 234000000,
    marketCap: 9800000000,
  },
  {
    id: "AVAX",
    name: "Avalanche",
    symbol: "AVAX",
    price: 35.67,
    change24h: 1.23,
    changePct24h: 3.57,
    volume24h: 567000000,
    marketCap: 14200000000,
  },
  {
    id: "LINK",
    name: "Chainlink",
    symbol: "LINK",
    price: 14.56,
    change24h: 0.45,
    changePct24h: 3.19,
    volume24h: 345000000,
    marketCap: 8900000000,
  },
];

function generateSparkline() {
  const points: number[] = [];
  let value = 0.5;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.5) * 0.1;
    value = Math.max(0, Math.min(1, value));
    points.push(value);
  }
  return points;
}

function simulatePriceMovement(asset: (typeof defaultCryptoAssets)[0]) {
  const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
  const priceChange = asset.price * (changePercent / 100);
  const newPrice = asset.price + priceChange;
  const newChange24h = asset.change24h + priceChange;
  const newChangePct24h = ((newPrice - (asset.price - asset.change24h)) / (asset.price - asset.change24h)) * 100;

  return {
    ...asset,
    price: Number(newPrice.toFixed(asset.price < 1 ? 6 : 2)),
    change24h: Number(newChange24h.toFixed(2)),
    changePct24h: Number(newChangePct24h.toFixed(2)),
  };
}

export async function GET() {
  try {
    // Simulate price movements
    const assets = defaultCryptoAssets.map((asset) => {
      const updated = simulatePriceMovement(asset);
      return {
        ...updated,
        sparkline: generateSparkline(),
        lastUpdated: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      assets,
      lastUpdated: new Date().toLocaleTimeString(),
      source: "Simulated (Alpha Vantage integration pending)",
    });
  } catch (error) {
    console.error("Error in crypto-data GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch crypto data" },
      { status: 500 }
    );
  }
}
