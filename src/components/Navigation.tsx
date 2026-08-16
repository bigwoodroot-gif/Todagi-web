"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  SlidersHorizontal,
  ShieldAlert,
  Sun,
  Moon,
  Menu,
  X,
  Waves,
  LogOut,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/biometrics", label: "생체 기록", icon: Activity },
  { href: "/control", label: "조끼 제어", icon: SlidersHorizontal },
  { href: "/emergency", label: "비상 연락", icon: ShieldAlert },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("todagi-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const dark = saved === "dark" || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "");
        setUserEmail(user.email || "");
      }
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("todagi-theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col z-40"
        style={{ background: "var(--bg-card)", borderRight: "1px solid var(--border-color)" }}
      >
        <div className="p-6 pb-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight gradient-text">
                토다기
              </h1>
              <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                Smart Weighted Vest
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-brand-600 dark:text-brand-400"
                        : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    }`}
                    style={{
                      color: isActive ? undefined : "var(--text-secondary)",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(14,168,154,0.08), rgba(59,130,246,0.06))",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-[18px] h-[18px] relative z-10 ${
                        isActive ? "text-brand-500" : ""
                      }`}
                    />
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-dot"
                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-500"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 mx-3 mb-2 rounded-xl" style={{ background: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              테마 변경
            </span>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #0ea89a, #0b6c66)"
                  : "#e2e8f0",
              }}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
                animate={{ left: isDark ? "26px" : "2px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {isDark ? (
                  <Moon className="w-3 h-3 text-brand-600" />
                ) : (
                  <Sun className="w-3 h-3 text-amber-500" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div
          className="mx-3 mb-4 p-3 rounded-xl border"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-blue-500 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{userName}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 z-50 glass flex items-center justify-between px-4"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-md shadow-brand-500/20">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold gradient-text">토다기</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {isDark ? (
              <Moon className="w-4 h-4 text-brand-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-14 left-3 right-3 rounded-2xl z-50 lg:hidden p-2 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "text-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : ""
                    }`}
                    style={{
                      color: isActive ? undefined : "var(--text-secondary)",
                    }}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? "text-brand-500" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
              <div
                className="mt-1 pt-2 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 w-full"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  로그아웃
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass"
        style={{ borderTop: "1px solid var(--border-color)" }}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 py-1 px-3"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-500"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? "text-brand-500"
                      : "text-[var(--text-muted)]"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive
                      ? "text-brand-500"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
