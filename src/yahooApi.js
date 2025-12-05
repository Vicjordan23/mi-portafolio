// src/yahooApi.js
// Yahoo Finance vía RapidAPI (apidojo-yahoo-finance-v1)

const RAPIDAPI_KEY = "c81c43aa05msh544e00a9b974533p1a80a9jsn8036a79fea7e";
const RAPIDAPI_HOST = "apidojo-yahoo-finance-v1.p.rapidapi.com";

const BASE_URL = "https://apidojo-yahoo-finance-v1.p.rapidapi.com";

const baseHeaders = {
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": RAPIDAPI_HOST,
};

/**
 * Autocomplete de símbolos (acciones, ETFs, etc.)
 */
export const searchSymbolYahoo = async (query) => {
  if (!query || query.trim().length < 2) return [];

  const url = new URL("/auto-complete", BASE_URL);
  url.searchParams.set("q", query.trim());
  url.searchParams.set("region", "ES");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: baseHeaders,
  });

  if (!res.ok) throw new Error("Error al buscar en Yahoo");

  const data = await res.json();
  const quotes = data.quotes || [];

  return quotes.map((q) => ({
    symbol: q.symbol,
    name: q.shortname || q.longname || q.symbol,
    type: q.quoteType || "",
    exchange: q.fullExchangeName || q.exchange || "",
    currency: q.currency || "",
  }));
};

/**
 * Cotizaciones para varios símbolos (acciones/ETFs).
 */
export const getQuotesYahoo = async (symbols) => {
  const unique = Array.from(new Set(symbols.filter(Boolean)));
  if (unique.length === 0) return {};

  const url = new URL("/market/v2/get-quotes", BASE_URL);
  url.searchParams.set("symbols", unique.join(","));
  url.searchParams.set("region", "ES");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: baseHeaders,
  });

  if (!res.ok) throw new Error("Error al obtener cotizaciones Yahoo");

  const data = await res.json();
  const results = data.quoteResponse?.result || [];

  const out = {};
  results.forEach((q) => {
    const symbol = q.symbol;
    const price = q.regularMarketPrice ?? q.postMarketPrice ?? q.preMarketPrice;
    const change = q.regularMarketChange ?? 0;
    const changePercent = q.regularMarketChangePercent ?? 0;

    if (symbol && price != null) {
      out[symbol] = {
        symbol,
        price: Number(price),
        change: Number(change),
        changePercent: Number(changePercent),
        currency: q.currency,
      };
    }
  });

  return out;
};

/**
 * Tipo de cambio EUR/USD en tiempo real.
 * Usa el símbolo de Yahoo: EURUSD=X
 * Devuelve cuántos EUR vale 1 USD (factor para multiplicar USD->EUR).
 */
export const getEurPerUsd = async () => {
  const url = new URL("/market/v2/get-quotes", BASE_URL);
  url.searchParams.set("symbols", "EURUSD=X");
  url.searchParams.set("region", "US");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: baseHeaders,
  });

  if (!res.ok) throw new Error("Error al obtener EURUSD");

  const data = await res.json();
  const q = data.quoteResponse?.result?.[0];
  if (!q || q.regularMarketPrice == null) return 0.92; // fallback

  const eurUsd = Number(q.regularMarketPrice); // 1 EUR = eurUsd USD
  if (!eurUsd) return 0.92;

  const usdEur = 1 / eurUsd; // 1 USD en EUR
  return usdEur;
};
