"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge,
  Wind,
  Zap,
  Power,
  RotateCcw,
  CheckCircle2,
  Waves,
  ShieldCheck,
  BatteryMedium,
  Wifi,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const presets = [
  {
    id: "calm",
    label: "차분",
    description: "가볍고 부드러운 압박",
    pressure: 25,
    color: "#10b981",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: Waves,
  },
  {
    id: "moderate",
    label: "보통",
    description: "적당한 안정감 제공",
    pressure: 50,
    color: "#3b82f6",
    bgClass: "bg-blue-50 dark:bg-blue-900/20",
    icon: ShieldCheck,
  },
  {
    id: "firm",
    label: "강한",
    description: "단단한 포옹감 전달",
    pressure: 80,
    color: "#8b5cf6",
    bgClass: "bg-violet-50 dark:bg-violet-900/20",
    icon: Zap,
  },
];

function getPressureColor(p: number): string {
  if (p < 30) return "#10b981";
  if (p < 60) return "#3b82f6";
  if (p < 80) return "#8b5cf6";
  return "#f43f5e";
}

function getPressureLabel(p: number): string {
  if (p < 20) return "매우 약함";
  if (p < 40) return "약함";
  if (p < 60) return "보통";
  if (p < 80) return "강함";
  return "매우 강함";
}

export default function Control() {
  const [pressure, setPressure] = useState(45);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const sendPumpCommand = useCallback(async (command: "pump_on" | "pump_off", pressureValue: number) => {
    setIsSending(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("device_commands").insert({
        user_id: user.id,
        command,
        pressure: pressureValue,
      });
    } catch (e) {
      console.error("명령 전송 실패:", e);
    } finally {
      setIsSending(false);
    }
  }, []);

  const togglePump = useCallback(async () => {
    const next = !isActive;
    setIsActive(next);
    await sendPumpCommand(next ? "pump_on" : "pump_off", next ? pressure : 0);
  }, [isActive, pressure, sendPumpCommand]);

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
    setActivePreset(preset.id);
    setPressure(preset.pressure);
    setIsAutoMode(false);
    if (isActive) {
      sendPumpCommand("pump_on", preset.pressure);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPressure(Number(e.target.value));
    setActivePreset(null);
    setIsAutoMode(false);
  };

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
    if (!isAutoMode) {
      setActivePreset(null);
    }
  };

  const pressureColor = getPressureColor(pressure);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            조끼 제어
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            에어백 압박 세기 및 모드 설정
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <motion.div variants={fadeUp} className="lg:col-span-2 space-y-6">
            {/* Pressure Gauge */}
            <div
              className="rounded-2xl p-6 sm:p-8 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">에어백 압력 제어</h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {isAutoMode ? "자동 모드 활성" : "수동 조절 중"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={togglePump}
                  disabled={isSending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {isSending ? "전송 중..." : isActive ? "작동 중" : "정지됨"}
                </button>
              </div>

              {/* Visual Pressure Display */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="var(--border-subtle)"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke={pressureColor}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 85}`}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 85 * (1 - (isActive ? pressure : 0) / 100),
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{
                        filter: `drop-shadow(0 0 8px ${pressureColor}40)`,
                      }}
                    />
                  </svg>
                  {/* Center display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.p
                      key={pressure}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl sm:text-5xl font-bold tabular-nums"
                      style={{ color: isActive ? pressureColor : "var(--text-muted)" }}
                    >
                      {isActive ? pressure : 0}
                    </motion.p>
                    <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>
                      %
                    </p>
                    <p
                      className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full"
                      style={{
                        color: pressureColor,
                        backgroundColor: `${pressureColor}15`,
                      }}
                    >
                      {isActive ? getPressureLabel(pressure) : "정지"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isActive ? pressure : 0}
                  onChange={handleSliderChange}
                  disabled={!isActive}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: `linear-gradient(to right, ${pressureColor} 0%, ${pressureColor} ${
                      isActive ? pressure : 0
                    }%, var(--border-subtle) ${isActive ? pressure : 0}%, var(--border-subtle) 100%)`,
                    accentColor: pressureColor,
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>0%</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>50%</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>100%</span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div
              className="rounded-2xl p-5 sm:p-6 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <h3 className="text-sm font-semibold mb-4">빠른 설정 프리셋</h3>
              <div className="grid grid-cols-3 gap-3">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      disabled={!isActive}
                      className={`relative rounded-2xl p-4 text-left transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? "ring-2"
                          : "card-shadow hover:card-shadow-hover"
                      }`}
                      style={{
                        background: isSelected
                          ? `${preset.color}08`
                          : "var(--bg-elevated)",
                        // @ts-expect-error CSS custom property
                        "--tw-ring-color": isSelected
                          ? preset.color
                          : "transparent",
                      }}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${preset.bgClass} flex items-center justify-center mb-3`}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: preset.color }}
                        />
                      </div>
                      <p className="text-sm font-semibold">{preset.label}</p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {preset.description}
                      </p>
                      <p
                        className="text-lg font-bold mt-2 tabular-nums"
                        style={{ color: preset.color }}
                      >
                        {preset.pressure}%
                      </p>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3"
                        >
                          <CheckCircle2
                            className="w-5 h-5"
                            style={{ color: preset.color }}
                          />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Side Panel */}
          <motion.div variants={fadeUp} className="space-y-4">
            {/* Auto Mode Toggle */}
            <div
              className="rounded-2xl p-5 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">자동 모드</h3>
                <button
                  onClick={toggleAutoMode}
                  className="relative w-12 h-6 rounded-full transition-colors duration-300"
                  style={{
                    background: isAutoMode
                      ? "linear-gradient(135deg, #0ea89a, #0b6c66)"
                      : "var(--border-color)",
                  }}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: isAutoMode ? "26px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                스마트워치의 스트레스 수치에 따라 자동으로 에어백 압력을 조절합니다.
              </p>
              <AnimatePresence>
                {isAutoMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
                      <div className="flex items-center gap-2 mb-2">
                        <RotateCcw className="w-3.5 h-3.5 text-brand-500 animate-spin" style={{ animationDuration: "3s" }} />
                        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                          자동 조절 활성
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-700 dark:text-brand-300">
                        스트레스 수치에 반응하여 실시간으로 압력이 조정됩니다.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Vest Status */}
            <div
              className="rounded-2xl p-5 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <h3 className="text-sm font-semibold mb-4">조끼 상태</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BatteryMedium className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium">배터리</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: "85%" }} />
                    </div>
                    <span className="text-xs font-bold text-emerald-500">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wifi className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium">연결 상태</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    연결됨
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wind className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-medium">에어백</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: pressureColor }}>
                    {isActive ? getPressureLabel(pressure) : "대기 중"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium">펌프 모터</span>
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? "text-emerald-500" : ""}`}
                    style={{ color: isActive ? undefined : "var(--text-muted)" }}
                  >
                    {isActive ? "작동 중" : "대기"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vest Visual */}
            <div
              className="rounded-2xl p-5 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <h3 className="text-sm font-semibold mb-4">에어백 위치</h3>
              <div className="relative w-full aspect-[3/4] max-w-[200px] mx-auto">
                {/* Vest outline */}
                <svg viewBox="0 0 160 210" className="w-full h-full">
                  <path
                    d="M80 10 C60 10, 30 20, 25 45 L20 90 C18 120, 20 160, 25 190 L135 190 C140 160, 142 120, 140 90 L135 45 C130 20, 100 10, 80 10Z"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Left airbag zones */}
                  <motion.ellipse
                    cx="55" cy="75" rx="20" ry="25"
                    fill={pressureColor}
                    animate={{ opacity: isActive ? [0.15, 0.35, 0.15] : 0.05 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.ellipse
                    cx="55" cy="130" rx="18" ry="22"
                    fill={pressureColor}
                    animate={{ opacity: isActive ? [0.15, 0.35, 0.15] : 0.05 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  {/* Right airbag zones */}
                  <motion.ellipse
                    cx="105" cy="75" rx="20" ry="25"
                    fill={pressureColor}
                    animate={{ opacity: isActive ? [0.15, 0.35, 0.15] : 0.05 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.ellipse
                    cx="105" cy="130" rx="18" ry="22"
                    fill={pressureColor}
                    animate={{ opacity: isActive ? [0.15, 0.35, 0.15] : 0.05 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  />
                </svg>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <p className="text-[10px] font-medium text-center" style={{ color: "var(--text-muted)" }}>
                    4개 구역 에어백
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
