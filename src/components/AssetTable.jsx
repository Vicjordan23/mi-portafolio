import React, { useRef, useEffect, useState } from "react";

const AssetTable = ({ assets, getRate }) => {
  const prevDailyPnLRef = useRef({});
  const [flashMap, setFlashMap] = useState({});

  useEffect(() => {
    const newFlashMap = {};

    assets.forEach((asset) => {
      const id = asset.ticker || asset.name;
      const rate = getRate(asset.currency);
      const dailyChange = asset.dailyChange || 0;
      const quantity = asset.quantity || 0;
      const dailyPnL = dailyChange * quantity * rate; // en EUR

      const prev = prevDailyPnLRef.current[id];

      if (prev !== undefined && prev !== dailyPnL) {
        if (dailyPnL > prev) newFlashMap[id] = "up";
        if (dailyPnL < prev) newFlashMap[id] = "down";
      }

      prevDailyPnLRef.current[id] = dailyPnL;
    });

    if (Object.keys(newFlashMap).length > 0) {
      setFlashMap(newFlashMap);
      const timeout = setTimeout(() => setFlashMap({}), 3000);
      return () => clearTimeout(timeout);
    }
  }, [assets, getRate]);

  const formatCurrencyWithTicker = (value, ticker, maxDecimalsDefault = 2) =>
    value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits:
        (ticker || "").toUpperCase() === "NXT.MC" ? 3 : maxDecimalsDefault,
    });

  const formatPercent = (value) =>
    `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>G/P Diaria</th>
          <th>Valor Actual</th>
          <th>G/P</th>
          <th>% Cambio</th>
          <th>P. Actual</th>
          <th>P. Compra</th>
          <th>Cantidad</th>
          <th>Ticker</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => {
          const id = asset.ticker || asset.name;
          const ticker = asset.ticker || "";

          const rate = getRate(asset.currency);
          const currentPrice = asset.currentPrice || asset.buyPrice;
          const quantity = asset.quantity || 0;

          const currentValueEur = quantity * currentPrice * rate;
          const investedEur = quantity * asset.buyPrice * rate;
          const pnlEur = currentValueEur - investedEur;
          const pnlPercent = investedEur ? (pnlEur / investedEur) * 100 : 0;

          const dailyChange = asset.dailyChange || 0;
          const dailyPnLEur = dailyChange * quantity * rate;

          const pnlClass =
            pnlEur > 0 ? "value-positive" : pnlEur < 0 ? "value-negative" : "value-neutral";
          const dailyClass =
            dailyPnLEur > 0
              ? "value-positive"
              : dailyPnLEur < 0
              ? "value-negative"
              : "value-neutral";

          const flashClass =
            flashMap[id] === "up"
              ? "flash-up"
              : flashMap[id] === "down"
              ? "flash-down"
              : "";

          return (
            <tr key={id}>
              {/* Nombre */}
              <td>{asset.name || "-"}</td>

              {/* G/P diaria en EUR con flash */}
              <td className={`table-cell-right ${dailyClass} ${flashClass}`}>
                {formatCurrencyWithTicker(dailyPnLEur, ticker)}
              </td>

              {/* Valor actual en EUR */}
              <td className="table-cell-right">
                {formatCurrencyWithTicker(currentValueEur, ticker)}
              </td>

              {/* G/P total en EUR */}
              <td className={`table-cell-right ${pnlClass}`}>
                {formatCurrencyWithTicker(pnlEur, ticker)}
              </td>

              {/* % cambio total */}
              <td className={`table-cell-right ${pnlClass}`}>
                {formatPercent(pnlPercent)}
              </td>

              {/* Precio actual (EUR) */}
              <td className="table-cell-right">
                {formatCurrencyWithTicker(currentPrice * rate, ticker, 3)}
              </td>

              {/* Precio compra (EUR) */}
              <td className="table-cell-right">
                {formatCurrencyWithTicker(asset.buyPrice * rate, ticker, 3)}
              </td>

              {/* Cantidad */}
              <td className="table-cell-right">{quantity}</td>

              {/* Ticker (última) */}
              <td>{ticker || "-"}</td>

              {/* Acciones */}
              <td>
                <span style={{ cursor: "pointer", marginRight: 8 }}>✏️</span>
                <span style={{ cursor: "pointer" }}>🗑️</span>
              </td>
            </tr>
          );
        })}

        {assets.length === 0 && (
          <tr>
            <td colSpan={10} style={{ padding: "16px 0", textAlign: "center" }}>
              No hay activos aún. Añade tu primera inversión.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default AssetTable;
