import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useLiveTimer } from "../hooks/useLiveTimer";
import { getTaskStatus, getStatusColor, getTypeColor, formatDeadline, isOverdue } from "../utils/taskUtils";

function TaskCard({ task, userId }) {
  const [activeLog, setActiveLog] = useState(null);
  const timer = useLiveTimer(activeLog?.startTime);

  useEffect(() => {
    const q = query(
      collection(db, "timeLogs"),
      where("taskId", "==", task.id),
      where("userId", "==", userId),
      where("status", "==", "working")
    );
    const unsub = onSnapshot(q, (snap) => {
      setActiveLog(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
    return unsub;
  }, [task.id, userId]);

  const handleStart = async () => {
    if (task.completed) return; // Don't allow starting completed tasks

    // Stop any other running task first
    const runningQ = query(
      collection(db, "timeLogs"),
      where("userId", "==", userId),
      where("status", "==", "working")
    );
    const { getDocs } = await import("firebase/firestore");
    const running = await getDocs(runningQ);
    for (const d of running.docs) {
      const start = d.data().startTime.toDate();
      const dur = Math.floor((Date.now() - start.getTime()) / 1000);
      await updateDoc(doc(db, "timeLogs", d.id), {
        endTime: serverTimestamp(), duration: dur, status: "idle"
      });
    }
    await updateDoc(doc(db, "users", userId), { status: "working" });
    await addDoc(collection(db, "timeLogs"), {
      userId, taskId: task.id, taskTitle: task.title,
      startTime: serverTimestamp(), endTime: null,
      duration: 0, status: "working"
    });
  };

  const handleStop = async () => {
    if (!activeLog) return;
    const start = activeLog.startTime.toDate();
    const dur = Math.floor((Date.now() - start.getTime()) / 1000);
    await updateDoc(doc(db, "timeLogs", activeLog.id), {
      endTime: serverTimestamp(), duration: dur, status: "idle"
    });
    await updateDoc(doc(db, "users", userId), { status: "idle" });
  };

  const isRunning = !!activeLog;
  const status = getTaskStatus(task);
  const statusColor = getStatusColor(status);
  const typeColor = getTypeColor(task.type);
  const overdue = isOverdue(task);

  return (
    <div style={{ ...styles.card, borderLeft: isRunning ? "4px solid #22c55e" : overdue ? "4px solid #dc2626" : "4px solid #e0e0e0", opacity: task.completed ? 0.6 : 1 }}>
      <div style={styles.cardTop}>
        <h3 style={styles.taskTitle}>{task.title}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ ...styles.badge, background: typeColor.bg, color: typeColor.text, fontSize: 11 }}>
            {typeColor.label}
          </span>
          <span style={{ ...styles.badge, background: statusColor.bg, color: statusColor.text, fontSize: 11 }}>
            {statusColor.label}
          </span>
          {task.category && (
            <span style={{ ...styles.badge, background: "#ede9fe", color: "#6d28d9", fontSize: 11 }}>
              {task.category}
            </span>
          )}
        </div>
      </div>
      
      {task.description && <p style={styles.desc}>{task.description}</p>}
      
      <div style={styles.timeInfo}>
        <span style={{ fontSize: 12, color: overdue ? "#dc2626" : "#888" }}>
          📅 {formatDeadline(task.deadline)}
        </span>
        {overdue && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠️ Overdue</span>}
      </div>

      {isRunning && <div style={styles.timer}>⏱ {timer}</div>}
      
      <div style={styles.actions}>
        {task.completed ? (
          <div style={styles.completedMsg}>✅ Task Completed</div>
        ) : !isRunning ? (
          <button style={styles.startBtn} onClick={handleStart}>▶ Start</button>
        ) : (
          <button style={styles.stopBtn} onClick={handleStop}>■ Stop</button>
        )}
      </div>
    </div>
  );
}

export default function TaskCardList({ userId }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "tasks"), where("assignedTo", "==", userId));
    return onSnapshot(q, (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [userId]);

  // Sort tasks: incomplete first, then by deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.deadline || "").localeCompare(b.deadline || "");
  });

  return (
    <div style={styles.grid}>
      {sortedTasks.length === 0 && <p style={{ color: "#888", gridColumn: "1/-1" }}>No tasks assigned yet.</p>}
      {sortedTasks.map(t => <TaskCard key={t.id} task={t} userId={userId} />)}
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 },
  card: {
    background: "#fff", borderRadius: 12, padding: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 },
  taskTitle: { margin: 0, fontSize: 17, fontWeight: 600, color: "#1a1a2e", flex: 1 },
  badge: { padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  desc: { color: "#666", fontSize: 14, margin: "0 0 8px" },
  timeInfo: { display: "flex", gap: 12, alignItems: "center", margin: "8px 0 12px", fontSize: 12 },
  timer: { fontSize: 28, fontWeight: 700, color: "#667eea", margin: "12px 0", letterSpacing: 2 },
  actions: { display: "flex", gap: 10, marginTop: 12 },
  startBtn: {
    flex: 1, padding: "10px 0", background: "#22c55e", color: "#fff",
    border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14,
  },
  stopBtn: {
    flex: 1, padding: "10px 0", background: "#ef4444", color: "#fff",
    border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14,
  },
  completedMsg: {
    flex: 1, padding: "10px 0", background: "#dcfce7", color: "#16a34a",
    border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, textAlign: "center",
  },
};
