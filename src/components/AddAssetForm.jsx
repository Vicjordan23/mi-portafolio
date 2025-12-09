import React, { useState, useEffect } from "react";
import { searchSymbolYahoo } from "../yahooApi";

const AddAssetForm = ({ onAddAsset }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    ticker: "",
    quantity: "",
    buyPrice: "",
    currentPrice: "",
    currency: "EUR",
    date: "",
  });

  // Buscar símbolos con debounce, pero si ya hemos elegido uno no buscamos más
  useEffect(() => {
    if (hasSelected) {
      setResults([]);
      return;
    }

    if (search.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchSymbolYahoo(search);
        if (!cancelled) setResults(res);
      } catch (e) {
        console.error(e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search, hasSelected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectResult = (item) => {
    setSearch(`${item.symbol} · ${item.name}`);
    setResults([]);
    setHasSelected(true);

    setFormData((prev) => ({
      ...prev,
      name: item.name,
      ticker: item.symbol,
      currency: item.currency || prev.currency,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalTicker = formData.ticker;
    let finalName = formData.name;

    // Plan B: si no hay nombre/ticker pero sí texto en búsqueda, úsalo
    if (!finalTicker && search.trim()) {
      finalTicker = search.trim().toUpperCase();
    }
    if (!finalName) {
      finalName = finalTicker;
    }

    if (!finalName || !finalTicker) return;

    onAddAsset({
      ...formData,
      name: finalName,
      ticker: finalTicker,
    });

    setSearch("");
    setResults([]);
    setHasSelected(false);
    setFormData({
      name: "",
      ticker: "",
      quantity: "",
      buyPrice: "",
      currentPrice: "",
      currency: "EUR",
      date: "",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Búsqueda con autocompletar */}
      <div className="form-field" style={{ gridColumn: "1 / -1" }}>
        <label>Buscar (nombre, ticker o ISIN)</label>
        <input
          type="text"
          value={search}
          placeholder="Ej. NXT.MC, SOLARIA, iShares..."
          onChange={(e) => {
            setSearch(e.target.value);
            setHasSelected(false); // al escribir de nuevo, se reactivan las búsquedas
          }}
        />
        {isSearching && <small className="text-muted">Buscando...</small>}
        {results.length > 0 && (
          <div className="autocomplete-list">
            {results.slice(0, 8).map((item) => (
              <div
                key={`${item.symbol}-${item.exchange}`}
                className="autocomplete-item"
                onClick={() => handleSelectResult(item)}
              >
                <div>
                  <strong>{item.symbol}</strong> · {item.name}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {item.exchange} · {item.currency} · {item.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-field">
        <label>Nombre</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          placeholder="Nombre del activo"
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Ticker</label>
        <input
          type="text"
          name="ticker"
          value={formData.ticker}
          placeholder="Ej. NXT.MC"
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Cantidad</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          placeholder="Ej. 10"
          onChange={handleChange}
          min="0"
          step="0.01"
        />
      </div>

      <div className="form-field">
        <label>Precio de Compra</label>
        <input
          type="number"
          name="buyPrice"
          value={formData.buyPrice}
          placeholder="Ej. 15.30"
          onChange={handleChange}
          min="0"
          step="0.01"
        />
      </div>

      <div className="form-field">
        <label>Moneda</label>
        <select
          name="currency"
          value={formData.currency}
          onChange={handleChange}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="form-field">
        <label>Fecha de compra</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />
      </div>

      {/* Campo de precio actual eliminado como pediste; solo se usa API */}

      <button type="submit" className="btn primary-btn submit-btn">
        Guardar Activo
      </button>
    </form>
  );
};

export default AddAssetForm;
