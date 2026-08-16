"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Brain,
  Thermometer,
  Wind,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { generateBiometricHistory, type BiometricReading } from "@/lib/mockData";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const timeRanges = [
  { label: "1시간", hours: 1, interval: 1 },
  { label: "6시간", hours: 6, interval: 5 },
  { label: "24시간", hours: 24, interval: 15 },
  { label: "7일", hours: 168, interval: 60 },
  { label: "30일", hours: 720, interval: 240 },
];

type MetricKey = "heartRate" | "stressLevel" | "temperature" | "spO2";

const metrics: {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  gradientId: string;
  icon: typeof Heart;
  bgClass: string;
}[] = [
  {
    key: "heartRate",
    label: "심박수",
    unit: "BPM",
    color: "#f43f5e",
    gradientId: "hrGrad",
    icon: Heart,
    bgClass: "bg-rose-50 dark:bg-rose-900/20",
  },
  {
    key: "stressLevel",
    label: "스트레스",
    unit: "/100",
    color: "#14b8a6",
    gradientId: "stressGrad",
    icon: Brain,
    bgClass: "bg-brand-50 dark:bg-brand-900/20",
  },
  {
    key: "temperature",
    label: "체온",
    unit: "°C",
    color: "#f59e0b",
    gradientId: "tempGrad",
    icon: Thermometer,
    bgClass: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    key: "spO2",
    label: "산소포화도",
    unit: "%",
    color: "#3b82f6",
    gradientId: "spoGrad",
    icon: Wind,
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
  },
];

function calcStats(data: BiometricReading[], key: MetricKey) {
  if (!data.length) return { avg: 0, min: 0, max: 0, trend: 0 };
  const values = data.map((d) => d[key]);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  return {
    avg: Math.round(avg * 10) / 10,
    min: Math.round(Math.min(...values) * 10) / 10,
    max: Math.round(Math.max(...values) * 10) / 10,
    trend: Math.round(trend * 10) / 10,
  };
}

function formatTime(ts: number, hours: number): string {
  const d = new Date(ts);
  if (hours <= 24) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CustomTooltip({
  active,
  payload,
  selectedMetric,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  selectedMetric: (typeof metrics)[0];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 card-shadow text-xs"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
    >
      <span className="font-semibold" style={{ color: selectedMetric.color }}>
        {payload[0].value.toFixed(selectedMetric.key === "temperature" ? 1 : 0)}
      </span>
      <span className="ml-1" style={{ color: "var(--text-muted)" }}>
        {selectedMetric.unit}
      </span>
    </div>
  );
}

export default function Biometrics() {
  const [rangeIdx, setRangeIdx] = useState(1);
  const [metricIdx, setMetricIdx] = useState(0);
  const range = timeRanges[rangeIdx];
  const metric = metrics[metricIdx];

  const data = useMemo(
    () => generateBiometricHistory(range.hours, range.interval),
    [range.hours, range.interval]
  );

  const stats = useMemo(() => calcStats(data, metric.key), [data, metric.key]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: formatTime(d.timestamp, range.hours),
        value: d[metric.key],
      })),
    [data, metric.key, range.hours]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              생체 기록
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              생체 신호 히스토리 및 통계 분석
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium card-shadow hover:card-shadow-hover transition-all"
            style={{ background: "var(--bg-card)" }}
          >
            <Download className="w-4 h-4" />
            데이터 내보내기
          </button>
        </motion.div>

        {/* Metric Selector */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {metrics.map((m, i) => {
            const isActive = metricIdx === i;
            const Icon = m.icon;
            const s = calcStats(data, m.key);
            return (
              <button
                key={m.key}
                onClick={() => setMetricIdx(i)}
                className={`relative rounded-2xl p-4 text-left card-shadow transition-all duration-300 ${
                  isActive ? "ring-2" : "hover:card-shadow-hover"
                }`}
                style={{
                  background: "var(--bg-card)",
                  ...(isActive ? { ringColor: m.color, borderColor: m.color } : {}),
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": isActive ? m.color : "transparent",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${m.bgClass} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {m.label}
                  </span>
                </div>
                <p className="text-xl font-bold tabular-nums">
                  {s.avg}
                  <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                    {m.unit}
                  </span>
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {s.trend > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-amber-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                  )}
                  <span className={`text-[10px] font-semibold ${s.trend > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {Math.abs(s.trend)}%
                  </span>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Time Range Selector */}
        <motion.div variants={fadeUp} className="flex items-center gap-1 p-1 rounded-xl w-fit mb-6"
          style={{ background: "var(--border-subtle)" }}
        >
          {timeRanges.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`relative px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                rangeIdx === i
                  ? "text-white"
                  : ""
              }`}
              style={{
                color: rangeIdx === i ? "white" : "var(--text-secondary)",
              }}
            >
              {rangeIdx === i && (
                <motion.div
                  layoutId="time-tab"
                  className="absolute inset-0 rounded-lg gradient-brand"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{r.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Main Chart */}
        <motion.div variants={fadeUp}>
          <div
            className="rounded-2xl p-5 sm:p-6 card-shadow mb-6"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
                <h3 className="text-sm font-semibold">{metric.label}</h3>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  최근 {range.label}
                </span>
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metric.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    domain={
                      metric.key === "spO2"
                        ? [92, 101]
                        : metric.key === "temperature"
                          ? [35, 38]
                          : ["auto", "auto"]
                    }
                  />
                  <Tooltip content={<CustomTooltip selectedMetric={metric} />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={metric.color}
                    strokeWidth={2}
                    fill={`url(#${metric.gradientId})`}
                    dot={false}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      stroke: "var(--bg-card)",
                      fill: metric.color,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div variants={fadeUp}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl p-4 card-shadow" style={{ background: "var(--bg-card)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                평균값
              </p>
              <p className="text-2xl font-bold" style={{ color: metric.color }}>
                {stats.avg}
                <span className="text-xs font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                  {metric.unit}
                </span>
              </p>
            </div>
            <div className="rounded-2xl p-4 card-shadow" style={{ background: "var(--bg-card)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                최솟값
              </p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-blue-500" />
                {stats.min}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  {metric.unit}
                </span>
              </p>
            </div>
            <div className="rounded-2xl p-4 card-shadow" style={{ background: "var(--bg-card)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                최댓값
              </p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                {stats.max}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  {metric.unit}
                </span>
              </p>
            </div>
            <div className="rounded-2xl p-4 card-shadow" style={{ background: "var(--bg-card)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                변화율
              </p>
              <p className={`text-2xl font-bold flex items-center gap-1 ${stats.trend > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {stats.trend > 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(stats.trend)}%
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
