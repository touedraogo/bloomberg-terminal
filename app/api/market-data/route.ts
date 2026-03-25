import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || "";

// Market indices via ETFs (closest to actual indices)
const INDICES = {
  americas: [
    { id: "DOW JONES", etf: "DIA", name: "Dow Jones Industrial" },
    { id: "S&P 500", etf: "SPY", name: "S&P 500" },
    { id: "NASDAQ", etf: "QQQ", name: "NASDAQ 100" },
    { id: "S&P/TSX Comp", etf: "XIU.TO", name: "S&P/TSX Composite" },
    { id: "IBOVESPA", etf: "EWZ", name: "Brazil Bovespa" },
  ],
  emea: [
    { id: "Euro Stoxx 50", etf: "FEZ", name: "Euro Stoxx 50" },
    { id: "FTSE 100", etf: "ISF.L", name: "FTSE 100" },
    { id: "CAC 40", etf: "CC.F", name: "CAC 40" },
    { id: "DAX", etf: "DAX", name: "DAX 40" },
    { id: "SWISS MKT", etf: "EWL", name: "Swiss Market" },
  ],
  asiaPacific: [
    { id: "NIKKEI", etf: "NHK", name: "Nikkei 225" },
    { id: "HANG SENG", etf: "EWJ", name: "Hang Seng" },
    { id: "CSI 300", etf: "CHIX", name: "CSI 300" },
    { id: "S&P/ASX 200", etf: "AUD", name: "ASX 200" },
  ],
};

// Cache for 5 minutes
let cachedMarketData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchQuote(symbol: string): Promise<any> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    const data = await response.json();
    return data["Global Quote"] || null;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

function generateSparkline(): number[] {
  const points: number[] = [];
  let value = 0.5;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.5) * 0.1;
    value = Math.max(0, Math.min(1, value));
    points.push(value);
  }
  return points;
}

export async function GET() {
  try {
    // Check cache
    if (cachedMarketData && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedMarketData,
        fromCache: true,
      });
    }

    const result: any = {
      americas: [],
      emea: [],
      asiaPacific: [],
      lastUpdated: new Date().toISOString(),
      source: "Alpha Vantage (Real-time)",
    };

    // Fetch all indices
    for (const region of Object.keys(INDICES)) {
      for (const index of INDICES[region as keyof typeof INDICES]) {
        const quote = await fetchQuote(index.etf);
        
        if (quote && quote["05. price"]) {
          const price = parseFloat(quote["05. price"]);
          const change = parseFloat(quote["09. change"]);
          const changePercent = parseFloat(quote["10. change percent"].replace("%", ""));
          
          result[region].push({
            id: index.id,
            name: index.name,
            num: `${result[region].length + 11})`,
            value: price,
            change: change,
            pctChange: changePercent,
            avat: 0,
            time: quote["07. latest trading day"],
            ytd: 0,
            ytdCur: 0,
            sparkline1: generateSparkline(),
            sparkline2: generateSparkline(),
          });
        }
        
        // Rate limit - wait between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update cache
    cachedMarketData = result;
    cacheTimestamp = Date.now();

    // Try to store in Redis
    try {
      await redis.set("market_data", result, { ex: 300 });
    } catch (e) {
      console.warn("Redis not available, continuing without cache");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in market-data GET:", error);
    
    // Try Redis cache as fallback
    try {
      const cached = await redis.get("market_data");
      if (cached) {
        return NextResponse.json({
          ...cached,
          fromCache: true,
          error: "Using cached data due to API error",
        });
      }
    } catch (e) {}
    
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
