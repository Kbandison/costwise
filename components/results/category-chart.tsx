"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryChartProps {
  housing: number;
  goods: number;
  services: number;
}

// Estimated monthly costs for distribution
const BASELINE = {
  housing: 1400,
  food: 400,
  transportation: 300,
  utilities: 200,
  healthcare: 300,
  other: 200,
};

const COLORS = {
  housing: "#a855f7", // purple-500
  food: "#3b82f6", // blue-500
  transportation: "#10b981", // emerald-500
  utilities: "#eab308", // yellow-500
  healthcare: "#ef4444", // red-500
  other: "#6b7280", // gray-500
};

export function CategoryChart({ housing, goods, services }: CategoryChartProps) {
  const data = [
    {
      name: "Housing",
      value: Math.round((BASELINE.housing * housing) / 100),
      color: COLORS.housing,
    },
    {
      name: "Food",
      value: Math.round((BASELINE.food * goods) / 100),
      color: COLORS.food,
    },
    {
      name: "Transportation",
      value: Math.round((BASELINE.transportation * goods) / 100),
      color: COLORS.transportation,
    },
    {
      name: "Utilities",
      value: Math.round((BASELINE.utilities * services) / 100),
      color: COLORS.utilities,
    },
    {
      name: "Healthcare",
      value: Math.round((BASELINE.healthcare * services) / 100),
      color: COLORS.healthcare,
    },
    {
      name: "Other",
      value: Math.round((BASELINE.other * services) / 100),
      color: COLORS.other,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/10 bg-black/90 px-3 py-2 shadow-xl backdrop-blur-xl">
          <p className="text-sm font-medium text-white">{payload[0].name}</p>
          <p className="text-xs text-gray-400">
            {formatCurrency(payload[0].value)}/month
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (props: unknown) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
    } = props as {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percent: number;
    };

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/20 to-black/40 p-6 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-medium text-white">
            Monthly Budget Distribution
          </h2>
          <p className="text-sm text-gray-400">
            Estimated breakdown for a single person
          </p>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => {
                  const item = data.find((d) => d.name === value);
                  return (
                    <span className="text-sm text-gray-300">
                      {value} - {item ? formatCurrency(item.value) : ""}
                    </span>
                  );
                }}
                wrapperStyle={{ paddingTop: "20px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Data table */}
        <div className="space-y-2 rounded-lg border border-white/5 bg-white/5 p-4">
          {data.map((item, index) => {
            const total = data.reduce((sum, d) => sum + d.value, 0);
            const percentage = ((item.value / total) * 100).toFixed(1);

            return (
              <div
                key={index}
                className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="w-12 text-right text-xs text-gray-500">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t border-white/10 pt-3 font-semibold">
            <span className="text-sm text-white">Total</span>
            <span className="text-base text-white">
              {formatCurrency(data.reduce((sum, d) => sum + d.value, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
