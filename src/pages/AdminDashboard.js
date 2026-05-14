import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, query,
  where, serverTimestamp, doc, updateDoc, getDocs
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { useLiveTimer } from "../hooks/useLiveTimer";
import ReportCharts from "../components/ReportCharts";
import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import EditUserModal from "../components/EditUserModal";
import { deleteDoc } from "firebase/firestore";
import BulkUploadModal from "../components/BulkUploadModal";
import OrganizedLogsList from "../components/OrganizedLogsList";
import { format } from "date-fns";
import { getTaskStatus, getStatusColor, getTypeColor, formatDeadline, isOverdue } from "../utils/taskUtils";
import { getTodaySummary } from "../utils/timeTrackingUtils";
import { useNavigate } from "react-router-dom";

/* ─── Theme Palettes ─── */
const DARK = {
  bg:             "#000000",
  bgCard:         "rgba(255,241,158,0.04)",
  bgCardAlt:      "rgba(255,241,158,0.02)",
  bgInput:        "rgba(255,241,158,0.05)",
  bgTableHead:    "rgba(255,241,158,0.02)",
  bgUserStats:    "rgba(255,241,158,0.03)",
  bgTimerCard:    "rgba(255,241,158,0.05)",
  bgStatsSummary: "rgba(255,241,158,0.03)",
  border:         "rgba(255,241,158,0.3)",
  borderMid:      "rgba(255,241,158,0.38)",
  violet:         "#FFF19E",
  violetDim:      "rgba(255,241,158,0.1)",
  violetBorder:   "rgba(255,241,158,0.42)",
  text:           "#FFF19E",
  textMid:        "rgba(255,241,158,0.75)",
  textDim:        "rgba(255,241,158,0.35)",
  green:          "#10b981",
  greenDim:       "rgba(16,185,129,0.12)",
  greenText:      "#6ee7b7",
  greenBorder:    "rgba(16,185,129,0.4)",
  red:            "#ef4444",
  amber:          "#FFF19E",
  shadow:         "0 2px 12px rgba(0,0,0,0.6)",
  shadowCard:     "0 4px 24px rgba(0,0,0,0.5)",
  shadowBtn:      "0 4px 20px rgba(239,68,68,0.3)",
  confirmBg:      "rgba(255,241,158,0.04)",
  confirmBorder:  "rgba(239,68,68,0.25)",
  navInactiveTxt: "rgba(255,241,158,0.4)",
  workingBg:      "rgba(16,185,129,0.15)",
  workingColor:   "#6ee7b7",
  idleBg:         "rgba(255,241,158,0.08)",
  idleColor:      "rgba(255,241,158,0.4)",
  taskRowBg:      "rgba(255,241,158,0.01)",
  successBg:      "rgba(16,185,129,0.1)",
  successBorder:  "rgba(16,185,129,0.25)",
  successText:    "#6ee7b7",
  liveChipBg:     "rgba(255,241,158,0.06)",
  liveChipBorder: "rgba(255,241,158,0.2)",
  liveChipText:   "#FFF19E",
  overlayBg:      "rgba(0,0,0,0.88)",
};

const LIGHT = {
  bg:             "#FFFFFF",
  bgCard:         "rgba(255,255,255,0.75)",
  bgCardAlt:      "rgba(102,20,20,0.02)",
  bgInput:        "rgba(102,20,20,0.04)",
  bgTableHead:    "rgba(102,20,20,0.03)",
  bgUserStats:    "rgba(102,20,20,0.03)",
  bgTimerCard:    "rgba(102,20,20,0.04)",
  bgStatsSummary: "rgba(102,20,20,0.03)",
  border:         "rgba(102,20,20,0.22)",
  borderMid:      "rgba(102,20,20,0.3)",
  violet:         "#661414",
  violetDim:      "rgba(102,20,20,0.07)",
  violetBorder:   "rgba(102,20,20,0.35)",
  text:           "#000000",
  textMid:        "#661414",
  textDim:        "rgba(102,20,20,0.45)",
  green:          "#059669",
  greenDim:       "rgba(5,150,105,0.08)",
  greenText:      "#065f46",
  greenBorder:    "rgba(5,150,105,0.35)",
  red:            "#661414",
  amber:          "#661414",
  shadow:         "0 2px 10px rgba(102,20,20,0.08)",
  shadowCard:     "0 4px 20px rgba(102,20,20,0.08)",
  shadowBtn:      "0 4px 16px rgba(220,38,38,0.2)",
  confirmBg:      "rgba(255,255,255,0.75)",
  confirmBorder:  "rgba(102,20,20,0.2)",
  navInactiveTxt: "rgba(102,20,20,0.5)",
  workingBg:      "rgba(5,150,105,0.1)",
  workingColor:   "#065f46",
  idleBg:         "rgba(102,20,20,0.06)",
  idleColor:      "rgba(102,20,20,0.5)",
  taskRowBg:      "rgba(102,20,20,0.01)",
  successBg:      "rgba(5,150,105,0.07)",
  successBorder:  "rgba(5,150,105,0.2)",
  successText:    "#065f46",
  liveChipBg:     "rgba(5,150,105,0.07)",
  liveChipBorder: "rgba(5,150,105,0.18)",
  liveChipText:   "#065f46",
  overlayBg:      "rgba(0,0,0,0.5)",
};

function buildPalette(base, custom) {
  return {
    ...base,
    bg:     custom.bg     || base.bg,
    border: custom.border || base.border,
    borderMid: custom.border || base.borderMid,
    violetBorder: custom.border || base.violetBorder,
    text:   custom.text   || base.text,
    textMid: custom.text  || base.textMid,
    violet: custom.text   || base.violet,
    amber:  custom.text   || base.amber,
  };
}

function LiveTimer({ startTime, violet }) {
  const t = useLiveTimer(startTime);
  return <span style={{ color: violet, fontWeight: 700, fontFamily: "'SF Mono', SFMono-Regular, ui-monospace, monospace" }}>{t}</span>;
}

export default function AdminDashboard() {
  const { isDark, toggle: toggleDark, customColors, updateColor, resetColors } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState(null);

  const C = buildPalette(isDark ? DARK : LIGHT, isDark ? customColors.dark : customColors.light);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "users"), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, "tasks"), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, "timeLogs"), s => setTimeLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, []);

  const getActiveLog = (userId) => timeLogs.find(l => l.userId === userId && l.status === "working");
  const getUserName = (id) => users.find(u => u.id === id)?.name || id;
  const getTaskTitle = (id) => tasks.find(t => t.id === id)?.title || id;
  const fmtDur = (s) => {
    if (!s || s === 0) return "0s";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };
  const fmtTime = (ts) => ts?.toDate ? format(ts.toDate(), "HH:mm:ss") : "-";

  const handleMarkCompleted = async (taskId) => {
    await updateDoc(doc(db, "tasks", taskId), { completed: true, status: "Completed" });
  };
  const handleReactivate = async (taskId) => {
    await updateDoc(doc(db, "tasks", taskId), { completed: false, status: "In Progress" });
  };
  const handleDeleteUser = async (userId) => {
    await deleteDoc(doc(db, "users", userId));
    setDeleteConfirm(null);
  };
  const handleToggleBlock = async (u) => {
    await updateDoc(doc(db, "users", u.id), { blocked: !u.blocked });
  };
  const handleDeleteTask = async (taskId) => {
    await deleteDoc(doc(db, "tasks", taskId));
    setDeleteTaskConfirm(null);
    setSuccessMessage("Task deleted successfully");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const projectNames = [...new Set(tasks.map(t => t.projectName).filter(Boolean))].sort();

  const filteredTasks = tasks.filter(task => {
    if (typeFilter !== "all" && task.type !== typeFilter) return false;
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
    if (projectFilter !== "all" && task.projectName !== projectFilter) return false;
    const status = getTaskStatus(task);
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(q);
      const assignedNames = Array.isArray(task.assignedTo)
        ? task.assignedTo.map(id => getUserName(id)).join(" ").toLowerCase()
        : getUserName(task.assignedTo).toLowerCase();
      if (!titleMatch && !assignedNames.includes(q)) return false;
    }
    return true;
  });

  const todaySummary = getTodaySummary(timeLogs, users);
  const workingCount = users.filter(u => u.status === "working").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const delayedTasks = tasks.filter(t => !t.completed && isOverdue(t)).length;

  const tabs = [
    { key: "overview",   label: "Overview",   icon: "⊞" },
    { key: "tasks",      label: "Tasks",      icon: "✦" },
    { key: "users",      label: "Users",      icon: "◈" },
    { key: "daily-time", label: "Daily Time", icon: "◷" },
    { key: "logs",       label: "Logs",       icon: "≡" },
    { key: "reports",    label: "Reports",    icon: "◎" },
    { key: "theme",      label: "Theme",      icon: "🎨" },
  ];

  const S = makeStyles(C);

  return (
    <div style={S.root}>
      <style>{`
        * { box-sizing: border-box; }
        ::placeholder { color: ${C.textDim}; }
        select option { background: ${C.bgCard}; color: ${C.text}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .tab-btn:hover { background: ${C.violetDim} !important; color: ${C.violet} !important; }
        .task-row:hover { background: ${C.violetDim} !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
        .user-card { transition: border-color 0.2s, transform 0.2s; }
        .user-card:hover { border-color: ${C.violetBorder} !important; transform: translateY(-1px); }
        tr.data-row:hover td { background: ${C.violetDim}; }
        input:focus { border-color: ${C.violetBorder} !important; outline: none; }
        select:focus { border-color: ${C.violetBorder} !important; outline: none; }
        .theme-toggle:hover { border-color: ${C.violetBorder} !important; color: ${C.violet} !important; }
      `}</style>
      <Navbar />

      <div style={S.layout}>
        {/* ── Sidebar ── */}
        <aside style={S.sidebar}>
          <div style={S.sidebarBrand}>
            <div style={S.brandMark}>A</div>
            <div>
              <div style={S.brandTitle}>Admin</div>
              <div style={S.brandSub}>Dashboard</div>
            </div>
          </div>

          <nav style={S.nav}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                className="tab-btn"
                style={{ ...S.navBtn, ...(activeTab === tab.key ? S.navBtnActive : {}) }}
                onClick={() => setActiveTab(tab.key)}
              >
                <span style={S.navIcon}>{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.key && <span style={S.navActivePip} />}
              </button>
            ))}
          </nav>

          <div style={S.sidebarFooter}>
            <button
              className="theme-toggle"
              style={S.themeToggle}
              onClick={toggleDark}
              title="Toggle theme"
            >
              <span style={{ fontSize: 14 }}>{isDark ? "☀" : "☽"}</span>
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button style={S.sidebarActionBtn} onClick={() => setShowModal(true)}>
              <span>📋</span> New Task
            </button>
            <button style={{ ...S.sidebarActionBtn, ...S.sidebarActionBtnAlt }} onClick={() => setShowBulkUpload(true)}>
              <span>📤</span> Bulk Upload
            </button>
            <button style={{ ...S.sidebarActionBtn, ...S.sidebarActionBtnAlt }} onClick={() => navigate("/leaderboard")}>
              <span>🏆</span> Leaderboard
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={S.main}>
          {successMessage && (
            <div style={S.successBanner}>
              <span style={S.successDot} />
              {successMessage}
            </div>
          )}

          <div style={S.pageHeader}>
            <div>
              <h1 style={S.pageTitle}>{tabs.find(t => t.key === activeTab)?.label}</h1>
              <p style={S.pageSubtitle}>
                {activeTab === "overview"   && "Real-time team activity and status"}
                {activeTab === "tasks"      && `${filteredTasks.length} tasks · Filter and manage assignments`}
                {activeTab === "users"      && `${users.filter(u => u.role !== "admin").length} team members`}
                {activeTab === "daily-time" && "Time tracked per user today"}
                {activeTab === "logs"       && "Activity logs organized by date"}
                {activeTab === "reports"    && "Analytics and performance charts"}
              </p>
            </div>
            <div style={S.liveChip}>
              <span style={S.liveDot} />
              <span style={{ fontSize: 11, color: C.liveChipText, fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
            </div>
          </div>

          {/* Stats */}
          <div style={S.statsGrid}>
            {[
              { label: "Total Tasks",  value: totalTasks,     accent: C.amber,  sub: "All time",      icon: "✦" },
              { label: "Completed",    value: completedTasks, accent: C.green,  sub: `${totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0}% rate`, icon: "✓" },
              { label: "Delayed",      value: delayedTasks,   accent: C.red,    sub: "Overdue items", icon: "!" },
              { label: "Active Now",   value: workingCount,   accent: C.violet, sub: "Working users", icon: "◷" },
            ].map(s => (
              <div key={s.label} style={S.statCard} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ ...S.statIcon, color: s.accent, borderColor: s.accent + "44" }}>{s.icon}</div>
                  <div style={{ ...S.statValue, color: s.accent }}>{s.value}</div>
                </div>
                <div style={S.statLabel}>{s.label}</div>
                <div style={S.statSub}>{s.sub}</div>
                <div style={{ ...S.statBar, background: s.accent + "22" }}>
                  <div style={{ ...S.statBarFill, background: s.accent, width: s.label === "Active Now" ? "60%" : `${Math.min(100, (s.value / (totalTasks || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Live User Status</span>
                <span style={S.cardBadge}>{users.filter(u => u.role !== "admin").length} members</span>
              </div>
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>{["User", "Email", "Status", "Current Task", "Live Timer"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role !== "admin").map(u => {
                      const log = getActiveLog(u.id);
                      const isWorking = u.status === "working";
                      return (
                        <tr key={u.id} className="data-row">
                          <td style={S.td}>
                            <div style={S.inlineUser}>
                              <div style={{ ...S.miniAvatar, background: isWorking ? C.workingBg : C.idleBg, color: isWorking ? C.workingColor : C.idleColor }}>
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: C.text }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={S.td}><span style={{ color: C.textDim, fontSize: 13 }}>{u.email}</span></td>
                          <td style={S.td}>
                            <span style={{ ...S.statusPill, background: isWorking ? C.greenDim : C.idleBg, color: isWorking ? C.greenText : C.idleColor, borderColor: isWorking ? C.greenBorder : C.border }}>
                              <span style={{ ...S.statusPillDot, background: isWorking ? C.green : C.textDim, boxShadow: isWorking ? `0 0 5px ${C.green}` : "none" }} />
                              {isWorking ? "Working" : "Idle"}
                            </span>
                          </td>
                          <td style={S.td}><span style={{ color: log ? C.violet : C.textDim, fontSize: 13 }}>{log ? getTaskTitle(log.taskId) : "—"}</span></td>
                          <td style={S.td}>{log ? <LiveTimer startTime={log.startTime} violet={C.violet} /> : <span style={{ color: C.textDim }}>—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tasks ── */}
          {activeTab === "tasks" && (
            <div style={S.card}>
              <div style={{ ...S.cardHeader, flexWrap: "wrap", gap: 12 }}>
                <span style={S.cardTitle}>All Tasks</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginLeft: "auto" }}>
                  <div style={S.searchWrap}>
                    <span style={{ position: "absolute", left: 10, fontSize: 16, color: C.textDim, pointerEvents: "none" }}>⌕</span>
                    <input style={S.searchInput} placeholder="Search tasks or users…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    {searchQuery && <button style={S.clearBtn} onClick={() => setSearchQuery("")}>✕</button>}
                  </div>
                  {[
                    { val: projectFilter,  set: setProjectFilter,  opts: [["all","All Projects"], ...projectNames.map(p => [p, p])] },
                    { val: categoryFilter, set: setCategoryFilter, opts: [["all","All Categories"],["Frontend","Frontend"],["Backend","Backend"],["Database","Database"],["Deployment","Deployment"]] },
                    { val: typeFilter,     set: setTypeFilter,     opts: [["all","All Types"],["Task","Task"],["Bug","Bug"]] },
                    { val: statusFilter,   set: setStatusFilter,   opts: [["all","All Status"],["In Progress","In Progress"],["Delayed","Delayed"],["Completed","Completed"]] },
                  ].map((f, i) => (
                    <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={S.filterSelect}>
                      {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ))}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 32, color: C.textDim, marginBottom: 12 }}>✦</div>
                  <p style={{ color: C.textDim, fontSize: 14, margin: 0 }}>No tasks match your filters</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredTasks.map(t => {
                    const status = getTaskStatus(t);
                    const statusColor = getStatusColor(status);
                    const typeColor = getTypeColor(t.type);
                    return (
                      <div key={t.id} style={{ ...S.taskRow, ...(status === "Delayed" ? { borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.04)" } : {}) }} className="task-row">
                        <div style={{ ...S.taskAccent, background: statusColor.text }} />
                        <div style={{ flex: 1 }}>
                          {status === "Delayed" && (
                            <div style={S.delayedBanner}>
                              <span style={S.delayedDot} />
                              <span>⚠️ DELAYED — Deadline passed on {formatDeadline(t.deadline)}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: status === "Delayed" ? "#f87171" : C.text }}>{t.title}</h4>
                            <span style={{ ...S.tag, background: typeColor.bg + "22", color: typeColor.text, borderColor: typeColor.text + "44" }}>{typeColor.label}</span>
                            <span style={{ ...S.tag, background: statusColor.bg + "22", color: statusColor.text, borderColor: statusColor.text + "44", fontWeight: 800 }}>{statusColor.label}</span>
                            {t.category && <span style={{ ...S.tag, background: C.violetDim, color: C.violet, borderColor: C.violetBorder }}>{t.category}</span>}
                            {t.projectName && <span style={{ ...S.tag, background: C.greenDim, color: C.greenText, borderColor: C.greenBorder }}>📁 {t.projectName}</span>}
                          </div>
                          <p style={{ margin: "0 0 10px", fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{t.description || "No description provided"}</p>
                          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>👤 {Array.isArray(t.assignedTo) ? t.assignedTo.map(id => getUserName(id)).join(", ") : getUserName(t.assignedTo)}</span>
                            <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>📅 {formatDeadline(t.deadline)}</span>
                            {t.createdAt && <span style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>Created {format(t.createdAt.toDate?.() || new Date(), "MMM d")}</span>}
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: isDark ? "rgba(167,139,250,0.15)" : "rgba(124,58,237,0.1)", color: isDark ? "#a78bfa" : "#7c3aed", border: `1px solid ${isDark ? "rgba(167,139,250,0.3)" : "rgba(124,58,237,0.25)"}` }}>
                              ⭐ {t.points || 10} pts
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button className="action-btn" onClick={() => setEditingTask(t)} style={S.editBtn}>Edit</button>
                          {!t.completed
                            ? <button className="action-btn" onClick={() => handleMarkCompleted(t.id)} style={S.doneBtn}>Done</button>
                            : <button className="action-btn" onClick={() => handleReactivate(t.id)} style={S.reactivateBtn}>Reactivate</button>
                          }
                          <button className="action-btn" onClick={() => setDeleteTaskConfirm(t)} style={S.deleteTaskBtn}>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Daily Time ── */}
          {activeTab === "daily-time" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Daily Time Summary</span>
                <span style={S.cardBadge}>{todaySummary.length} users tracked</span>
              </div>
              <p style={S.cardDesc}>Cumulative working hours per user for today</p>
              {todaySummary.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 32, color: C.textDim, marginBottom: 12 }}>◷</div>
                  <p style={{ color: C.textDim, fontSize: 14, margin: 0 }}>No time logs recorded today</p>
                </div>
              ) : (
                <div style={S.timeGrid}>
                  {todaySummary.map((item, idx) => (
                    <div key={idx} style={S.timeCard}>
                      <div style={S.timeAvatar}>{item.userName?.[0]?.toUpperCase()}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{item.userName}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.violet, fontFamily: "'SF Mono', SFMono-Regular, ui-monospace, monospace", marginBottom: 4 }}>{item.formattedTime}</div>
                      <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Today</div>
                    </div>
                  ))}
                </div>
              )}
              {todaySummary.length > 0 && (
                <div style={{ padding: "14px 16px", background: C.bgStatsSummary, border: `1px solid ${C.border}`, borderRadius: 10, display: "flex", alignItems: "center" }}>
                  <span style={{ color: C.violet, fontWeight: 700, fontSize: 13 }}>◎ Today's Stats</span>
                  <span style={{ color: C.textDim, fontSize: 13, marginLeft: 12 }}>{todaySummary.length} user(s) logged hours today</span>
                </div>
              )}
            </div>
          )}

          {/* ── Logs ── */}
          {activeTab === "logs" && (
            <div style={S.card}>
              <div style={S.cardHeader}><span style={S.cardTitle}>Activity Logs</span></div>
              <p style={S.cardDesc}>Organized by date · Click a date to expand logs</p>
              <OrganizedLogsList timeLogs={timeLogs} users={users} tasks={tasks} />
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === "users" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Team Members</span>
                <span style={S.cardBadge}>{users.filter(u => u.role !== "admin").length} members</span>
              </div>
              <div style={S.userGrid}>
                {users.map(u => {
                  const userTasks = tasks.filter(t => Array.isArray(t.assignedTo) ? t.assignedTo.includes(u.id) : t.assignedTo === u.id);
                  const done = userTasks.filter(t => t.completed).length;
                  const isWorking = u.status === "working";
                  return (
                    <div key={u.id} style={S.userCard} className="user-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ ...S.userAvatar, background: isWorking ? "linear-gradient(135deg,#10b981,#059669)" : isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)", color: isWorking ? "#fff" : isDark ? "#000" : "#fff" }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                        </div>
                        <span style={{ ...S.roleBadge, ...(u.role === "admin" ? S.roleBadgeAdmin : S.roleBadgeUser) }}>
                          {u.role === "admin" ? "Admin" : "User"}
                        </span>
                        {u.blocked && (
                          <span style={{ padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:800, letterSpacing:0.8, textTransform:"uppercase", border:"1px solid", background:"rgba(239,68,68,0.12)", color:"#f87171", borderColor:"rgba(239,68,68,0.3)" }}>Blocked</span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", background: C.bgUserStats, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 0" }}>
                        {[
                          { val: userTasks.length, label: "Tasks", color: C.text },
                          { val: done, label: "Done", color: C.green },
                          { val: userTasks.length - done, label: "Active", color: (userTasks.length - done) > 0 ? C.amber : C.textDim },
                        ].map((stat, i, arr) => (
                          <div key={stat.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                            <div style={{ flex: 1, textAlign: "center" }}>
                              <span style={{ display: "block", fontSize: 22, fontWeight: 800, color: stat.color, fontFamily: "'SF Mono', SFMono-Regular, ui-monospace, monospace" }}>{stat.val}</span>
                              <span style={{ display: "block", fontSize: 9, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 3 }}>{stat.label}</span>
                            </div>
                            {i < arr.length - 1 && <div style={{ width: 1, height: 30, background: C.border }} />}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: isWorking ? C.green : C.textDim, boxShadow: isWorking ? `0 0 6px ${C.green}` : "none" }} />
                        <span style={{ fontSize: 12, color: isWorking ? C.greenText : C.textDim, fontWeight: 600, letterSpacing: 0.3 }}>
                          {isWorking ? "Currently Working" : "Idle"}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="action-btn" style={S.editUserBtn} onClick={() => setEditingUser(u)}>✏ Edit</button>
                        {u.role !== "admin" && (
                          <button className="action-btn"
                            style={u.blocked ? S.unblockUserBtn : S.blockUserBtn}
                            onClick={() => handleToggleBlock(u)}
                          >
                            {u.blocked ? "✓ Unblock" : "⊘ Block"}
                          </button>
                        )}
                        <button className="action-btn" style={S.deleteUserBtn} onClick={() => setDeleteConfirm(u)}>⊠ Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Reports ── */}
          {activeTab === "reports" && (
            <div style={S.card}>
              <div style={S.cardHeader}><span style={S.cardTitle}>Analytics & Reports</span></div>
              <ReportCharts timeLogs={timeLogs} users={users} tasks={tasks} />
            </div>
          )}

          {/* ── Theme ── */}
          {activeTab === "theme" && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>🎨 Theme Customization</span>
                <button onClick={resetColors} style={{ ...S.editBtn, fontSize: 12 }}>↺ Reset Defaults</button>
              </div>
              <p style={S.cardDesc}>Changes apply instantly across the entire app for all users</p>
              {["dark", "light"].map(mode => (
                <div key={mode} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.violet, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{mode === "dark" ? "☽" : "☀"}</span> {mode === "dark" ? "Dark Mode" : "Light Mode"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                    {[
                      { key: "bg",     label: "Background Color",  icon: "◻" },
                      { key: "border", label: "Border / Outline Color", icon: "▣" },
                      { key: "text",   label: "Text Color",        icon: "T" },
                    ].map(({ key, label, icon }) => (
                      <div key={key} style={{ background: C.bgCardAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                          {icon} {label}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ position: "relative", width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: `2px solid ${C.border}`, flexShrink: 0 }}>
                            <input
                              type="color"
                              value={customColors[mode][key].startsWith("rgba") ? "#888888" : customColors[mode][key]}
                              onChange={e => updateColor(mode, key, e.target.value)}
                              style={{ position: "absolute", inset: "-6px", width: "calc(100% + 12px)", height: "calc(100% + 12px)", border: "none", cursor: "pointer", padding: 0 }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              value={customColors[mode][key]}
                              onChange={e => updateColor(mode, key, e.target.value)}
                              style={{ width: "100%", padding: "7px 10px", background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text, fontFamily: "'SF Mono', monospace", boxSizing: "border-box", outline: "none" }}
                              placeholder="#hex or rgba(...)"
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: 10, height: 28, borderRadius: 6, background: customColors[mode][key], border: `1px solid ${C.border}` }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={S.overlay}>
          <div style={S.confirmModal}>
            <div style={{ fontSize: 40, color: C.red, marginBottom: 16 }}>⊠</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 800, margin: "0 0 10px", letterSpacing: -0.3 }}>Delete User?</h3>
            <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 4px" }}>You're about to permanently remove</p>
            <p style={{ color: C.violet, fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>{deleteConfirm.name}</p>
            <p style={{ color: C.textDim, fontSize: 12, margin: "0 0 28px" }}>Their tasks and time logs will remain intact.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={S.deleteBtn} onClick={() => handleDeleteUser(deleteConfirm.id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirm */}
      {deleteTaskConfirm && (
        <div style={S.overlay}>
          <div style={S.confirmModal}>
            <div style={{ fontSize: 40, color: C.red, marginBottom: 16 }}>✦</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 800, margin: "0 0 10px", letterSpacing: -0.3 }}>Delete Task?</h3>
            <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 4px" }}>You're about to permanently remove</p>
            <p style={{ color: C.violet, fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>{deleteTaskConfirm.title}</p>
            <p style={{ color: C.textDim, fontSize: 12, margin: "0 0 28px" }}>This action cannot be undone. Associated time logs will remain intact.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.cancelBtn} onClick={() => setDeleteTaskConfirm(null)}>Cancel</button>
              <button style={S.deleteBtn} onClick={() => handleDeleteTask(deleteTaskConfirm.id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && <CreateTaskModal users={users} onClose={() => setShowModal(false)} />}
      {editingTask && <EditTaskModal task={editingTask} users={users} onClose={() => setEditingTask(null)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      {showBulkUpload && (
        <BulkUploadModal
          users={users}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            setShowBulkUpload(false);
            setTimeout(() => setSuccessMessage(""), 5000);
          }}
        />
      )}
    </div>
  );
}

/* ─── Styles factory — called with active theme palette ─── */
function makeStyles(C) {
  const SF = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
  const isDark = C.bg === "#000000";
  return {
    root: {
      minHeight: "100vh",
      background: C.bg,
      fontFamily: SF,
      color: C.text,
      transition: "background 0.3s, color 0.3s",
    },
    layout: { display: "flex", minHeight: "calc(100vh - 60px)" },

    sidebar: {
      width: 220, minWidth: 220,
      background: C.bgCard,
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
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
      padding: "0 20px 24px",
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 16,
    },
    brandMark: {
      width: 36, height: 36, borderRadius: 10,
      background: isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, fontWeight: 800, color: isDark ? "#000" : "#fff", flexShrink: 0,
    },
    brandTitle: { fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2 },
    brandSub: { fontSize: 10, color: C.textDim, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" },
    nav: { display: "flex", flexDirection: "column", gap: 2, padding: "0 12px", flex: 1 },
    navBtn: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px",
      background: "transparent", border: "1px solid transparent",
      borderRadius: 8, color: C.navInactiveTxt,
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      textAlign: "left", position: "relative",
      fontFamily: SF, letterSpacing: 0.3,
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
      background: C.violet,
      boxShadow: `0 0 6px ${C.violet}99`,
    },
    sidebarFooter: {
      padding: "16px 12px 0",
      borderTop: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", gap: 8,
      marginTop: 16,
    },
    themeToggle: {
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "9px 12px",
      background: C.bgCardAlt,
      border: `1px solid ${C.border}`,
      borderRadius: 8, color: C.textMid,
      fontSize: 12, fontWeight: 700, cursor: "pointer",
      fontFamily: SF,
      transition: "all 0.2s",
    },
    sidebarActionBtn: {
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "10px 12px",
      background: C.violet,
      border: "none", borderRadius: 8,
      color: isDark ? "#000000" : "#FFFFFF",
      fontSize: 13, fontWeight: 700, cursor: "pointer",
      fontFamily: SF, boxShadow: `0 4px 14px ${C.violet}40`,
    },
    sidebarActionBtnAlt: {
      background: C.violetDim,
      border: `1px solid ${C.violetBorder}`,
      color: C.violet, boxShadow: "none",
    },

    main: { flex: 1, padding: "28px 32px", overflowX: "hidden", minWidth: 0 },

    successBanner: {
      display: "flex", alignItems: "center", gap: 10,
      background: C.successBg, border: `1px solid ${C.successBorder}`,
      borderRadius: 10, padding: "12px 16px",
      marginBottom: 20, fontSize: 13,
      color: C.successText, fontWeight: 600,
    },
    successDot: { width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}`, flexShrink: 0 },

    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -0.5 },
    pageSubtitle: { margin: 0, fontSize: 13, color: C.textDim, fontWeight: 500 },
    liveChip: {
      display: "flex", alignItems: "center", gap: 6,
      background: C.liveChipBg, border: `1px solid ${C.liveChipBorder}`,
      borderRadius: 20, padding: "5px 12px",
    },
    liveDot: { width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` },

    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
    statCard: {
      background: C.bgCard,
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "20px",
      boxShadow: C.shadow, cursor: "default",
    },
    statIcon: {
      width: 32, height: 32, borderRadius: 8, border: "1px solid",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, background: "transparent",
    },
    statValue: { fontSize: 34, fontWeight: 800, lineHeight: 1, fontFamily: "'SF Mono', SFMono-Regular, ui-monospace, monospace" },
    statLabel: { fontSize: 12, fontWeight: 700, color: C.textMid, marginTop: 12, letterSpacing: 0.5, textTransform: "uppercase" },
    statSub: { fontSize: 11, color: C.textDim, marginTop: 3 },
    statBar: { height: 3, borderRadius: 2, marginTop: 14, overflow: "hidden" },
    statBarFill: { height: "100%", borderRadius: 2, transition: "width 0.6s ease" },

    card: {
      background: C.bgCard,
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "24px",
      boxShadow: C.shadowCard,
      transition: "background 0.3s, border-color 0.3s",
    },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    cardTitle: { fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: 0.3 },
    cardBadge: {
      background: C.violetDim, border: `1px solid ${C.violetBorder}`,
      color: C.violet, borderRadius: 20,
      padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    },
    cardDesc: { fontSize: 12, color: C.textDim, margin: "-12px 0 20px" },

    tableWrap: { overflowX: "auto", borderRadius: 10, border: `1px solid ${C.border}` },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "11px 16px", textAlign: "left",
      fontSize: 11, fontWeight: 700, color: C.textDim,
      letterSpacing: 1, textTransform: "uppercase",
      background: C.bgTableHead, borderBottom: `1px solid ${C.border}`,
    },
    td: {
      padding: "13px 16px", fontSize: 13, color: C.textMid,
      borderBottom: `1px solid ${C.border}`,
      transition: "background 0.15s",
    },
    inlineUser: { display: "flex", alignItems: "center", gap: 10 },
    miniAvatar: {
      width: 30, height: 30, borderRadius: 8,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 800, flexShrink: 0,
    },
    statusPill: {
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, border: "1px solid", letterSpacing: 0.3,
    },
    statusPillDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },

    taskRow: {
      display: "flex", gap: 16, padding: "16px",
      borderRadius: 10, border: `1px solid ${C.border}`,
      background: C.taskRowBg, alignItems: "flex-start",
      transition: "background 0.15s, border-color 0.2s", cursor: "default",
    },
    taskAccent: { width: 3, minWidth: 3, borderRadius: 2, alignSelf: "stretch", marginTop: 2 },
    tag: { padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, border: "1px solid", letterSpacing: 0.3 },
    delayedBanner: {
      display: "flex", alignItems: "center", gap: 8,
      background: "linear-gradient(135deg, #ef4444, #dc2626)",
      color: "#fff", borderRadius: 7, padding: "7px 12px",
      fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
      marginBottom: 10, textTransform: "uppercase",
      boxShadow: "0 2px 10px rgba(239,68,68,0.35)",
    },
    delayedDot: {
      width: 7, height: 7, borderRadius: "50%",
      background: "#fff", flexShrink: 0,
      boxShadow: "0 0 6px rgba(255,255,255,0.9)",
      animation: "pulseDot 1s infinite",
    },
    editBtn: {
      padding: "7px 14px", background: C.violetDim,
      border: `1px solid ${C.violetBorder}`, borderRadius: 7,
      color: C.violet, fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },
    doneBtn: {
      padding: "7px 14px", background: C.greenDim,
      border: `1px solid ${C.greenBorder}`, borderRadius: 7,
      color: C.greenText, fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },
    reactivateBtn: {
      padding: "7px 14px",
      background: "rgba(180,83,9,0.1)", border: "1px solid rgba(180,83,9,0.25)",
      borderRadius: 7, color: C.amber,
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },
    deleteTaskBtn: {
      padding: "7px 14px",
      background: isDark ? "rgba(239,68,68,0.1)" : "rgba(102,20,20,0.06)",
      border: isDark ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(102,20,20,0.2)",
      borderRadius: 7,
      color: isDark ? "#f87171" : "#661414",
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },

    searchWrap: { position: "relative", display: "flex", alignItems: "center" },
    searchInput: {
      padding: "8px 32px 8px 30px",
      background: C.bgInput, border: `1px solid ${C.border}`,
      borderRadius: 8, fontSize: 12, width: 220,
      color: C.text, fontFamily: SF,
      transition: "border-color 0.2s", outline: "none",
    },
    clearBtn: {
      position: "absolute", right: 8,
      background: "none", border: "none", cursor: "pointer",
      color: C.textDim, fontSize: 12, padding: 0, lineHeight: 1,
    },
    filterSelect: {
      padding: "8px 10px", background: C.bgInput,
      border: `1px solid ${C.border}`, borderRadius: 8,
      fontSize: 12, cursor: "pointer",
      color: C.textMid, fontFamily: SF, outline: "none",
    },

    timeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 12, marginBottom: 20 },
    timeCard: {
      background: C.bgTimerCard, border: `1px solid ${C.violetBorder}`,
      borderRadius: 12, padding: "20px", textAlign: "center",
    },
    timeAvatar: {
      width: 40, height: 40, borderRadius: 10,
      background: isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, fontWeight: 800, color: isDark ? "#000" : "#fff", margin: "0 auto 12px",
    },

    userGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 14 },
    userCard: {
      background: C.bgCard,
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 18,
      display: "flex", flexDirection: "column", gap: 14, cursor: "default",
    },
    userAvatar: {
      width: 44, height: 44, borderRadius: 12,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0,
    },
    roleBadge: {
      padding: "4px 10px", borderRadius: 20,
      fontSize: 10, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0,
      letterSpacing: 0.8, textTransform: "uppercase", border: "1px solid",
    },
    roleBadgeAdmin: { background: C.violetDim, color: C.violet, borderColor: C.violetBorder },
    roleBadgeUser:  { background: C.greenDim, color: C.greenText, borderColor: C.greenBorder },
    editUserBtn: {
      flex: 1, padding: "9px 0",
      background: C.violetDim,
      border: `1px solid ${C.violetBorder}`,
      borderRadius: 8, color: C.violet,
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },
    deleteUserBtn: {
      flex: 1, padding: "9px 0",
      background: isDark ? "rgba(239,68,68,0.1)" : "rgba(102,20,20,0.06)",
      border: isDark ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(102,20,20,0.2)",
      borderRadius: 8,
      color: isDark ? "#f87171" : "#661414",
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },
    blockUserBtn: {
      flex: 1, padding: "9px 0",
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 8, color: "#f87171",
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },
    unblockUserBtn: {
      flex: 1, padding: "9px 0",
      background: C.greenDim,
      border: `1px solid ${C.greenBorder}`,
      borderRadius: 8, color: C.greenText,
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      fontFamily: SF, transition: "all 0.2s",
    },

    overlay: {
      position: "fixed", inset: 0,
      background: C.overlayBg, backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    },
    confirmModal: {
      background: C.confirmBg,
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      border: `1px solid ${C.confirmBorder}`,
      borderRadius: 20, padding: "40px 36px",
      width: 360, textAlign: "center",
      boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
    },
    cancelBtn: {
      flex: 1, padding: "12px 0",
      background: C.bgCardAlt, border: `1px solid ${C.border}`,
      borderRadius: 10, color: C.textMid,
      fontWeight: 700, fontSize: 14, cursor: "pointer",
      fontFamily: SF,
    },
    deleteBtn: {
      flex: 1, padding: "12px 0",
      background: "linear-gradient(135deg,#661414,#991b1b)",
      border: "none", borderRadius: 10,
      color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
      fontFamily: SF, boxShadow: "0 4px 16px rgba(102,20,20,0.4)",
    },
  };
}
