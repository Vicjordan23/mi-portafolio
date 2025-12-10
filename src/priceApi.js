// src/priceApi.js
import { getQuotesYahoo } from "./yahooApi";

// Alpha Vantage
const ALPHA_BASE_URL = "https://www.alphavantage.co/query";
const alphaKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

async function getQuoteAlpha(symbol) {
  if (!alphaKey) {
    throw new Error("Falta VITE_ALPHA_VANTAGE_KEY");
  }

  const url = `${ALPHA_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${alphaKey}`;

  const res = await fetch(url);
  const json = await res.json();

  // Alpha puede devolver "Note" (límite) o "Error Message"
  if (json.Note || json["Error Message"]) {
    console.warn("Alpha Vantage aviso para", symbol, json);
    throw new Error("Alpha no disponible para " + symbol);
  }

  const quote = json["Global Quote"];
  if (!quote || !quote["05. price"]) {
    throw new Error("Respuesta inválida de Alpha Vantage para " + symbol);
  }

  return {
    price: Number(quote["05. price"]),
    change: 0,
    changePercent: 0,
  };
}

// Intenta Alpha primero. Para los que fallen, usa Yahoo como backup.
// Se respeta el límite de 5 peticiones/min de Alpha con un pequeño delay. [web:493][web:495]
export async function getQuotesWithFallback(symbols) {
  const out = {};
  const missing = [];

  for (const s of symbols) {
    if (!s) continue;
    try {
      out[s] = await getQuoteAlpha(s);
    } catch (e) {
      console.warn("Alpha falló para", s, e);
      missing.push(s);
    }
    // 10s entre llamadas → máx. 6/min, suficiente si no tienes muchos símbolos
    await new Promise((r) => setTimeout(r, 10000));
  }

  // Si algunos símbolos no tienen precio en Alpha, probamos con Yahoo.
  if (missing.length > 0) {
    try {
      const yahooQuotes = await getQuotesYahoo(missing);
      for (const s of missing) {
        const q = yahooQuotes[s];
        if (!q) continue;
        out[s] = {
          price: q.price,
          change: q.change || 0,
          changePercent: q.changePercent || 0,
        };
      }
    } catch (e) {
      console.error("Error obteniendo precios de Yahoo como backup", e);
    }
  }

  return out;
}
