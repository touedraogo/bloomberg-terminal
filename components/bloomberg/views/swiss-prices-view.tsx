"use client";

export function SwissPricesView() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-700 bg-bbg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">PRIX SUISSE (BCV)</h2>
            <p className="text-xs text-gray-400">
              Données en temps réel depuis BCV.ch
            </p>
          </div>
          <a
            href="https://www.bcv.ch/fr/home/informations-financieres/metaux-precieux.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded text-xs bg-bbg-accent hover:bg-orange-600"
          >
            Ouvrir BCV ↗
          </a>
        </div>
      </div>

      {/* Embedded BCV Page */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src="https://www.bcv.ch/fr/home/informations-financieres/metaux-precieux.html"
          className="w-full h-full border-0"
          title="BCV Precious Metals Prices"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
