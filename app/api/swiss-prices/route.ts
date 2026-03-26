import { NextResponse } from "next/server";

// Swiss precious metals prices from BCV
// Source: https://www.bcv.ch/fr/home/informations-financieres/metaux-precieux.html
// Last updated: 25.03.2026

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

export async function GET() {
  const lastUpdated = "26.03.2026";
  
  const preciousMetals: SwissMetal[] = [
    {
      id: "GOLD",
      name: "Or",
      buyPrice: 4440.91,
      sellPrice: 4460.91,
      buyPriceCHF: 113227,
      sellPriceCHF: 113827,
      unit: "oz",
      lastUpdated,
    },
    {
      id: "SILVER",
      name: "Argent",
      buyPrice: 68.77,
      sellPrice: 69.67,
      buyPriceCHF: 1753,
      sellPriceCHF: 1779,
      unit: "oz",
      lastUpdated,
    },
    {
      id: "PLATINUM",
      name: "Platine",
      buyPrice: 1852.8,
      sellPrice: 1878.8,
      buyPriceCHF: 47186,
      sellPriceCHF: 48006,
      unit: "oz",
      lastUpdated,
    },
    {
      id: "PALLADIUM",
      name: "Palladium",
      buyPrice: 1353.75,
      sellPrice: 1397.75,
      buyPriceCHF: 34441,
      sellPriceCHF: 35741,
      unit: "oz",
      lastUpdated,
    },
  ];

  const goldBars: GoldBar[] = [
    { weight: "1 gramme", buyPrice: 113, sellPrice: 135, certification: "Fairtrade" },
    { weight: "5 grammes", buyPrice: 583, sellPrice: 613, certification: "Fairtrade" },
    { weight: "10 grammes", buyPrice: 1171, sellPrice: 1211, certification: "Fairtrade" },
    { weight: "20 grammes", buyPrice: 2344, sellPrice: 2403, certification: "Fairtrade" },
    { weight: "50 grammes", buyPrice: 5778, sellPrice: 5858, certification: "Traçable BCV" },
    { weight: "100 grammes", buyPrice: 11568, sellPrice: 11689, certification: "Traçable BCV" },
    { weight: "250 grammes", buyPrice: 28883, sellPrice: 29084, certification: "Traçable BCV" },
    { weight: "500 grammes", buyPrice: 57818, sellPrice: 58129, certification: "Traçable BCV" },
    { weight: "1 kg", buyPrice: 115616, sellPrice: 116207, certification: "Traçable BCV" },
  ];

  const coins: Coin[] = [
    { name: "Vreneli CH 10", buyPrice: 331, sellPrice: 461 },
    { name: "Vreneli CHF 20", buyPrice: 661, sellPrice: 696 },
    { name: "Napoleon FF 20", buyPrice: 662, sellPrice: 697 },
    { name: "Souverain nouv. GBP 10", buyPrice: 838, sellPrice: 898 },
    { name: "Krugerrand 1/1", buyPrice: 3587, sellPrice: 3707 },
    { name: "Maple leaf 1/1", buyPrice: 3586, sellPrice: 3706 },
  ];

  return NextResponse.json({
    preciousMetals,
    goldBars,
    coins,
    lastUpdated,
    source: "BCV - Banque Nationale Suisse",
    sourceUrl: "https://www.bcv.ch/fr/home/informations-financieres/metaux-precieux.html",
  });
}
