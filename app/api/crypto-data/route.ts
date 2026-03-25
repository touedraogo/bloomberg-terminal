import { NextResponse } from "next/server";

// CoinGecko API - free, no API key required
const COINGECKO_API = "https://api.coingecko.com/api/v3";

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_24h: number;
  total_volume: number;
  market_cap: number;
  sparkline_in_7d: { price: number[] };
}

export async function GET() {
  try {
    // Fetch top cryptocurrencies from CoinGecko
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 30 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoMarket[] = await response.json();

    // Transform to our format
    const assets = data.map((coin) => ({
      id: coin.symbol.toUpperCase(),
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change24h: coin.price_change_24h || 0,
      changePct24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume || 0,
      marketCap: coin.market_cap || 0,
      sparkline: coin.sparkline_in_7d?.price?.slice(-20).map((p, i, arr) => {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        return (p - min) / (max - min || 1);
      }) || [],
      lastUpdated: new Date().toISOString(),
    }));

    return NextResponse.json({
      assets,
      lastUpdated: new Date().toLocaleTimeString(),
      source: "CoinGecko (Real-time)",
    });
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    return NextResponse.json({
      assets: [],
      lastUpdated: new Date().toLocaleTimeString(),
      source: "Error - CoinGecko unavailable",
      error: String(error),
    }, { status: 500 });
  }
}
