import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#eab308", "#22c55e", "#3b82f6", "#f97316", "#a855f7", "#06b6d4", "#f43f5e"];

const AllocationPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="placeholder-chart">Sin activos aún.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#020617",
            border: "1px solid #4b5563",
            fontSize: 12,
          }}
          formatter={(value, name) => [
            `${value.toFixed(1)}%`,
            name,
          ]}
          labelStyle={{ color: "#e5e7eb" }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{
            fontSize: 11,
            color: "#e5e7eb",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AllocationPieChart;
