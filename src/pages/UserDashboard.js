import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import Navbar from "../components/Navbar";
import TaskCardList from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SF = "-apple-system, 'San Francisco', 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, monospace";

const DARK = {
  bg:             "#000000",
  bgCard:         "rgba(255,241,158,0.04)",
  bgCardAlt:      "rgba(255,241,158,0.02)",
  bgInput:        "rgba(255,241,158,0.05)",
  bgTimerCard:    "rgba(255,241,158,0.05)",
  bgStatsSummary: "rgba(255,241,158,0.03)",
  border:         "rgba(255,241,158,0.1)",
  borderMid:      "rgba(255,241,158,0.18)",
  violet:         "#FFF19E",
  violetDim:      "rgba(255,241,158,0.1)",
  violetBorder:   "rgba(255,241,158,0.22)",
  text:           "#FFF19E",
  textMid:        "rgba(255,241,158,0.75)",
  textDim:        "rgba(255,241,158,0.35)",
  green:          "#10b981",
  greenDim:       "rgba(16,185,129,0.12)",
  greenText:      "#6ee7b7",
  greenBorder:    "rgba(16,185,129,0.25)",
  red:            "#ef4444",
  amber:          "#FFF19E",
  blue:           "#FFF19E",
  shadow:         "0 2px 12px rgba(0,0,0,0.6)",
  shadowCard:     "0 4px 24px rgba(0,0,0,0.5)",
  navInactiveTxt: "rgba(255,241,158,0.4)",
  workingBg:      "rgba(16,185,129,0.15)",
  workingColor:   "#6ee7b7",
  idleBg:         "rgba(255,241,158,0.08)",
  idleColor:      "rgba(255,241,158,0.4)",
  liveChipBg:     "rgba(255,241,158,0.06)",
  liveChipBorder: "rgba(255,241,158,0.2)",
  liveChipText:   "#FFF19E",
  overlayBg:      "rgba(0,0,0,0.88)",
  progressRing:   "#FFF19E",
  progressTrack:  "rgba(255,241,158,0.1)",
};

const LIGHT = {
  bg:             "#FFFFFF",
  bgCard:         "rgba(255,255,255,0.75)",
  bgCardAlt:      "rgba(102,20,20,0.02)",
  bgInput:        "rgba(102,20,20,0.04)",
  bgTimerCard:    "rgba(102,20,20,0.04)",
  bgStatsSummary: "rgba(102,20,20,0.03)",
  border:         "rgba(102,20,20,0.1)",
  borderMid:      "rgba(102,20,20,0.18)",
  violet:         "#661414",
  violetDim:      "rgba(102,20,20,0.07)",
  violetBorder:   "rgba(102,20,20,0.18)",
  text:           "#000000",
  textMid:        "#661414",
  textDim:        "rgba(102,20,20,0.45)",
  green:          "#059669",
  greenDim:       "rgba(5,150,105,0.08)",
  greenText:      "#065f46",
  greenBorder:    "rgba(5,150,105,0.2)",
  red:            "#661414",
  amber:          "#661414",
  blue:           "#661414",
  shadow:         "0 2px 10px rgba(102,20,20,0.08)",
  shadowCard:     "0 4px 20px rgba(102,20,20,0.08)",
  navInactiveTxt: "rgba(102,20,20,0.5)",
  workingBg:      "rgba(5,150,105,0.1)",
  workingColor:   "#065f46",
  idleBg:         "rgba(102,20,20,0.06)",
  idleColor:      "rgba(102,20,20,0.5)",
  liveChipBg:     "rgba(5,150,105,0.07)",
  liveChipBorder: "rgba(5,150,105,0.18)",
  liveChipText:   "#065f46",
  overlayBg:      "rgba(0,0,0,0.5)",
  progressRing:   "#661414",
  progressTrack:  "rgba(102,20,20,0.1)",
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
  const { isDark, toggle: toggleDark, C: custom } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSection, setActiveSection] = useState("tasks");

  const base = isDark ? DARK : LIGHT;
  const C = {
    ...base,
    bg:          custom?.bg     || base.bg,
    border:      custom?.border || base.border,
    borderMid:   custom?.border || base.borderMid,
    violetBorder: custom?.border || base.violetBorder,
    text:        custom?.text   || base.text,
    textMid:     custom?.text   || base.textMid,
    violet:      custom?.text   || base.violet,
    amber:       custom?.text   || base.amber,
    blue:        custom?.text   || base.blue,
  };

  useEffect(() => {
    const q = query(collection(db, "tasks"), where("assignedTo", "array-contains", user.uid));
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
        * { box-sizing: border-box; }
        ::placeholder { color: ${C.textDim}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .nav-btn:hover { background: ${C.violetDim} !important; color: ${C.violet} !important; border-color: ${C.violetBorder} !important; }
        .history-row:hover { border-color: ${C.violetBorder} !important; background: ${C.violetDim} !important; }
        .stat-card:hover { transform: translateY(-2px); }
        .theme-toggle:hover { border-color: ${C.violetBorder} !important; color: ${C.violet} !important; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      <Navbar />

      <div style={S.layout}>
        <aside style={S.sidebar}>
          <div style={S.sidebarBrand}>
            <div style={S.brandMark}>{userData?.name?.[0]?.toUpperCase() || "U"}</div>
            <div>
              <div style={S.brandTitle}>{userData?.name?.split(" ")[0]}</div>
              <div style={S.brandSub}>Team Member</div>
            </div>
          </div>

          <div style={{ ...S.statusBadge, background: isWorking ? C.workingBg : C.idleBg, color: isWorking ? C.workingColor : C.idleColor, border: `1px solid ${isWorking ? C.greenBorder : C.border}` }}>
            <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: isWorking ? C.green : C.textDim, boxShadow: isWorking ? `0 0 6px ${C.green}` : "none", animation: isWorking ? "pulseDot 1.4s infinite" : "none", display:"inline-block" }} />
            {isWorking ? "Currently Working" : "Idle"}
          </div>

          <div style={S.progressCard}>
            <div style={S.progressLabel}>Overall Progress</div>
            <div style={S.ringWrap}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="36" fill="none" stroke={C.progressTrack} strokeWidth="7" />
                <circle cx="45" cy="45" r="36" fill="none" stroke={C.progressRing} strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 45 45)"
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <div style={S.ringInner}>
                <span style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:MONO }}>{progress}%</span>
                <span style={{ fontSize:10, color:C.textDim, fontWeight:600 }}>done</span>
              </div>
            </div>
            <div style={{ fontSize:12, color:C.textDim, marginTop:10 }}>{completedTasks} of {totalTasks} tasks</div>
          </div>

          <nav style={S.nav}>
            {[
              { key:"tasks",   icon:"▦", label:"My Tasks",  count:activeTasks },
              { key:"history", icon:"◷", label:"History",   count:logs.length },
            ].map(item => (
              <button key={item.key} className="nav-btn"
                style={{ ...S.navBtn, ...(activeSection === item.key ? S.navBtnActive : {}) }}
                onClick={() => setActiveSection(item.key)}
              >
                <span style={S.navIcon}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.count > 0 && (
                  <span style={{ ...S.navCount, background: activeSection === item.key ? "rgba(255,255,255,0.2)" : C.violetDim, color: activeSection === item.key ? (isDark ? "#000" : "#fff") : C.violet, border: `1px solid ${activeSection === item.key ? "transparent" : C.violetBorder}` }}>
                    {item.count}
                  </span>
                )}
                {activeSection === item.key && <span style={S.navActivePip} />}
              </button>
            ))}
          </nav>

          <div style={S.sidebarFooter}>
            <button className="theme-toggle" style={S.themeToggle} onClick={toggleDark}>
              <span style={{ fontSize:14 }}>{isDark ? "☀" : "☽"}</span>
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </aside>

        <main style={S.main}>
          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>
                {getTimeOfDay()}, <span style={{ color:C.violet }}>{userData?.name?.split(" ")[0]}</span> 👋
              </h1>
              <p style={S.pageSubtitle}>
                {activeTasks > 0 ? `You have ${activeTasks} active task${activeTasks > 1 ? "s" : ""} to work on` : "All caught up! Great work."}
              </p>
            </div>
            <div style={S.liveChip}>
              <span style={S.liveDot} />
              <span style={{ fontSize:11, color:C.liveChipText, fontWeight:700, letterSpacing:1 }}>
                {new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
              </span>
            </div>
          </div>

          <div style={S.statsGrid}>
            {[
              { label:"Total Tasks",  value:totalTasks,     accent:C.amber, sub:"Assigned",       icon:"✦" },
              { label:"Active",       value:activeTasks,    accent:C.blue,  sub:"In progress",    icon:"⚡" },
              { label:"Completed",    value:completedTasks, accent:C.green, sub:`${progress}% rate`, icon:"✓" },
              { label:"Overdue",      value:overdueTasks,   accent:C.red,   sub:"Need attention", icon:"!" },
            ].map(s => (
              <div key={s.label} style={S.statCard} className="stat-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ ...S.statIcon, color:s.accent, borderColor:s.accent+"44" }}>{s.icon}</div>
                  <div style={{ fontSize:34, fontWeight:800, color:s.accent, fontFamily:MONO, lineHeight:1 }}>{s.value}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:C.textMid, marginTop:12, letterSpacing:0.5, textTransform:"uppercase" }}>{s.label}</div>
                <div style={{ fontSize:11, color:C.textDim, marginTop:3 }}>{s.sub}</div>
                <div style={{ height:3, borderRadius:2, marginTop:14, overflow:"hidden", background:s.accent+"22" }}>
                  <div style={{ height:"100%", borderRadius:2, background:s.accent, width:`${Math.min(100, totalTasks ? (s.value/totalTasks)*100 : 0)}%`, transition:"width 0.6s ease" }} />
                </div>
              </div>
            ))}
          </div>

          {activeSection === "tasks" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>My Tasks</span>
                <span style={S.cardBadge}>{activeTasks} active</span>
              </div>
              <TaskCardList userId={user.uid} theme={C} isDark={isDark} />
            </div>
          )}

          {activeSection === "history" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Session History</span>
                <span style={{ ...S.cardBadge, background:C.greenDim, color:C.greenText, borderColor:C.greenBorder }}>{logs.length} sessions</span>
              </div>
              <p style={S.cardDesc}>All your completed work sessions</p>
              {logs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 0" }}>
                  <div style={{ fontSize:32, color:C.textDim, marginBottom:12 }}>◷</div>
                  <p style={{ color:C.textDim, fontSize:14, margin:"0 0 6px", fontWeight:600 }}>No sessions recorded yet</p>
                  <p style={{ color:C.textDim, fontSize:12, margin:0 }}>Start a task to begin tracking your time</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {logs.map(log => (
                    <div key={log.id} className="history-row" style={S.historyRow}>
                      <div style={S.historyIconWrap}>◷</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>{log.taskTitle}</div>
                        <div style={{ fontSize:11, color:C.textDim }}>
                          {log.endTime?.toDate().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" })}
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

function makeStyles(C) {
  return {
    root: {
      minHeight:"100vh", background:C.bg,
      fontFamily: SF, color:C.text,
      transition:"background 0.3s, color 0.3s",
    },
    layout: { display:"flex", minHeight:"calc(100vh - 60px)" },

    sidebar: {
      width:220, minWidth:220,
      background:C.bgCard,
      backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
      borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column",
      padding:"24px 0",
      position:"sticky", top:0,
      height:"calc(100vh - 60px)", overflowY:"auto",
      transition:"background 0.3s, border-color 0.3s",
    },
    sidebarBrand: {
      display:"flex", alignItems:"center", gap:12,
      padding:"0 20px 20px",
      borderBottom:`1px solid ${C.border}`, marginBottom:16,
    },
    brandMark: {
      width:36, height:36, borderRadius:10,
      background:"linear-gradient(135deg,#FFF19E,#e8d800)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:16, fontWeight:800, color:"#000", flexShrink:0,
    },
    brandTitle: { fontSize:14, fontWeight:700, color:C.text, lineHeight:1.2 },
    brandSub:   { fontSize:10, color:C.textDim, fontWeight:500, letterSpacing:1.5, textTransform:"uppercase" },

    statusBadge: {
      display:"flex", alignItems:"center", gap:8,
      margin:"0 12px 16px", padding:"8px 12px", borderRadius:8,
      fontSize:11, fontWeight:700, letterSpacing:0.3,
    },

    progressCard: {
      margin:"0 12px 16px",
      background:C.bgTimerCard, border:`1px solid ${C.violetBorder}`,
      borderRadius:12, padding:"16px", textAlign:"center",
    },
    progressLabel: { fontSize:10, fontWeight:700, color:C.textDim, letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 },
    ringWrap: { position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" },
    ringInner: { position:"absolute", display:"flex", flexDirection:"column", alignItems:"center" },

    nav: { display:"flex", flexDirection:"column", gap:2, padding:"0 12px", flex:1 },
    navBtn: {
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 12px",
      background:"transparent", border:"1px solid transparent",
      borderRadius:8, color:C.navInactiveTxt,
      fontSize:13, fontWeight:600, cursor:"pointer",
      textAlign:"left", position:"relative",
      fontFamily:SF, letterSpacing:0.3, transition:"all 0.2s",
    },
    navBtnActive: { background:C.violetDim, color:C.violet, borderColor:C.violetBorder },
    navIcon: { fontSize:14, width:18, textAlign:"center", flexShrink:0 },
    navActivePip: {
      position:"absolute", right:10,
      width:5, height:5, borderRadius:"50%",
      background:C.violet, boxShadow:`0 0 6px ${C.violet}99`,
    },
    navCount: { fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 },

    sidebarFooter: { padding:"16px 12px 0", borderTop:`1px solid ${C.border}`, marginTop:16 },
    themeToggle: {
      width:"100%",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      padding:"9px 12px",
      background:C.bgCardAlt, border:`1px solid ${C.border}`,
      borderRadius:8, color:C.textMid,
      fontSize:12, fontWeight:700, cursor:"pointer",
      fontFamily:SF, transition:"all 0.2s",
    },

    main: { flex:1, padding:"28px 32px", overflowX:"hidden", minWidth:0 },

    pageHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 },
    pageTitle:  { margin:"0 0 4px", fontSize:26, fontWeight:800, color:C.text, letterSpacing:-0.5 },
    pageSubtitle: { margin:0, fontSize:13, color:C.textDim, fontWeight:500 },
    liveChip: {
      display:"flex", alignItems:"center", gap:6,
      background:C.liveChipBg, border:`1px solid ${C.liveChipBorder}`,
      borderRadius:20, padding:"5px 12px",
    },
    liveDot: { width:6, height:6, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}` },

    statsGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16, marginBottom:24 },
    statCard: {
      background:C.bgCard,
      backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
      border:`1px solid ${C.border}`,
      borderRadius:14, padding:"20px",
      boxShadow:C.shadow, cursor:"default",
      transition:"transform 0.2s, box-shadow 0.2s",
    },
    statIcon: {
      width:32, height:32, borderRadius:8, border:"1px solid",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:14, fontWeight:700, background:"transparent",
    },

    card: {
      background:C.bgCard,
      backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
      border:`1px solid ${C.border}`,
      borderRadius:16, padding:"24px",
      boxShadow:C.shadowCard,
      transition:"background 0.3s, border-color 0.3s",
    },
    cardHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
    cardTitle:  { fontSize:15, fontWeight:700, color:C.text, letterSpacing:0.3 },
    cardBadge: {
      background:C.violetDim, border:`1px solid ${C.violetBorder}`,
      color:C.violet, borderRadius:20,
      padding:"3px 10px", fontSize:11, fontWeight:700, letterSpacing:0.5,
    },
    cardDesc: { fontSize:12, color:C.textDim, margin:"-12px 0 20px" },

    historyRow: {
      display:"flex", alignItems:"center", gap:14,
      padding:"14px 16px", borderRadius:10,
      border:`1px solid ${C.border}`, background:C.bgCardAlt,
      transition:"all 0.15s", cursor:"default",
    },
    historyIconWrap: {
      width:36, height:36, borderRadius:8,
      background:C.violetDim, border:`1px solid ${C.violetBorder}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:16, color:C.violet, flexShrink:0,
    },
    durationChip: {
      fontFamily:MONO,
      fontSize:13, fontWeight:700, color:C.violet,
      background:C.violetDim, border:`1px solid ${C.violetBorder}`,
      padding:"5px 12px", borderRadius:8, flexShrink:0,
    },
  };
}
