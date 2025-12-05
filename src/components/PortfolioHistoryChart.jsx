import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const PortfolioHistoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="placeholder-chart">Sin datos aún.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          stroke="#4b5563"
        />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          stroke="#4b5563"
          tickFormatter={(v) =>
            v.toLocaleString("es-ES", { maximumFractionDigits: 0 })
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#020617",
            border: "1px solid #4b5563",
            fontSize: 12,
          }}
          formatter={(value) =>
            value.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            })
          }
          labelStyle={{ color: "#e5e7eb" }}
        />
        <Line
          type="monotone"
          dataKey="totalValue"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PortfolioHistoryChart;
