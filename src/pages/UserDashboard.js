import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import Navbar from "../components/Navbar";
import TaskCardList from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

export default function UserDashboard() {
  const { user, userData } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);

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

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>📋 My Tasks</h2>
            <p style={styles.sub}>Click Start to begin tracking time on a task</p>
          </div>
          <div style={{ ...styles.statusBadge, background: userData?.status === "working" ? "#dcfce7" : "#f3f4f6", color: userData?.status === "working" ? "#16a34a" : "#6b7280" }}>
            {userData?.status === "working" ? "● Working" : "○ Idle"}
          </div>
        </div>

        {/* Task Count Summary */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{totalTasks}</span>
            <span style={styles.statLabel}>Total Tasks</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNum, color: "#3b82f6" }}>{activeTasks}</span>
            <span style={styles.statLabel}>Active</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNum, color: "#16a34a" }}>{completedTasks}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
        </div>

        <TaskCardList userId={user.uid} />

        {/* Task History */}
        <div style={styles.historySection}>
          <h3 style={styles.historyTitle}>🕓 Task History</h3>
          {logs.length === 0 ? (
            <p style={{ color: "#888", fontSize: 14 }}>No history yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Task", "Date", "Duration"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>{log.taskTitle}</td>
                    <td style={styles.td}>
                      {log.endTime?.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ ...styles.td, fontFamily: "monospace", color: "#667eea" }}>
                      {formatDuration(log.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc" },
  content: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a2e" },
  sub: { margin: "4px 0 0", color: "#888", fontSize: 14 },
  statusBadge: { padding: "8px 18px", borderRadius: 20, fontWeight: 600, fontSize: 14 },
  statsRow: { display: "flex", gap: 16, marginBottom: 28 },
  statCard: {
    flex: 1, background: "#fff", borderRadius: 12, padding: "16px 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center",
  },
  statNum: { fontSize: 32, fontWeight: 700, color: "#1a1a2e" },
  statLabel: { fontSize: 13, color: "#888", marginTop: 2 },
  historySection: { marginTop: 40 },
  historyTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  th: { textAlign: "left", padding: "12px 16px", background: "#f1f5f9", color: "#555", fontSize: 13, fontWeight: 600 },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: 14, color: "#333" },
};
