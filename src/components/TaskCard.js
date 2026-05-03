import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useLiveTimer } from "../hooks/useLiveTimer";
import { getTaskStatus, getStatusColor, getTypeColor, formatDeadline, isOverdue } from "../utils/taskUtils";

function ConfirmModal({ taskTitle, onConfirm, onCancel }) {
  return (
    <div style={m.overlay}>
      <div style={m.modal}>
        <div style={m.iconWrap}>⚠️</div>
        <h3 style={m.title}>Complete Task?</h3>
        <p style={m.msg}>Are you sure you want to mark</p>
        <p style={m.taskName}>"{taskTitle}"</p>
        <p style={m.msg}>as complete? This cannot be undone.</p>
        <div style={m.actions}>
          <button style={m.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={m.confirmBtn} onClick={onConfirm}>✔ Yes, Mark Done</button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, userId }) {
  const [activeLog, setActiveLog] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const timer = useLiveTimer(activeLog?.startTime);

  useEffect(() => {
    const q = query(
      collection(db, "timeLogs"),
      where("taskId", "==", task.id),
      where("userId", "==", userId),
      where("status", "==", "working")
    );
    return onSnapshot(q, snap => {
      setActiveLog(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, [task.id, userId]);

  const handleStart = async () => {
    if (task.completed) return;
    const runningQ = query(collection(db, "timeLogs"), where("userId", "==", userId), where("status", "==", "working"));
    const { getDocs } = await import("firebase/firestore");
    const running = await getDocs(runningQ);
    for (const d of running.docs) {
      const start = d.data().startTime.toDate();
      const dur = Math.floor((Date.now() - start.getTime()) / 1000);
      await updateDoc(doc(db, "timeLogs", d.id), { endTime: serverTimestamp(), duration: dur, status: "idle" });
    }
    await updateDoc(doc(db, "users", userId), { status: "working" });
    await addDoc(collection(db, "timeLogs"), {
      userId, taskId: task.id, taskTitle: task.title,
      startTime: serverTimestamp(), endTime: null, duration: 0, status: "working",
    });
  };

  const handleStop = async () => {
    if (!activeLog) return;
    const start = activeLog.startTime.toDate();
    const dur = Math.floor((Date.now() - start.getTime()) / 1000);
    await updateDoc(doc(db, "timeLogs", activeLog.id), { endTime: serverTimestamp(), duration: dur, status: "idle" });
    await updateDoc(doc(db, "users", userId), { status: "idle" });
  };

  const handleComplete = async () => {
    if (activeLog) {
      const start = activeLog.startTime.toDate();
      const dur = Math.floor((Date.now() - start.getTime()) / 1000);
      await updateDoc(doc(db, "timeLogs", activeLog.id), { endTime: serverTimestamp(), duration: dur, status: "idle" });
      await updateDoc(doc(db, "users", userId), { status: "idle" });
    }
    await updateDoc(doc(db, "tasks", task.id), { completed: true, status: "Completed" });
  };

  const isRunning = !!activeLog;
  const overdue = isOverdue(task);
  const status = getTaskStatus(task);
  const statusColor = getStatusColor(status);
  const typeColor = getTypeColor(task.type);

  const accentColor = task.completed ? "#10b981" : isRunning ? "#6366f1" : overdue ? "#ef4444" : "#e2e8f0";

  return (
    <>
      {showConfirm && <ConfirmModal taskTitle={task.title} onConfirm={() => { handleComplete(); setShowConfirm(false); }} onCancel={() => setShowConfirm(false)} />}
      <div style={{ ...s.card, borderLeft: `4px solid ${accentColor}`, opacity: task.completed ? 0.75 : 1 }}>
      {/* Running indicator strip */}
      {isRunning && (
        <div style={s.runningStrip}>
          <span style={s.runningDot} />
          <span style={s.runningText}>In Progress</span>
        </div>
      )}

      {/* Header */}
      <div style={s.cardHead}>
        <h3 style={s.title}>{task.title}</h3>
        <div style={s.badges}>
          <span style={{ ...s.badge, background: typeColor.bg, color: typeColor.text }}>{typeColor.label}</span>
          {task.category && <span style={{ ...s.badge, background: "#ede9fe", color: "#7c3aed" }}>{task.category}</span>}
        </div>
      </div>

      {task.description && <p style={s.desc}>{task.description}</p>}

      {/* Footer meta */}
      <div style={s.meta}>
        <span style={{ ...s.metaItem, color: overdue && !task.completed ? "#ef4444" : "#d80a0a", fontWeight: 700}}>
          📅 Deadline : {formatDeadline(task.deadline)}
        </span>
        {overdue && !task.completed && <span style={s.overduePill}>Overdue</span>}
        <span style={{ ...s.statusPill, background: statusColor.bg, color: statusColor.text }}>{statusColor.label}</span>
      </div>

      {/* Live Timer */}
      {isRunning && (
        <div style={s.timerRow}>
          <div style={s.timerLeft}>
            <span style={s.timerIcon}>⏱</span>
            <span style={s.timerTime}>{timer}</span>
          </div>
          <span style={s.liveBadge}>● LIVE</span>
        </div>
      )}

      {/* Actions */}
      <div style={s.actions}>
        {task.completed ? (
          <div style={s.doneBanner}>
            <span>✔</span> Task Completed
          </div>
        ) : (
          <>
            {!isRunning ? (
              <button style={s.startBtn} onClick={handleStart}>▶ Start Timer</button>
            ) : (
              <button style={s.stopBtn} onClick={handleStop}>■ Stop</button>
            )}
            <button style={s.completeBtn} onClick={() => setShowConfirm(true)}>✔ Mark Done</button>
          </>
        )}
      </div>
      </div>
    </>
  );
}

export default function TaskCardList({ userId }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "tasks"), where("assignedTo", "==", userId));
    return onSnapshot(q, snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [userId]);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.deadline || "").localeCompare(b.deadline || "");
  });

  return (
    <div style={s.grid}>
      {sortedTasks.length === 0 && (
        <div style={s.empty}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>No tasks yet</p>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Your assigned tasks will appear here</p>
        </div>
      )}
      {sortedTasks.map(t => <TaskCard key={t.id} task={t} userId={userId} />)}
    </div>
  );
}

const s = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 },
  empty: { gridColumn: "1/-1", textAlign: "center", padding: "60px 0", background: "#fff", borderRadius: 20, border: "1px solid #e8eaf6" },

  card: {
    background: "#fff", borderRadius: 16, padding: "18px 20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e8eaf6",
    transition: "box-shadow 0.2s, transform 0.2s",
    display: "flex", flexDirection: "column", gap: 0,
  },

  runningStrip: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#eef2ff", borderRadius: 8, padding: "5px 10px",
    marginBottom: 12, width: "fit-content",
  },
  runningDot: {
    width: 7, height: 7, borderRadius: "50%", background: "#6366f1",
    display: "inline-block",
    animation: "pulseDot 1.2s ease-in-out infinite",
    boxShadow: "0 0 6px #6366f1",
  },
  runningText: { fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 0.3 },

  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: 700, color: "#1e293b", flex: 1, lineHeight: 1.4, margin: 0 },
  badges: { display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" },
  badge: { padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" },

  desc: { fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 10px" },

  meta: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 },
  metaItem: { fontSize: 12, fontWeight: 500 },
  overduePill: { fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: 6 },
  statusPill: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, marginLeft: "auto" },

  timerRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
    border: "1px solid #c7d2fe", borderRadius: 12,
    padding: "10px 14px", marginBottom: 12,
  },
  timerLeft: { display: "flex", alignItems: "center", gap: 8 },
  timerIcon: { fontSize: 16 },
  timerTime: { fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "#4f46e5", letterSpacing: 2 },
  liveBadge: { fontSize: 10, fontWeight: 800, color: "#6366f1", letterSpacing: 1, background: "#e0e7ff", padding: "3px 8px", borderRadius: 6 },

  actions: { display: "flex", gap: 8, marginTop: 4 },
  startBtn: {
    flex: 1, padding: "10px 0", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13,
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  stopBtn: {
    flex: 1, padding: "10px 0", background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13,
    boxShadow: "0 4px 12px rgba(239,68,68,0.25)",
  },
  completeBtn: {
    flex: 1, padding: "10px 0", background: "#f0fdf4",
    border: "1.5px solid #86efac", color: "#16a34a",
    borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13,
  },
  doneBanner: {
    flex: 1, padding: "10px 0", textAlign: "center",
    background: "#f0fdf4", border: "1.5px solid #86efac",
    color: "#16a34a", borderRadius: 10, fontWeight: 700, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
};

const m = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#fff", borderRadius: 24, padding: "36px 32px",
    width: 380, textAlign: "center",
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
    animation: "fadeSlideUp 0.25s ease both",
  },
  iconWrap: { fontSize: 48, marginBottom: 14 },
  title: { fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 12 },
  msg: { fontSize: 14, color: "#64748b", lineHeight: 1.6 },
  taskName: { fontSize: 15, fontWeight: 700, color: "#6366f1", margin: "6px 0", wordBreak: "break-word" },
  actions: { display: "flex", gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1, padding: "12px 0", background: "#f1f5f9",
    border: "1.5px solid #e2e8f0", borderRadius: 12,
    color: "#64748b", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  confirmBtn: {
    flex: 1, padding: "12px 0",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none", borderRadius: 12,
    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
    boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
  },
};
