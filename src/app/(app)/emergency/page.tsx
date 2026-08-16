"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  X,
  Search,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  Loader2,
  UserPlus,
  Trash2,
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

const avatarColors = [
  "from-rose-400 to-pink-500",
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-violet-400 to-purple-500",
];

const priorityColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-slate-400",
];

interface EmergencyContact {
  id: string;
  contact_id: string;
  relation: string;
  priority: number;
  profile: { name: string; email: string };
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  sender: { name: string } | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function Emergency() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [relation, setRelation] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
    fetchNotifications();
  }, []);

  async function fetchContacts() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("emergency_contacts")
      .select("*, profile:contact_id(name, email)")
      .eq("user_id", user.id)
      .order("priority");

    if (data) setContacts(data);
    setLoading(false);
  }

  async function fetchNotifications() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*, sender:sender_id(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setNotifications(data);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, name, email")
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .neq("id", user.id)
      .limit(5);

    const contactIds = contacts.map((c) => c.contact_id);
    setSearchResults(
      (data || []).filter((r) => !contactIds.includes(r.id))
    );
    setSearching(false);
  }

  async function addContact(profile: SearchResult) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: user.id,
      contact_id: profile.id,
      relation: relation || "기타",
      priority: contacts.length + 1,
    });

    if (!error) {
      setShowAddForm(false);
      setSearchQuery("");
      setSearchResults([]);
      setRelation("");
      fetchContacts();
    }
  }

  async function removeContact(id: string) {
    const supabase = createClient();
    await supabase.from("emergency_contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleSOS() {
    setSosActive(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSosActive(false);
      return;
    }

    const userName = user.user_metadata?.name || user.email?.split("@")[0] || "사용자";

    const notificationPromises = contacts.map((contact) =>
      supabase.from("notifications").insert({
        user_id: contact.contact_id,
        sender_id: user.id,
        type: "sos",
        title: "긴급 SOS 알림",
        message: `${userName}님이 긴급 SOS 알림을 보냈습니다. 즉시 확인이 필요합니다.`,
      })
    );

    await Promise.all(notificationPromises);

    setSosSent(true);
    setTimeout(() => {
      setSosActive(false);
      setSosSent(false);
    }, 3000);
  }

  const quickMessages = [
    "긴급 상황 발생! 도움이 필요합니다.",
    "스트레스 수치가 높아지고 있습니다.",
    "발작 징후가 감지되었습니다.",
    "현재 안정 상태로 돌아왔습니다.",
  ];

  async function sendQuickMessage(message: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userName = user.user_metadata?.name || user.email?.split("@")[0] || "사용자";

    const promises = contacts.map((contact) =>
      supabase.from("notifications").insert({
        user_id: contact.contact_id,
        sender_id: user.id,
        type: "stress_alert",
        title: "토다기 상태 알림",
        message: `${userName}: ${message}`,
      })
    );

    await Promise.all(promises);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            비상 연락
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            긴급 상황 시 지정된 계정에 한꺼번에 인앱 알림 전송
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SOS + Contacts */}
          <div className="lg:col-span-2 space-y-6">
            {/* SOS Button Section */}
            <motion.div variants={fadeUp}>
              <div
                className="rounded-2xl p-6 sm:p-8 card-shadow text-center"
                style={{ background: "var(--bg-card)" }}
              >
                <h3 className="text-sm font-semibold mb-2">긴급 SOS 알림</h3>
                <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>
                  모든 비상 연락처 계정에 동시 인앱 알림을 보냅니다
                </p>
                <div className="flex justify-center mb-6">
                  <button
                    onClick={handleSOS}
                    disabled={sosActive || contacts.length === 0}
                    className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full focus:outline-none group disabled:cursor-not-allowed"
                  >
                    {!sosSent && !sosActive && contacts.length > 0 && (
                      <>
                        <div className="sos-ring" style={{ animationDelay: "0s" }} />
                        <div className="sos-ring" style={{ animationDelay: "0.5s" }} />
                        <div className="sos-ring" style={{ animationDelay: "1s" }} />
                      </>
                    )}
                    <motion.div
                      className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
                      animate={{
                        background: sosSent
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : sosActive
                            ? "linear-gradient(135deg, #ef4444, #b91c1c)"
                            : contacts.length === 0
                              ? "linear-gradient(135deg, #94a3b8, #64748b)"
                              : "linear-gradient(135deg, #ef4444, #dc2626)",
                        scale: sosActive && !sosSent ? [1, 0.95, 1] : 1,
                      }}
                      transition={
                        sosActive && !sosSent
                          ? { scale: { duration: 0.8, repeat: Infinity } }
                          : { duration: 0.3 }
                      }
                      whileHover={!sosActive && contacts.length > 0 ? { scale: 1.05 } : {}}
                      whileTap={!sosActive && contacts.length > 0 ? { scale: 0.95 } : {}}
                      style={{
                        boxShadow: sosSent
                          ? "0 8px 32px rgba(16, 185, 129, 0.4)"
                          : contacts.length === 0
                            ? "0 8px 32px rgba(148, 163, 184, 0.3)"
                            : "0 8px 32px rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {sosSent ? (
                          <motion.div
                            key="sent"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex flex-col items-center"
                          >
                            <CheckCircle2 className="w-10 h-10 text-white mb-1" />
                            <span className="text-xs font-bold text-white">전송 완료</span>
                          </motion.div>
                        ) : sosActive ? (
                          <motion.div
                            key="sending"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <Send className="w-8 h-8 text-white mb-1 animate-pulse" />
                            <span className="text-xs font-bold text-white">전송 중...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="ready"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <ShieldAlert className="w-10 h-10 text-white mb-1" />
                            <span className="text-sm font-bold text-white">SOS</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {contacts.length > 0
                    ? `${contacts.length}명의 연락처에 긴급 알림이 전송됩니다`
                    : "비상 연락처를 추가해주세요"}
                </p>
              </div>
            </motion.div>

            {/* Contact List */}
            <motion.div variants={fadeUp}>
              <div
                className="rounded-2xl p-5 sm:p-6 card-shadow"
                style={{ background: "var(--bg-card)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold">비상 연락처</h3>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    계정 추가
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      등록된 연락처가 없습니다
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      계정을 검색하여 비상 연락처를 추가하세요
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact, i) => (
                      <motion.div
                        key={contact.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                        style={{ background: "var(--bg-elevated)" }}
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${priorityColors[Math.min(i, 4)]} flex items-center justify-center`}
                        >
                          <span className="text-[10px] font-bold text-white">
                            {i + 1}
                          </span>
                        </div>

                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center shrink-0`}
                        >
                          <span className="text-xs font-bold text-white">
                            {contact.profile.name.slice(0, 2)}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {contact.profile.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {contact.relation}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {contact.profile.email}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeContact(contact.id)}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Add Contact Form */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-4 p-4 rounded-xl border"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold">계정 검색</h4>
                          <button
                            onClick={() => {
                              setShowAddForm(false);
                              setSearchResults([]);
                              setSearchQuery("");
                            }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label
                              className="text-xs font-medium mb-1 block"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              이름 또는 이메일로 검색
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search
                                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                  style={{ color: "var(--text-muted)" }}
                                />
                                <input
                                  type="text"
                                  placeholder="이름 또는 이메일 입력"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                  className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                                  style={{
                                    background: "var(--bg-elevated)",
                                    borderColor: "var(--border-color)",
                                  }}
                                />
                              </div>
                              <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand hover:opacity-90 transition-opacity disabled:opacity-50"
                              >
                                {searching ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "검색"
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label
                              className="text-xs font-medium mb-1 block"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              관계
                            </label>
                            <div className="relative">
                              <Star
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                style={{ color: "var(--text-muted)" }}
                              />
                              <input
                                type="text"
                                placeholder="가족, 의사, 치료사 등"
                                value={relation}
                                onChange={(e) => setRelation(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                                style={{
                                  background: "var(--bg-elevated)",
                                  borderColor: "var(--border-color)",
                                }}
                              />
                            </div>
                          </div>

                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="space-y-2">
                              <p
                                className="text-xs font-medium"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                검색 결과
                              </p>
                              {searchResults.map((result) => (
                                <div
                                  key={result.id}
                                  className="flex items-center gap-3 p-3 rounded-xl"
                                  style={{ background: "var(--bg-elevated)" }}
                                >
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-blue-500 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                      {result.name.slice(0, 2)}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                      {result.name}
                                    </p>
                                    <p
                                      className="text-[11px] truncate"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {result.email}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => addContact(result)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white gradient-brand hover:opacity-90 transition-opacity"
                                  >
                                    추가
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {searchResults.length === 0 &&
                            searchQuery &&
                            !searching && (
                              <p
                                className="text-xs text-center py-2"
                                style={{ color: "var(--text-muted)" }}
                              >
                                검색 결과가 없습니다
                              </p>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Side Panel */}
          <motion.div variants={fadeUp} className="space-y-4">
            {/* Quick Messages */}
            <div
              className="rounded-2xl p-5 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <h3 className="text-sm font-semibold mb-3">빠른 메시지 전송</h3>
              <div className="space-y-2">
                {quickMessages.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => sendQuickMessage(msg)}
                    disabled={contacts.length === 0}
                    className="w-full text-left p-3 rounded-xl text-xs font-medium transition-all hover:card-shadow-hover disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification History */}
            <div
              className="rounded-2xl p-5 card-shadow"
              style={{ background: "var(--bg-card)" }}
            >
              <h3 className="text-sm font-semibold mb-4">받은 알림</h3>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p
                    className="text-xs text-center py-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    받은 알림이 없습니다
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-2.5">
                      <div className="mt-1">
                        {n.type === "sos" ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                        ) : n.type === "stress_alert" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock
                            className="w-3 h-3"
                            style={{ color: "var(--text-muted)" }}
                          />
                          <span
                            className="text-[10px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
