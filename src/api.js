// src/api.js

const API_KEYS = ["71VWUEVNB7TKJFSC", "IRACALGXNXVQNU51"]; // rota entre las 2
let keyIndex = 0;

const getApiKey = () => {
  const key = API_KEYS[keyIndex];
  keyIndex = (keyIndex + 1) % API_KEYS.length;
  return key;
};

const BASE_URL = "https://www.alphavantage.co/query";

/**
 * Busca símbolos por nombre o ticker usando SYMBOL_SEARCH.
 * Devuelve array de objetos simplificados:
 * { symbol, name, region, currency, type }
 */
export const searchSymbol = async (query) => {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    function: "SYMBOL_SEARCH",
    keywords: query.trim(),
    apikey: getApiKey(),
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Error al buscar símbolo");
  const data = await res.json();

  const matches = data.bestMatches || [];
  return matches.map((m) => ({
    symbol: m["1. symbol"],
    name: m["2. name"],
    type: m["3. type"],
    region: m["4. region"],
    currency: m["8. currency"],
  }));
};

/**
 * Obtiene cotización actual de un símbolo con GLOBAL_QUOTE.
 * Devuelve null si no hay datos.
 */
export const getQuote = async (symbol) => {
  if (!symbol) return null;

  const params = new URLSearchParams({
    function: "GLOBAL_QUOTE",
    symbol,
    apikey: getApiKey(),
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener cotización");
  const data = await res.json();

  const q = data["Global Quote"];
  if (!q || !q["05. price"]) return null;

  const price = parseFloat(q["05. price"]);
  const change = parseFloat(q["09. change"]);
  const changePercentStr = q["10. change percent"] || "0%";
  const changePercent = parseFloat(changePercentStr.replace("%", "")) || 0;

  return {
    symbol,
    price,
    change,
    changePercent,
  };
};

/**
 * Obtiene cotizaciones para varios símbolos en serie.
 * Para no pasar de límites gratuitos, se hace una llamada por símbolo.
 */
export const getQuotesForSymbols = async (symbols) => {
  const unique = Array.from(new Set(symbols.filter(Boolean)));
  const result = {};
  for (const sym of unique) {
    try {
      const quote = await getQuote(sym);
      if (quote) result[sym] = quote;
    } catch (e) {
      console.error("Error al obtener cotización para", sym, e);
    }
  }
  return result;
};
