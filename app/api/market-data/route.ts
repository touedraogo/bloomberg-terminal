import { NextResponse } from "next/server";

// Finnhub API - Real-time stock data
const FINNHUB_KEY = "d7202ipr01qjeeefcbtgd7202ipr01qjeeefcbu0";

interface Quote {
  c: number;  // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // high
  l: number;   // low
  o: number;   // open
  pc: number;  // previous close
}

// Map indices to Finnhub symbols
// Note: ETFs track 1/10 of actual index value
const INDICES = {
  americas: [
    { id: "DOW JONES", symbol: "DJI", name: "Dow Jones", multiplier: 1 },
    { id: "S&P 500", symbol: "SPY", name: "S&P 500 ETF", multiplier: 10 },
    { id: "NASDAQ", symbol: "QQQ", name: "NASDAQ ETF", multiplier: 10 },
    { id: "S&P/TSX Comp", symbol: "XIU.TO", name: "TSX Composite", multiplier: 1 },
    { id: "IBOVESPA", symbol: "EWZ", name: "Brazil ETF", multiplier: 1 },
  ],
  emea: [
    { id: "Euro Stoxx 50", symbol: "FEZ", name: "Euro Stoxx 50", multiplier: 1 },
    { id: "FTSE 100", symbol: "ISF.L", name: "FTSE 100", multiplier: 1 },
    { id: "CAC 40", symbol: "CC.F", name: "CAC 40", multiplier: 1 },
    { id: "DAX", symbol: "DAX", name: "DAX", multiplier: 1 },
    { id: "SWISS MKT", symbol: "EWL", name: "Swiss Market", multiplier: 1 },
  ],
  asiaPacific: [
    { id: "NIKKEI", symbol: "NHK", name: "Nikkei", multiplier: 1 },
    { id: "HANG SENG", symbol: "EWH", name: "Hang Seng", multiplier: 1 },
    { id: "CSI 300", symbol: "CHIX", name: "CSI 300", multiplier: 1 },
    { id: "S&P/ASX 200", symbol: "AUD", name: "ASX 200", multiplier: 1 },
  ],
};

async function fetchQuote(symbol: string): Promise<Quote | null> {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    const data = await response.json();
    
    if (data.c && data.c > 0) {
      return data as Quote;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const result: any = {
      americas: [],
      emea: [],
      asiaPacific: [],
      lastUpdated: new Date().toISOString(),
      source: "Finnhub (Real-time)",
    };

    // Fetch all indices
    for (const [region, indices] of Object.entries(INDICES)) {
      for (const [i, index] of indices.entries()) {
        const quote = await fetchQuote(index.symbol);
        
        if (quote) {
          const m = index.multiplier || 1;
          result[region].push({
            id: index.id,
            num: `${i + 11})`,
            value: Number((quote.c * m).toFixed(2)),
            change: Number((quote.d * m).toFixed(2)),
            pctChange: quote.dp,
            avat: 0,
            time: new Date(quote.t * 1000).toLocaleTimeString(),
            ytd: 0,
            ytdCur: 0,
            high: Number((quote.h * m).toFixed(2)),
            low: Number((quote.l * m).toFixed(2)),
            sparkline1: Array(20).fill(0.5),
            sparkline2: Array(20).fill(0.5),
          });
        }
        
        // Rate limit - wait between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in market-data:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
