import React, { useState, useEffect } from "react";
import DarkModeToggle from "./components/DarkModeToggle";
import AddAssetForm from "./components/AddAssetForm";
import AssetTable from "./components/AssetTable";
import { getEurPerUsd } from "./yahooApi";
import PortfolioHistoryChart from "./components/PortfolioHistoryChart";
import AllocationPieChart from "./components/AllocationPieChart";
import { supabase } from "./supabaseClient";
import "./index.css";

// Lista de APIs y sus keys
const apis = [
  {
    name: 'intraday',
    url: 'https://intraday-stock-market-data.p.rapidapi.com',
    key: 'c81c43aa05msh544e00a9b974533p1a80a9jsn8036a79fea7e',
    host: 'intraday-stock-market-data.p.rapidapi.com'
  },
  {
    name: 'jsonRealTime',
    url: 'https://json-real-time-stock-data-api-python-for-free.p.rapidapi.com',
    key: 'c81c43aa05msh544e00a9b974533p1a80a9jsn8036a79fea7e',
    host: 'json-real-time-stock-data-api-python-for-free.p.rapidapi.com'
  },
  {
    name: 'yahooRealTime',
    url: 'https://yahoo-finance-real-time1.p.rapidapi.com',
    key: 'c81c43aa05msh544e00a9b974533p1a80a9jsn8036a79fea7e',
    host: 'yahoo-finance-real-time1.p.rapidapi.com'
  }
];

const App = () => {
  const [assets, setAssets] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyRange, setHistoryRange] = useState("1M");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState("desktop");
  const [fxRates, setFxRates] = useState({ EUR: 1, USD: 0.92 });
  const [apiIndex, setApiIndex] = useState(0); // API actual

  const getRate = (currency) => fxRates[currency] || 1;

  // Cargar activos desde Supabase
  useEffect(() => {
    const loadAssets = async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error cargando assets de Supabase", error);
        return;
      }

      if (data) {
        console.log("Assets cargados desde Supabase:", data);
        setAssets(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            ticker: row.ticker,
            quantity: Number(row.quantity || 0),
            buyPrice: Number(row.buy_price || 0),
            currentPrice: Number(row.current_price || row.buy_price || 0),
            currency: row.currency || "EUR",
            date: row.date || "",
            dailyChange: 0,
            dailyChangePercent: 0,
          }))
        );
      }
    };

    loadAssets();
  }, []);

  // Tema oscuro desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") setIsDarkMode(false);
    if (stored === "dark") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((p) => !p);

  // Reloj
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // FX USD/EUR con Yahoo cada 10 minutos
  useEffect(() => {
    let cancelled = false;

    const updateFx = async () => {
      try {
        const usdEur = await getEurPerUsd();
        if (cancelled || !usdEur) return;
        setFxRates((prev) => ({ ...prev, USD: usdEur }));
      } catch (e) {
        console.error("Error obteniendo EUR/USD", e);
      }
    };

    updateFx();
    const interval = setInterval(updateFx, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Añadir activo (Supabase)
  const handleAddAsset = async (newAsset) => {
    const record = {
      name: newAsset.name,
      ticker: newAsset.ticker,
      quantity: Number(newAsset.quantity || 0),
      buy_price: Number(newAsset.buyPrice || 0),
      current_price: Number(newAsset.currentPrice || newAsset.buyPrice || 0),
      currency: newAsset.currency || "EUR",
      date: newAsset.date || null,
    };

    const { data, error } = await supabase
      .from("assets")
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error("Error insertando asset en Supabase", error);
      alert("Error guardando en Supabase: " + error.message);
      return;
    }

    setAssets((prev) => [
      ...prev,
      {
        id: data.id,
        name: data.name,
        ticker: data.ticker,
        quantity: Number(data.quantity || 0),
        buyPrice: Number(data.buy_price || 0),
        currentPrice: Number(data.current_price || data.buy_price || 0),
        currency: data.currency || "EUR",
        date: data.date || "",
        dailyChange: 0,
        dailyChangePercent: 0,
      },
    ]);

    setIsFormVisible(false);
  };

  // Borrar activo (Supabase)
  const handleDeleteAsset = async (id) => {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      console.error("Error eliminando asset en Supabase", error);
      alert("Error eliminando en Supabase: " + error.message);
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  // Función para actualizar precios usando la API actual
  const updatePrices = async (symbols, api) => {
    try {
      const response = await fetch(`${api.url}/quotes`, {
        method: 'POST',
        headers: {
          'x-rapidapi-key': api.key,
          'x-rapidapi-host': api.host,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ symbols })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating prices:', error);
      return null;
    }
  };

  const updatePricesFromRapidApi = async () => {
    const currentApi = apis[apiIndex];
    const symbols = assets.map(asset => asset.ticker);
    const prices = await updatePrices(symbols, currentApi);
    if (prices) {
      setAssets(prev => prev.map(asset => {
        const quote = prices[asset.ticker];
        if (!quote) return asset;
        return {
          ...asset,
          currentPrice: quote.price,
          dailyChange: quote.change,
          dailyChangePercent: quote.changePercent,
        };
      }));
    }
    // Cambia a la siguiente API
    setApiIndex((apiIndex + 1) % apis.length);
  };

  // Actualización de precios cada 24 horas
  useEffect(() => {
    if (assets.length === 0) return;

    let cancelled = false;

    const run = async () => {
      try {
        await updatePricesFromRapidApi();
      } catch (e) {
        console.error("Error actualizando precios", e);
      }
    };

    run();
    const interval = setInterval(run, 24 * 60 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [assets.length, apiIndex]);

  const formatCurrency = (value) =>
    value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });

  const totalInvestment = assets.reduce((sum, a) => {
    const rate = getRate(a.currency);
    return sum + a.quantity * a.buyPrice * rate;
  }, 0);

  const totalValue = assets.reduce((sum, a) => {
    const rate = getRate(a.currency);
    const price = a.currentPrice || a.buyPrice;
    return sum + a.quantity * price * rate;
  }, 0);

  const totalPnL = totalValue - totalInvestment;
  const performance = totalInvestment ? (totalPnL / totalInvestment) * 100 : 0;

  const totalDailyPnL = assets.reduce((sum, a) => {
    const rate = getRate(a.currency);
    const dailyChange = a.dailyChange || 0;
    return sum + dailyChange * a.quantity * rate;
  }, 0);

  // Historial para gráfica
  useEffect(() => {
    if (!totalValue) return;

    const now = new Date();
    const dateLabel = now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });

    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.dateLabel === dateLabel) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          totalValue,
          timestamp: now.getTime(),
        };
        return updated;
      }
      return [
        ...prev,
        {
          date: now.toISOString(),
          dateLabel,
          totalValue,
          timestamp: now.getTime(),
        },
      ];
    });
  }, [totalValue]);

  const filteredHistory = (() => {
    if (!history.length) return [];
    const now = Date.now();
    let diffMs;
    switch (historyRange) {
      case "1D":
        diffMs = 1 * 24 * 60 * 60 * 1000;
        break;
      case "1W":
        diffMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "1M":
        diffMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case "1Y":
        diffMs = 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        diffMs = 30 * 24 * 60 * 60 * 1000;
    }
    const minTs = now - diffMs;
    return history.filter((p) => p.timestamp >= minTs);
  })();

  const allocationData = (() => {
    if (!totalValue) return [];
    return assets.map((a) => {
      const rate = getRate(a.currency);
      const price = a.currentPrice || a.buyPrice;
      const valueEur = a.quantity * price * rate;
      const pct = (valueEur / totalValue) * 100;
      return { name: a.ticker || a.name || "Activo", value: pct };
    });
  })();

  const mainViewClass =
    viewMode === "mobile"
      ? "view-mobile"
      : viewMode === "tablet"
      ? "view-tablet"
      : "view-desktop";

  return (
    <div className={`app-root ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <header className="top-header">
        <div>
          <h1 className="app-title">Mi Portafolio de Inversión</h1>
          <p className="app-subtitle">
            Gestiona y visualiza tus inversiones en tiempo real
          </p>
        </div>
        <div className="header-actions">
          <span className="text-muted" style={{ marginRight: 12 }}>
            {formattedTime}
          </span>

          <div className="view-toggle">
            <button
              className={viewMode === "mobile" ? "view-btn active" : "view-btn"}
              onClick={() => setViewMode("mobile")}
              title="Vista móvil"
            >
              📱
            </button>
            <button
              className={viewMode === "tablet" ? "view-btn active" : "view-btn"}
              onClick={() => setViewMode("tablet")}
              title="Vista tablet"
            >
              📊
            </button>
            <button
              className={viewMode === "desktop" ? "view-btn active" : "view-btn"}
              onClick={() => setViewMode("desktop")}
              title="Vista escritorio"
            >
              🖥️
            </button>
          </div>

          <DarkModeToggle
            toggleDarkMode={toggleDarkMode}
            isDarkMode={isDarkMode}
          />
        </div>
      </header>

      <main className={`main-layout ${mainViewClass}`}>
        <section className="stats-grid">
          <div className="stat-card stat-red">
            <div className="stat-header">
              <span className="stat-label">G/P Diaria</span>
              <span className="stat-icon">📉</span>
            </div>
            <div className="stat-value">
              {formatCurrency(totalDailyPnL)}
            </div>
          </div>

          <div className="stat-card stat-blue">
            <div className="stat-header">
              <span className="stat-label">Valor Total</span>
              <span className="stat-icon">💰</span>
            </div>
            <div className="stat-value">{formatCurrency(totalValue)}</div>
          </div>

          <div className="stat-card stat-purple">
            <div className="stat-header">
              <span className="stat-label">Inversión</span>
              <span className="stat-icon">💳</span>
            </div>
            <div className="stat-value">
              {formatCurrency(totalInvestment)}
            </div>
          </div>

          <div className="stat-card stat-green">
            <div className="stat-header">
              <span className="stat-label">G/P Total</span>
              <span className="stat-icon">📈</span>
            </div>
            <div className="stat-value">{formatCurrency(totalPnL)}</div>
          </div>

          <div className="stat-card stat-orange">
            <div className="stat-header">
              <span className="stat-label">Rendimiento</span>
              <span className="stat-icon">📊</span>
            </div>
            <div className="stat-value">
              {performance.toFixed(1)}%
            </div>
          </div>

          <div className="stat-card stat-cyan">
            <div className="stat-header">
              <span className="stat-label">Activos</span>
              <span className="stat-icon">💼</span>
            </div>
            <div className="stat-value">{assets.length}</div>
          </div>
        </section>

        <section className="primary-actions">
          <button
            onClick={() => setIsFormVisible((v) => !v)}
            className="btn primary-btn"
          >
            + Añadir Activo
          </button>
          <button className="btn ghost-btn" onClick={updatePricesFromRapidApi}>
            Actualizar
          </button>
          <button className="btn outline-btn">Exportar a Excel</button>
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <h2>Detalle de Activos</h2>
          </div>
          <div className="panel-body table-container">
            <AssetTable
              assets={assets}
              getRate={getRate}
              onDelete={handleDeleteAsset}
            />
          </div>
        </section>

        <section className="charts-grid">
          <div className="panel">
            <div className="panel-header">
              <h2>Evolución del Portafolio</h2>
              <div className="chart-range-toggle">
                <button
                  className={historyRange === "1D" ? "range-btn active" : "range-btn"}
                  onClick={() => setHistoryRange("1D")}
                >
                  1D
                </button>
                <button
                  className={historyRange === "1W" ? "range-btn active" : "range-btn"}
                  onClick={() => setHistoryRange("1W")}
                >
                  1S
                </button>
                <button
                  className={historyRange === "1M" ? "range-btn active" : "range-btn"}
                  onClick={() => setHistoryRange("1M")}
                >
                  1M
                </button>
                <button
                  className={historyRange === "1Y" ? "range-btn active" : "range-btn"}
                  onClick={() => setHistoryRange("1Y")}
                >
                  1A
                </button>
              </div>
            </div>
            <div className="panel-body">
              <PortfolioHistoryChart data={filteredHistory} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Distribución por Activo</h2>
            </div>
            <div className="panel-body">
              <AllocationPieChart data={allocationData} />
            </div>
          </div>
        </section>

        {isFormVisible && (
          <section className="panel form-panel">
            <div className="panel-header">
              <h2>Añadir nuevo activo</h2>
            </div>
            <div className="panel-body">
              <AddAssetForm onAddAsset={handleAddAsset} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
