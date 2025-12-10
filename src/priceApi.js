// src/priceApi.js
const TD_BASE_URL = "https://api.twelvedata.com/price";
const tdKey = import.meta.env.VITE_TWELVE_DATA_KEY;

// Devuelve { [symbol]: { price, change, changePercent } }
// Por ahora solo usamos price; change=0 para no complicar.
export async function getQuotesTwelveData(symbols) {
  if (!tdKey) {
    throw new Error("Falta VITE_TWELVE_DATA_KEY");
  }

  const unique = Array.from(new Set(symbols.filter(Boolean)));
  if (unique.length === 0) return {};

  const params = new URLSearchParams({
    symbol: unique.join(","),
    apikey: tdKey,
  });

  const res = await fetch(`${TD_BASE_URL}?${params.toString()}`);
  const json = await res.json();

  const out = {};

  // Si solo hay 1 símbolo, Twelve Data devuelve un objeto plano.
  if (!Array.isArray(json) && !json.data && json.price) {
    const s = unique[0];
    out[s] = {
      price: Number(json.price),
      change: 0,
      changePercent: 0,
    };
    return out;
  }

  // Respuesta múltiple: json.data es un array de { symbol, price, ... } [web:559]
  const dataArray = Array.isArray(json.data) ? json.data : [];

  for (const item of dataArray) {
    if (!item || !item.symbol || item.price == null) continue;
    out[item.symbol] = {
      price: Number(item.price),
      change: 0,
      changePercent: 0,
    };
  }

  return out;
}
