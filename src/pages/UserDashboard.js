import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import Navbar from "../components/Navbar";
import TaskCardList from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";

/* ─── Theme Palettes (same as AdminDashboard) ─── */
const DARK = {
  bg:             "#080b12",
  bgCard:         "#0d1117",
  bgCardAlt:      "rgba(255,255,255,0.02)",
  bgInput:        "rgba(255,255,255,0.04)",
  bgTableHead:    "rgba(255,255,255,0.02)",
  bgUserStats:    "rgba(255,255,255,0.03)",
  bgTimerCard:    "rgba(167,139,250,0.05)",
  bgStatsSummary: "rgba(255,255,255,0.02)",
  border:         "rgba(255,255,255,0.06)",
  borderMid:      "rgba(255,255,255,0.10)",
  violet:         "#a78bfa",
  violetDim:      "rgba(167,139,250,0.15)",
  violetBorder:   "rgba(167,139,250,0.25)",
  text:           "#f1f5f9",
  textMid:        "#94a3b8",
  textDim:        "#475569",
  green:          "#10b981",
  greenDim:       "rgba(16,185,129,0.12)",
  greenText:      "#6ee7b7",
  greenBorder:    "rgba(16,185,129,0.25)",
  red:            "#ef4444",
  amber:          "#f59e0b",
  blue:           "#38bdf8",
  blueDim:        "rgba(56,189,248,0.12)",
  blueText:       "#7dd3fc",
  shadow:         "0 2px 12px rgba(0,0,0,0.35)",
  shadowCard:     "0 4px 24px rgba(0,0,0,0.3)",
  navInactiveTxt: "#475569",
  workingBg:      "rgba(16,185,129,0.15)",
  workingColor:   "#6ee7b7",
  idleBg:         "rgba(71,85,105,0.3)",
  idleColor:      "#94a3b8",
  liveChipBg:     "rgba(16,185,129,0.08)",
  liveChipBorder: "rgba(16,185,129,0.2)",
  liveChipText:   "#6ee7b7",
  overlayBg:      "rgba(4,6,12,0.85)",
  progressRing:   "#a78bfa",
  progressTrack:  "rgba(255,255,255,0.06)",
};

const LIGHT = {
  bg:             "#f0f2f8",
  bgCard:         "#ffffff",
  bgCardAlt:      "rgba(0,0,0,0.02)",
  bgInput:        "#f5f6fa",
  bgTableHead:    "#f8f9fc",
  bgUserStats:    "#f5f6fa",
  bgTimerCard:    "rgba(109,40,217,0.04)",
  bgStatsSummary: "#f5f6fa",
  border:         "rgba(0,0,0,0.08)",
  borderMid:      "rgba(0,0,0,0.13)",
  violet:         "#6d28d9",
  violetDim:      "rgba(109,40,217,0.07)",
  violetBorder:   "rgba(109,40,217,0.18)",
  text:           "#0f172a",
  textMid:        "#334155",
  textDim:        "#94a3b8",
  green:          "#059669",
  greenDim:       "rgba(5,150,105,0.08)",
  greenText:      "#065f46",
  greenBorder:    "rgba(5,150,105,0.2)",
  red:            "#dc2626",
  amber:          "#b45309",
  blue:           "#0284c7",
  blueDim:        "rgba(2,132,199,0.08)",
  blueText:       "#0369a1",
  shadow:         "0 2px 10px rgba(0,0,0,0.06)",
  shadowCard:     "0 4px 20px rgba(0,0,0,0.06)",
  navInactiveTxt: "#64748b",
  workingBg:      "rgba(5,150,105,0.1)",
  workingColor:   "#065f46",
  idleBg:         "rgba(100,116,139,0.1)",
  idleColor:      "#64748b",
  liveChipBg:     "rgba(5,150,105,0.07)",
  liveChipBorder: "rgba(5,150,105,0.18)",
  liveChipText:   "#065f46",
  overlayBg:      "rgba(15,23,42,0.55)",
  progressRing:   "#6d28d9",
  progressTrack:  "rgba(0,0,0,0.08)",
};

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sc = seconds % 60;
  return [h, m, sc].map(v => String(v).padStart(2, "0")).join(":");
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function UserDashboard() {
  const { user, userData } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSection, setActiveSection] = useState("tasks");
  const [isDark, setIsDark] = useState(false);

  const C = isDark ? DARK : LIGHT;

  useEffect(() => {
    const q = query(collection(db, "tasks"), where("assignedTo", "==", user.uid));
    return onSnapshot(q, snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user.uid]);

  useEffect(() => {
    const q = query(
      collection(db, "timeLogs"),
      where("userId", "==", user.uid),
      where("status", "==", "idle"),
      orderBy("endTime", "desc")
    );
    return onSnapshot(q, snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user.uid]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
  const isWorking = userData?.status === "working";
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const S = makeStyles(C);

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: ${C.textDim}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .nav-btn:hover { background: ${C.violetDim} !important; color: ${C.violet} !important; border-color: ${C.violetBorder} !important; }
        .history-row:hover { border-color: ${C.violetBorder} !important; background: ${C.violetDim} !important; }
        .stat-card:hover { transform: translateY(-2px); }
        .theme-toggle:hover { border-color: ${C.violetBorder} !important; color: ${C.violet} !important; }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Navbar />

      <div style={S.layout}>
        {/* ── Sidebar ── */}
        <aside style={S.sidebar}>
          {/* Brand / Profile */}
          <div style={S.sidebarBrand}>
            <div style={S.brandMark}>{userData?.name?.[0]?.toUpperCase() || "U"}</div>
            <div>
              <div style={S.brandTitle}>{userData?.name?.split(" ")[0]}</div>
              <div style={S.brandSub}>Team Member</div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            ...S.statusBadge,
            background: isWorking ? C.workingBg : C.idleBg,
            color: isWorking ? C.workingColor : C.idleColor,
            border: `1px solid ${isWorking ? C.greenBorder : C.border}`,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: isWorking ? C.green : C.textDim,
              boxShadow: isWorking ? `0 0 6px ${C.green}` : "none",
              animation: isWorking ? "pulseDot 1.4s infinite" : "none",
              display: "inline-block",
            }} />
            {isWorking ? "Currently Working" : "Idle"}
          </div>

          {/* Progress Ring */}
          <div style={S.progressCard}>
            <div style={S.progressLabel}>Overall Progress</div>
            <div style={S.ringWrap}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke={C.progressTrack} strokeWidth="7" />
                <circle cx="45" cy="45" r="36" fill="none" stroke={C.progressRing} strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 45 45)"
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <div style={S.ringInner}>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{progress}%</span>
                <span style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>done</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 10 }}>{completedTasks} of {totalTasks} tasks</div>
          </div>

          {/* Nav */}
          <nav style={S.nav}>
            {[
              { key: "tasks",   icon: "▦", label: "My Tasks",  count: activeTasks },
              { key: "history", icon: "◷", label: "History",   count: logs.length },
            ].map(item => (
              <button
                key={item.key}
                className="nav-btn"
                style={{ ...S.navBtn, ...(activeSection === item.key ? S.navBtnActive : {}) }}
                onClick={() => setActiveSection(item.key)}
              >
                <span style={S.navIcon}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count > 0 && (
                  <span style={{
                    ...S.navCount,
                    background: activeSection === item.key ? "rgba(255,255,255,0.2)" : C.violetDim,
                    color: activeSection === item.key ? "#fff" : C.violet,
                    border: `1px solid ${activeSection === item.key ? "transparent" : C.violetBorder}`,
                  }}>
                    {item.count}
                  </span>
                )}
                {activeSection === item.key && <span style={S.navActivePip} />}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div style={S.sidebarFooter}>
            <button
              className="theme-toggle"
              style={S.themeToggle}
              onClick={() => setIsDark(d => !d)}
            >
              <span style={{ fontSize: 14 }}>{isDark ? "☀" : "☽"}</span>
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={S.main}>
          {/* Page Header */}
          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>
                {getTimeOfDay()}, <span style={{ color: C.violet }}>{userData?.name?.split(" ")[0]}</span> 👋
              </h1>
              <p style={S.pageSubtitle}>
                {activeTasks > 0
                  ? `You have ${activeTasks} active task${activeTasks > 1 ? "s" : ""} to work on`
                  : "All caught up! Great work."}
              </p>
            </div>
            <div style={S.liveChip}>
              <span style={S.liveDot} />
              <span style={{ fontSize: 11, color: C.liveChipText, fontWeight: 700, letterSpacing: 1 }}>
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={S.statsGrid}>
            {[
              { label: "Total Tasks",  value: totalTasks,     accent: C.amber,  sub: "Assigned",      icon: "✦" },
              { label: "Active",       value: activeTasks,    accent: C.blue,   sub: "In progress",   icon: "⚡" },
              { label: "Completed",    value: completedTasks, accent: C.green,  sub: `${progress}% rate`, icon: "✓" },
              { label: "Overdue",      value: overdueTasks,   accent: C.red,    sub: "Need attention", icon: "!" },
            ].map(s => (
              <div key={s.label} style={S.statCard} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ ...S.statIcon, color: s.accent, borderColor: s.accent + "44" }}>{s.icon}</div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: s.accent, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.value}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginTop: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{s.sub}</div>
                <div style={{ height: 3, borderRadius: 2, marginTop: 14, overflow: "hidden", background: s.accent + "22" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: s.accent, width: `${Math.min(100, totalTasks ? (s.value / totalTasks) * 100 : 0)}%`, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── My Tasks ── */}
          {activeSection === "tasks" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>My Tasks</span>
                <span style={S.cardBadge}>{activeTasks} active</span>
              </div>
              <TaskCardList userId={user.uid} />
            </div>
          )}

          {/* ── History ── */}
          {activeSection === "history" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Session History</span>
                <span style={{ ...S.cardBadge, background: C.greenDim, color: C.greenText, borderColor: C.greenBorder }}>{logs.length} sessions</span>
              </div>
              <p style={S.cardDesc}>All your completed work sessions</p>

              {logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 32, color: C.textDim, marginBottom: 12 }}>◷</div>
                  <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 6px", fontWeight: 600 }}>No sessions recorded yet</p>
                  <p style={{ color: C.textDim, fontSize: 12, margin: 0 }}>Start a task to begin tracking your time</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {logs.map((log) => (
                    <div key={log.id} className="history-row" style={S.historyRow}>
                      <div style={S.historyIconWrap}>◷</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{log.taskTitle}</div>
                        <div style={{ fontSize: 11, color: C.textDim }}>
                          {log.endTime?.toDate().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <div style={S.durationChip}>{formatDuration(log.duration)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── Styles factory ─── */
function makeStyles(C) {
  return {
    root: {
      minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Syne', sans-serif",
      color: C.text,
      transition: "background 0.3s, color 0.3s",
    },
    layout: { display: "flex", minHeight: "calc(100vh - 60px)" },

    sidebar: {
      width: 220, minWidth: 220,
      background: C.bgCard,
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      padding: "24px 0",
      position: "sticky", top: 0,
      height: "calc(100vh - 60px)",
      overflowY: "auto",
      transition: "background 0.3s, border-color 0.3s",
    },
    sidebarBrand: {
      display: "flex", alignItems: "center", gap: 12,
      padding: "0 20px 20px",
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 16,
    },
    brandMark: {
      width: 36, height: 36, borderRadius: 10,
      background: "linear-gradient(135deg,#7c3aed,#6366f1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0,
    },
    brandTitle: { fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2 },
    brandSub:   { fontSize: 10, color: C.textDim, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" },

    statusBadge: {
      display: "flex", alignItems: "center", gap: 8,
      margin: "0 12px 16px",
      padding: "8px 12px", borderRadius: 8,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
    },

    progressCard: {
      margin: "0 12px 16px",
      background: C.bgTimerCard, border: `1px solid ${C.violetBorder}`,
      borderRadius: 12, padding: "16px", textAlign: "center",
    },
    progressLabel: { fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 },
    ringWrap: { position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" },
    ringInner: { position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" },

    nav: { display: "flex", flexDirection: "column", gap: 2, padding: "0 12px", flex: 1 },
    navBtn: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px",
      background: "transparent", border: "1px solid transparent",
      borderRadius: 8, color: C.navInactiveTxt,
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      textAlign: "left", position: "relative",
      fontFamily: "'Syne', sans-serif", letterSpacing: 0.3,
      transition: "all 0.2s",
    },
    navBtnActive: {
      background: C.violetDim,
      color: C.violet,
      borderColor: C.violetBorder,
    },
    navIcon: { fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 },
    navActivePip: {
      position: "absolute", right: 10,
      width: 5, height: 5, borderRadius: "50%",
      background: C.violet, boxShadow: `0 0 6px ${C.violet}99`,
    },
    navCount: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 },

    sidebarFooter: {
      padding: "16px 12px 0",
      borderTop: `1px solid ${C.border}`,
      marginTop: 16,
    },
    themeToggle: {
      width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "9px 12px",
      background: C.bgCardAlt, border: `1px solid ${C.border}`,
      borderRadius: 8, color: C.textMid,
      fontSize: 12, fontWeight: 700, cursor: "pointer",
      fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
    },

    main: { flex: 1, padding: "28px 32px", overflowX: "hidden", minWidth: 0 },

    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    pageTitle:  { margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -0.5 },
    pageSubtitle: { margin: 0, fontSize: 13, color: C.textDim, fontWeight: 500 },
    liveChip: {
      display: "flex", alignItems: "center", gap: 6,
      background: C.liveChipBg, border: `1px solid ${C.liveChipBorder}`,
      borderRadius: 20, padding: "5px 12px",
    },
    liveDot: { width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` },

    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
    statCard: {
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "20px",
      boxShadow: C.shadow, cursor: "default",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    statIcon: {
      width: 32, height: 32, borderRadius: 8, border: "1px solid",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, background: "transparent",
    },

    card: {
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "24px",
      boxShadow: C.shadowCard,
      transition: "background 0.3s, border-color 0.3s",
    },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    cardTitle:  { fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: 0.3 },
    cardBadge: {
      background: C.violetDim, border: `1px solid ${C.violetBorder}`,
      color: C.violet, borderRadius: 20,
      padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    },
    cardDesc: { fontSize: 12, color: C.textDim, margin: "-12px 0 20px" },

    historyRow: {
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px", borderRadius: 10,
      border: `1px solid ${C.border}`, background: C.bgCardAlt,
      transition: "all 0.15s", cursor: "default",
    },
    historyIconWrap: {
      width: 36, height: 36, borderRadius: 8,
      background: C.violetDim, border: `1px solid ${C.violetBorder}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, color: C.violet, flexShrink: 0,
    },
    durationChip: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13, fontWeight: 700, color: C.violet,
      background: C.violetDim, border: `1px solid ${C.violetBorder}`,
      padding: "5px 12px", borderRadius: 8, flexShrink: 0,
    },
  };
}