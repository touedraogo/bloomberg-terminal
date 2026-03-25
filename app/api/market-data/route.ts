import { NextResponse } from "next/server";

// Stooq - Free, public data with ~5 min delay
// https://stooq.com

interface IndexData {
  id: string;
  name: string;
  value: number;
  change: number;
  pctChange: number;
  time: string;
}

// Get index data from Stooq
async function fetchIndex(symbol: string): Promise<IndexData | null> {
  try {
    const response = await fetch(`https://stooq.com/q/d/l/?s=${symbol}&i=d`, {
      next: { revalidate: 300 } // 5 min cache
    });
    const text = await response.text();
    const lines = text.trim().split("\n");
    
    if (lines.length < 2) return null;
    
    // Last row is most recent data
    const lastRow = lines[lines.length - 1];
    const prevRow = lines[lines.length - 2];
    
    const [date, open, high, low, close, volume] = lastRow.split(",");
    const [, , , , prevClose] = prevRow.split(",");
    
    const closeVal = parseFloat(close);
    const prevVal = parseFloat(prevClose);
    const change = closeVal - prevVal;
    const pctChange = (change / prevVal) * 100;
    
    return {
      id: symbol.toUpperCase(),
      value: closeVal,
      change: Number(change.toFixed(2)),
      pctChange: Number(pctChange.toFixed(2)),
      time: date,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    // Fetch all indices in parallel
    const symbols = {
      americas: [
        { id: "^DJI", name: "Dow Jones" },
        { id: "^SPX", name: "S&P 500" },
        { id: "^NDX", name: "NASDAQ 100" },
        { id: "^GSPTSE", name: "S&P/TSX" },
        { id: "^BVSP", name: "IBOVESPA" },
      ],
      emea: [
        { id: "^STOXX50E", name: "Euro Stoxx 50" },
        { id: "^FTSE", name: "FTSE 100" },
        { id: "^FCHI", name: "CAC 40" },
        { id: "^GDAXI", name: "DAX" },
        { id: "^SSMI", name: "Swiss Mkt" },
      ],
      asiaPacific: [
        { id: "^N225", name: "Nikkei" },
        { id: "^HSI", name: "Hang Seng" },
        { id: "cnx.nse", name: "CSI 300" },
        { id: "^AXJO", name: "ASX 200" },
      ],
    };

    const result: any = {
      americas: [],
      emea: [],
      asiaPacific: [],
      lastUpdated: new Date().toISOString(),
      source: "Stooq (Public, ~5 min delay)",
    };

    // Fetch all indices
    const promises = Object.entries(symbols).map(async ([region, indices]) => {
      const results = await Promise.all(
        indices.map(async (idx, i) => {
          const data = await fetchIndex(idx.id);
          if (data) {
            return {
              id: idx.name,
              num: `${i + 11})`,
              value: data.value,
              change: data.change,
              pctChange: data.pctChange,
              avat: 0,
              time: data.time,
              ytd: 0,
              ytdCur: 0,
              sparkline1: Array(20).fill(0.5),
              sparkline2: Array(20).fill(0.5),
            };
          }
          return null;
        })
      );
      return { region, data: results.filter(Boolean) };
    });

    const allResults = await Promise.all(promises);
    
    for (const { region, data } of allResults) {
      result[region] = data;
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
