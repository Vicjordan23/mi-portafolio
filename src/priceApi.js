// src/priceApi.js
const ALPHA_BASE_URL = "https://www.alphavantage.co/query";

const alphaKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

export async function getQuoteAlpha(symbol) {
  if (!alphaKey) {
    throw new Error("Falta VITE_ALPHA_VANTAGE_KEY");
  }

  const url = `${ALPHA_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${alphaKey}`;

  const res = await fetch(url);
  const json = await res.json();

  const quote = json["Global Quote"];
  if (!quote || !quote["05. price"]) {
    throw new Error("Respuesta inválida de Alpha Vantage para " + symbol);
  }

  return {
    price: Number(quote["05. price"]),
    // Se podría usar 09. change y 10. change percent si quieres más tarde
    change: 0,
    changePercent: 0,
  };
}

// Free tier: 5 peticiones/min → metemos delay de 15s entre símbolos.
// Con 8 acciones y update cada 15 min estás muy por debajo del límite. [web:493][web:495]
export async function getQuotesAlphaBatch(symbols) {
  const out = {};
  for (const s of symbols) {
    if (!s) continue;
    try {
      out[s] = await getQuoteAlpha(s);
    } catch (e) {
      console.error("Error Alpha para", s, e);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  return out;
}
