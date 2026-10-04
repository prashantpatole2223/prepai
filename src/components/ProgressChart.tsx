"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";

export interface ProgressChartItem {
  id: string;
  date: string;
  score: number;
  role: string;
}

interface ProgressChartProps {
  data: ProgressChartItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ProgressChartItem }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-3 rounded-xl bg-navy-900 border border-slate-700 shadow-xl text-xs">
        <p className="font-semibold text-white mb-1">{item.role}</p>
        <p className="text-slate-400 mb-1">{item.date}</p>
        <div className="flex items-center gap-1.5 font-bold text-indigo-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Score: {item.score.toFixed(1)} / 10</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function ProgressChart({ data }: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-navy-900/40 border border-slate-800/80">
        <BarChart2 className="w-10 h-10 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No score history yet</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Complete mock interviews to track your skill progression and score trends over time.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#0f172a" }}
            activeDot={{ r: 7, fill: "#818cf8", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
