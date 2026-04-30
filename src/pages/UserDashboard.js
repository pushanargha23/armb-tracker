import Navbar from "../components/Navbar";
import TaskCardList from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";

export default function UserDashboard() {
  const { user, userData } = useAuth();

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
        <TaskCardList userId={user.uid} />
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc" },
  content: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a2e" },
  sub: { margin: "4px 0 0", color: "#888", fontSize: 14 },
  statusBadge: { padding: "8px 18px", borderRadius: 20, fontWeight: 600, fontSize: 14 },
};
