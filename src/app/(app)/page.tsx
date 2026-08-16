"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Brain,
  Thermometer,
  Wind,
  Watch,
  Shirt,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  ChevronRight,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import {
  type BiometricReading,
  mockAlerts,
  getStressLabel,
  formatTimestamp,
} from "@/lib/mockData";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function useRealtimeData() {
  const [data, setData] = useState<BiometricReading[]>([]);
  const [current, setCurrent] = useState<BiometricReading>({
    timestamp: Date.now(),
    heartRate: 76,
    stressLevel: 35,
    temperature: 36.5,
    spO2: 98,
  });

  const generateReading = useCallback((): BiometricReading => {
    const prev = current;
    const hrDelta = (Math.random() - 0.5) * 6;
    const stressDelta = (Math.random() - 0.5) * 8;
    return {
      timestamp: Date.now(),
      heartRate: Math.round(
        Math.max(58, Math.min(120, prev.heartRate + hrDelta))
      ),
      stressLevel: Math.round(
        Math.max(10, Math.min(90, prev.stressLevel + stressDelta))
      ),
      temperature:
        Math.round(
          (prev.temperature + (Math.random() - 0.5) * 0.2) * 10
        ) / 10,
      spO2: Math.round(
        Math.max(94, Math.min(100, prev.spO2 + (Math.random() - 0.5) * 1))
      ),
    };
  }, [current]);

  useEffect(() => {
    const initial: BiometricReading[] = [];
    let r: BiometricReading = {
      timestamp: Date.now() - 60 * 1000,
      heartRate: 76,
      stressLevel: 35,
      temperature: 36.5,
      spO2: 98,
    };
    for (let i = 0; i < 30; i++) {
      r = {
        timestamp: Date.now() - (30 - i) * 2000,
        heartRate: Math.round(r.heartRate + (Math.random() - 0.5) * 4),
        stressLevel: Math.round(r.stressLevel + (Math.random() - 0.5) * 5),
        temperature:
          Math.round((r.temperature + (Math.random() - 0.5) * 0.1) * 10) / 10,
        spO2: Math.round(
          Math.max(94, Math.min(100, r.spO2 + (Math.random() - 0.5)))
        ),
      };
      initial.push(r);
    }
    setData(initial);
    setCurrent(initial[initial.length - 1]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const reading = generateReading();
      setCurrent(reading);
      setData((prev) => [...prev.slice(-29), reading]);
    }, 2000);
    return () => clearInterval(interval);
  }, [generateReading]);

  return { data, current };
}

function getTrend(data: BiometricReading[], key: keyof BiometricReading) {
  if (data.length < 5) return "stable";
  const recent = data.slice(-5).map((d) => d[key] as number);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const first = recent[0];
  if (avg > first * 1.03) return "up";
  if (avg < first * 0.97) return "down";
  return "stable";
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")
    return <TrendingUp className="w-3.5 h-3.5 text-amber-500" />;
  if (trend === "down")
    return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
  return <Minus className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
}

const alertIcons = {
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  success: CheckCircle2,
};

const alertColors = {
  warning: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  danger: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  info: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  success: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
};

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  );
}

export default function Dashboard() {
  const { data, current } = useRealtimeData();
  const stress = getStressLabel(current.stressLevel);
  const hrTrend = getTrend(data, "heartRate");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            대시보드
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            실시간 생체 신호 모니터링
          </p>
        </motion.div>

        {/* Connection Status */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium card-shadow"
            style={{ background: "var(--bg-card)" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Watch className="w-3.5 h-3.5 text-emerald-500" />
            <span>스마트워치 연결됨</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium card-shadow"
            style={{ background: "var(--bg-card)" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Shirt className="w-3.5 h-3.5 text-emerald-500" />
            <span>토다기 조끼 연결됨</span>
          </div>
        </motion.div>

        {/* Main Biometric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Heart Rate */}
          <motion.div variants={fadeUp}>
            <div
              className="relative rounded-2xl p-4 sm:p-5 card-shadow overflow-hidden group hover:card-shadow-hover transition-shadow duration-300"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-rose-500/5 -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                  <Heart className="w-[18px] h-[18px] text-rose-500 animate-heartbeat" />
                </div>
                <TrendIcon trend={hrTrend} />
              </div>
              <div className="relative">
                <motion.p
                  key={current.heartRate}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold tabular-nums"
                >
                  {current.heartRate}
                </motion.p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  BPM
                </p>
              </div>
              <div className="mt-3 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.slice(-15)}>
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Stress Level */}
          <motion.div variants={fadeUp}>
            <div
              className="relative rounded-2xl p-4 sm:p-5 card-shadow overflow-hidden group hover:card-shadow-hover transition-shadow duration-300"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-500/5 -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <Brain className="w-[18px] h-[18px] text-brand-500" />
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: stress.color,
                    backgroundColor: `${stress.color}15`,
                  }}
                >
                  {stress.label}
                </span>
              </div>
              <div className="relative">
                <motion.p
                  key={current.stressLevel}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold tabular-nums"
                >
                  {current.stressLevel}
                </motion.p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  / 100
                </p>
              </div>
              <div className="mt-3">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--border-subtle)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${current.stressLevel}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      background: `linear-gradient(90deg, #10b981, ${stress.color})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Temperature */}
          <motion.div variants={fadeUp}>
            <div
              className="relative rounded-2xl p-4 sm:p-5 card-shadow overflow-hidden group hover:card-shadow-hover transition-shadow duration-300"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500/5 -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Thermometer className="w-[18px] h-[18px] text-amber-500" />
                </div>
                <TrendIcon trend={getTrend(data, "temperature")} />
              </div>
              <div className="relative">
                <motion.p
                  key={current.temperature}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold tabular-nums"
                >
                  {current.temperature.toFixed(1)}
                </motion.p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  °C
                </p>
              </div>
              <div className="mt-3 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.slice(-15)}>
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* SpO2 */}
          <motion.div variants={fadeUp}>
            <div
              className="relative rounded-2xl p-4 sm:p-5 card-shadow overflow-hidden group hover:card-shadow-hover transition-shadow duration-300"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Wind className="w-[18px] h-[18px] text-blue-500" />
                </div>
                <TrendIcon trend={getTrend(data, "spO2")} />
              </div>
              <div className="relative">
                <motion.p
                  key={current.spO2}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold tabular-nums"
                >
                  {current.spO2}
                </motion.p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  % SpO2
                </p>
              </div>
              <div className="mt-3 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.slice(-15)}>
                    <Line
                      type="monotone"
                      dataKey="spO2"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <YAxis domain={[93, 101]} hide />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Chart + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Live Chart */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <div
              className="rounded-2xl p-5 sm:p-6 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold">실시간 심박수</h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    최근 60초
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                  </span>
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    LIVE
                  </span>
                </div>
              </div>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <defs>
                      <linearGradient
                        id="heartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={false}
                      fill="url(#heartGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Alerts */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <div
              className="rounded-2xl p-5 sm:p-6 card-shadow h-full"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold">최근 알림</h3>
                <button className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
                  전체 보기
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                {mockAlerts.slice(0, 4).map((alert, i) => {
                  const Icon = alertIcons[alert.type];
                  const colors = alertColors[alert.type];
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border}`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colors.text}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-relaxed">
                          {alert.message}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Status Bar */}
        <motion.div variants={fadeUp} className="mt-6">
          <div
            className="rounded-2xl p-4 sm:p-5 card-shadow"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-brand-light flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    조끼 배터리
                  </p>
                  <p className="text-sm font-bold">85%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Wind className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    에어백 압력
                  </p>
                  <p className="text-sm font-bold">45%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    조끼 상태
                  </p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">정상</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <ActivityIcon className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    오늘 활성화
                  </p>
                  <p className="text-sm font-bold">3회</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
