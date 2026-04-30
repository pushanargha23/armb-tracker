import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, query,
  where, serverTimestamp, doc, updateDoc, getDocs
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useLiveTimer } from "../hooks/useLiveTimer";
import ReportCharts from "../components/ReportCharts";
import CreateTaskModal from "../components/CreateTaskModal";
import BulkUploadModal from "../components/BulkUploadModal";
import OrganizedLogsList from "../components/OrganizedLogsList";
import { format } from "date-fns";
import { getTaskStatus, getStatusColor, getTypeColor, formatDeadline, isOverdue } from "../utils/taskUtils";
import { getTodaySummary } from "../utils/timeTrackingUtils";

function LiveTimer({ startTime }) {
  const t = useLiveTimer(startTime);
  return <span style={{ color: "#667eea", fontWeight: 700 }}>{t}</span>;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");

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

  const filteredTasks = tasks.filter(task => {
    if (typeFilter !== "all" && task.type !== typeFilter) return false;
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
    const status = getTaskStatus(task);
    if (statusFilter !== "all" && status !== statusFilter) return false;
    return true;
  });

  const todaySummary = getTodaySummary(timeLogs, users);
  const workingCount = users.filter(u => u.status === "working").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const delayedTasks = tasks.filter(t => !t.completed && isOverdue(t)).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {successMessage && (
          <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: 12, marginBottom: 16, color: "#166534", fontSize: 14 }}>
            ✓ {successMessage}
          </div>
        )}

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: "Total Tasks", value: totalTasks, color: "#f59e0b", icon: "📋" },
            { label: "Completed", value: completedTasks, color: "#22c55e", icon: "✅" },
            { label: "Delayed", value: delayedTasks, color: "#ef4444", icon: "🔴" },
            { label: "Currently Working", value: workingCount, color: "#8b5cf6", icon: "⏱️" },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ ...styles.statNum, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["overview", "tasks", "daily-time", "logs", "reports"].map(tab => (
            <button key={tab} style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              onClick={() => setActiveTab(tab)}>
              {tab === "daily-time" ? "⏱️ Daily Time" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button style={styles.newTaskBtn} onClick={() => setShowModal(true)}>+ New Task</button>
          <button style={{ ...styles.newTaskBtn, background: "#3b82f6" }} onClick={() => setShowBulkUpload(true)}>📂 Bulk Upload</button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Live User Status</h3>
            <table style={styles.table}>
              <thead>
                <tr>{["User", "Email", "Status", "Current Task", "Live Timer"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.filter(u => u.role !== "admin").map(u => {
                  const log = getActiveLog(u.id);
                  return (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}><strong>{u.name}</strong></td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: u.status === "working" ? "#dcfce7" : "#f3f4f6", color: u.status === "working" ? "#16a34a" : "#6b7280" }}>
                          {u.status === "working" ? "● Working" : "○ Idle"}
                        </span>
                      </td>
                      <td style={styles.td}>{log ? getTaskTitle(log.taskId) : "-"}</td>
                      <td style={styles.td}>{log ? <LiveTimer startTime={log.startTime} /> : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={styles.cardTitle}>📋 All Tasks</h3>
              <div style={{ display: "flex", gap: 12 }}>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Categories</option>
                  <option value="Frontend">🖥️ Frontend</option>
                  <option value="Backend">⚙️ Backend</option>
                  <option value="Database">🗄️ Database (DB)</option>
                  <option value="Deployment">🚀 Deployment</option>
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Types</option>
                  <option value="Task">📋 Task</option>
                  <option value="Bug">🐛 Bug</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
                  <option value="all">All Status</option>
                  <option value="In Progress">🟢 In Progress</option>
                  <option value="Delayed">🔴 Delayed</option>
                  <option value="Completed">✅ Completed</option>
                </select>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No tasks found</p>
            ) : (
              <div style={styles.tasksList}>
                {filteredTasks.map(t => {
                  const status = getTaskStatus(t);
                  const statusColor = getStatusColor(status);
                  const typeColor = getTypeColor(t.type);
                  return (
                    <div key={t.id} style={{ ...styles.taskItem, borderLeft: `4px solid ${statusColor.text}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t.title}</h4>
                            <span style={{ ...styles.typeBadge, background: typeColor.bg, color: typeColor.text }}>{typeColor.label}</span>
                            <span style={{ ...styles.typeBadge, background: statusColor.bg, color: statusColor.text }}>{statusColor.label}</span>
                            {t.category && <span style={{ ...styles.typeBadge, background: "#ede9fe", color: "#6d28d9" }}>{t.category}</span>}
                          </div>
                          <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>{t.description || "No description"}</p>
                          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888", marginTop: 8 }}>
                            <span>👤 {getUserName(t.assignedTo)}</span>
                            <span>📅 {formatDeadline(t.deadline)}</span>
                            {t.createdAt && <span>📆 Created: {format(t.createdAt.toDate?.() || new Date(), "MMM d")}</span>}
                          </div>
                        </div>
                        {!t.completed && (
                          <button
                            onClick={() => handleMarkCompleted(t.id)}
                            style={styles.completeBtn}
                            title="Mark as completed"
                          >
                            ✓ Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Daily Time Tab */}
        {activeTab === "daily-time" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>⏱️ Daily Time Tracking Summary</h3>
            <p style={{ margin: "0 0 16px", color: "#666", fontSize: 13 }}>Total working hours per user per day</p>
            
            {todaySummary.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No time logs today</p>
            ) : (
              <div style={styles.summaryGrid}>
                {todaySummary.map((item, idx) => (
                  <div key={idx} style={styles.summaryCard}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{item.userName}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#667eea", marginTop: 8 }}>
                      {item.formattedTime}
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>Today</div>
                  </div>
                ))}
              </div>
            )}

            {todaySummary.length > 0 && (
              <div style={{ marginTop: 20, padding: 16, background: "#f8f9ff", borderRadius: 8, border: "1px solid #e0e7ff" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#333" }}>📊 Today's Stats</p>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>
                  {todaySummary.length} user(s) logged hours today
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📋 Activity Logs by Date</h3>
            <p style={{ margin: "0 0 16px", color: "#666", fontSize: 13 }}>
              Organized by date with detailed activity records. Click on a date to expand and view all logs for that day.
            </p>
            <OrganizedLogsList timeLogs={timeLogs} users={users} tasks={tasks} />
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && <ReportCharts timeLogs={timeLogs} users={users} tasks={tasks} />}

        {showModal && <CreateTaskModal users={users} onClose={() => setShowModal(false)} />}
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
    </div>
  );
}

const styles = {
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statNum: { fontSize: 36, fontWeight: 700, marginTop: 8 },
  statLabel: { color: "#888", fontSize: 13, marginTop: 4 },
  tabs: { display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" },
  tab: { padding: "8px 20px", border: "none", borderRadius: 8, background: "#e5e7eb", cursor: "pointer", fontWeight: 500, fontSize: 14 },
  activeTab: { background: "#667eea", color: "#fff" },
  newTaskBtn: { padding: "8px 20px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  filterSelect: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer", background: "#fff" },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "#1a1a2e" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #f0f0f0", fontSize: 13, color: "#888", fontWeight: 600 },
  td: { padding: "12px 12px", borderBottom: "1px solid #f8f8f8", fontSize: 14, color: "#333" },
  tr: { transition: "background 0.15s" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  tasksList: { display: "flex", flexDirection: "column", gap: 12 },
  taskItem: { background: "#f9fafb", borderRadius: 8, padding: 16, border: "1px solid #e5e7eb", backgroundColor: "#fafbff" },
  typeBadge: { padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  completeBtn: { padding: "8px 14px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  summaryCard: { background: "#f8f9ff", borderRadius: 8, padding: 16, border: "1px solid #e0e7ff", textAlign: "center" },
};

