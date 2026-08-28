"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

type ChartDatum = Record<string, string | number | null>;

export function TrendChart({
  title,
  eyebrow,
  data,
  unit = "$M"
}: {
  title: string;
  eyebrow?: string;
  data: ChartDatum[];
  unit?: string;
}) {
  return (
    <Card>
      <CardHeader eyebrow={eyebrow} title={title} />
      <CardBody>
        <div className="h-80 min-h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#e5e9e4" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} unit={unit} />
              <Tooltip
                contentStyle={{
                  border: "1px solid #d9ded8",
                  borderRadius: 8,
                  boxShadow: "0 8px 18px rgba(16, 24, 40, 0.08)"
                }}
              />
              <Legend />
              <Line
                name="Actual revenue"
                type="monotone"
                dataKey="actual"
                stroke="#24836f"
                strokeWidth={3}
                connectNulls
                dot={{ r: 3 }}
              />
              <Line
                name="Forecast revenue"
                type="monotone"
                dataKey="forecast"
                stroke="#356fbe"
                strokeWidth={3}
                strokeDasharray="6 5"
                connectNulls
                dot={{ r: 3 }}
              />
              <Line
                name="Plan"
                type="monotone"
                dataKey="plan"
                stroke="#8a9690"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

export function CashForecastChart({
  data,
  compact = false
}: {
  data: ChartDatum[];
  compact?: boolean;
}) {
  return (
    <Card>
      <CardHeader eyebrow="13-week outlook" title="Cash Forecast" />
      <CardBody>
        <div className={compact ? "h-64 min-h-64" : "h-80 min-h-80"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="cashActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#24836f" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#24836f" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="cashForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#356fbe" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#356fbe" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e5e9e4" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} unit="M" />
              <Tooltip
                contentStyle={{
                  border: "1px solid #d9ded8",
                  borderRadius: 8,
                  boxShadow: "0 8px 18px rgba(16, 24, 40, 0.08)"
                }}
              />
              <Legend />
              <ReferenceLine y={0.5} label="Safety threshold" stroke="#c2413a" strokeDasharray="4 4" />
              <Area
                name="Actual cash"
                type="monotone"
                dataKey="actual"
                stroke="#24836f"
                strokeWidth={3}
                fill="url(#cashActual)"
                connectNulls
              />
              <Area
                name="Forecast cash"
                type="monotone"
                dataKey="forecast"
                stroke="#356fbe"
                strokeWidth={3}
                strokeDasharray="6 5"
                fill="url(#cashForecast)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

export function CategoryBarChart({
  title,
  eyebrow,
  data,
  dataKey,
  xKey
}: {
  title: string;
  eyebrow?: string;
  data: ChartDatum[];
  dataKey: string;
  xKey: string;
}) {
  return (
    <Card>
      <CardHeader eyebrow={eyebrow} title={title} />
      <CardBody>
        <div className="h-72 min-h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#e5e9e4" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  border: "1px solid #d9ded8",
                  borderRadius: 8,
                  boxShadow: "0 8px 18px rgba(16, 24, 40, 0.08)"
                }}
              />
              <Bar dataKey={dataKey} fill="#24836f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
