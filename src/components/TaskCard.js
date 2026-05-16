import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useLiveTimer } from "../hooks/useLiveTimer";
import { useTheme } from "../context/ThemeContext";
import { getTaskStatus, getStatusColor, getTypeColor, formatDeadline, isOverdue } from "../utils/taskUtils";

const SF   = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, monospace";

function palette(isDark, custom = {}) {
  const bg     = custom.bg     || (isDark ? "#000000"                : "#FFFFFF");
  const border = custom.border || (isDark ? "rgba(255,241,158,0.3)" : "rgba(102,20,20,0.26)");
  const text   = custom.text   || (isDark ? "#FFF19E"               : "#000000");
  return isDark ? {
    bgCard:        bg === "#000000" ? "rgba(255,241,158,0.05)" : bg,
    bgCardAlt:     "rgba(255,241,158,0.02)",
    bgTimerCard:   "rgba(255,241,158,0.06)",
    border,
    borderMid:     "rgba(255,241,158,0.38)",
    accent:        text,
    accentDim:     "rgba(255,241,158,0.1)",
    text,
    textDim:       "rgba(255,241,158,0.4)",
    red:           "#ef4444",
    green:         "#10b981",
    workingBg:     "rgba(16,185,129,0.15)",
    workingColor:  "#6ee7b7",
    successBg:     "rgba(16,185,129,0.1)",
    successBorder: "rgba(16,185,129,0.28)",
    successText:   "#6ee7b7",
    overlayBg:     "rgba(0,0,0,0.88)",
    shadow:        "0 4px 24px rgba(0,0,0,0.5)",
    startBg:       "linear-gradient(135deg,#FFF19E,#e8d800)",
    startColor:    "#000000",
    startShadow:   "0 4px 12px rgba(255,241,158,0.3)",
    stopBg:        "linear-gradient(135deg,#ef4444,#dc2626)",
    stopColor:     "#ffffff",
    stopShadow:    "0 4px 12px rgba(239,68,68,0.3)",
    delayedBg:     "linear-gradient(135deg,#ef4444,#dc2626)",
    delayedColor:  "#ffffff",
    modalBg:       "rgba(0,0,0,0.95)",
    modalBorder:   border,
    modalShadow:   "0 24px 60px rgba(0,0,0,0.7)",
    cancelBg:      "rgba(255,241,158,0.06)",
    cancelBorder:  border,
    cancelColor:   text,
    confirmBg:     "linear-gradient(135deg,#10b981,#047857)",
    confirmColor:  "#ffffff",
  } : {
    bgCard:        bg === "#FFFFFF" ? "rgba(255,255,255,0.88)" : bg,
    bgCardAlt:     "rgba(102,20,20,0.03)",
    bgTimerCard:   "rgba(102,20,20,0.04)",
    border,
    borderMid:     "rgba(102,20,20,0.34)",
    accent:        text,
    accentDim:     "rgba(102,20,20,0.07)",
    text,
    textDim:       "rgba(102,20,20,0.45)",
    red:           "#661414",
    green:         "#059669",
    workingBg:     "rgba(5,150,105,0.1)",
    workingColor:  "#065f46",
    successBg:     "rgba(5,150,105,0.08)",
    successBorder: "rgba(5,150,105,0.25)",
    successText:   "#065f46",
    overlayBg:     "rgba(0,0,0,0.55)",
    shadow:        "0 4px 20px rgba(102,20,20,0.08)",
    startBg:       "linear-gradient(135deg,#661414,#991b1b)",
    startColor:    "#ffffff",
    startShadow:   "0 4px 12px rgba(102,20,20,0.3)",
    stopBg:        "linear-gradient(135deg,#991b1b,#661414)",
    stopColor:     "#ffffff",
    stopShadow:    "0 4px 12px rgba(102,20,20,0.25)",
    delayedBg:     "linear-gradient(135deg,#661414,#991b1b)",
    delayedColor:  "#ffffff",
    modalBg:       "rgba(255,255,255,0.97)",
    modalBorder:   border,
    modalShadow:   "0 24px 60px rgba(102,20,20,0.15)",
    cancelBg:      "rgba(102,20,20,0.05)",
    cancelBorder:  border,
    cancelColor:   text,
    confirmBg:     "linear-gradient(135deg,#059669,#047857)",
    confirmColor:  "#ffffff",
  };
}

function DescriptionModal({ title, description, onClose, T }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: T.overlayBg, backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.modalBg, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: `1px solid ${T.modalBorder}`, borderRadius: 20, padding: "28px 28px 24px", width: 480, maxWidth: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: T.modalShadow, fontFamily: SF }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0, flex: 1, lineHeight: 1.4 }}>{title}</h3>
          <button onClick={onClose} style={{ background: T.cancelBg, border: `1px solid ${T.cancelBorder}`, borderRadius: 8, color: T.cancelColor, fontSize: 13, fontWeight: 700, padding: "5px 10px", cursor: "pointer", marginLeft: 12, flexShrink: 0, fontFamily: SF }}>✕</button>
        </div>
        <div style={{ height: 1, background: T.modalBorder, marginBottom: 16 }} />
        <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{description}</p>
      </div>
    </div>
  );
}

function ConfirmModal({ taskTitle, onConfirm, onCancel, T }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:T.overlayBg, backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:T.modalBg, backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)", border:`1px solid ${T.modalBorder}`, borderRadius:24, padding:"36px 32px", width:380, textAlign:"center", boxShadow:T.modalShadow, animation:"fadeSlideUp 0.25s ease both", fontFamily:SF }}>
        <div style={{ fontSize:48, marginBottom:14 }}>⚠️</div>
        <h3 style={{ fontSize:20, fontWeight:800, color:T.text, margin:"0 0 12px" }}>Complete Task?</h3>
        <p style={{ fontSize:14, color:T.textDim, lineHeight:1.6 }}>Are you sure you want to mark</p>
        <p style={{ fontSize:15, fontWeight:700, color:T.accent, margin:"6px 0", wordBreak:"break-word" }}>"{taskTitle}"</p>
        <p style={{ fontSize:14, color:T.textDim, lineHeight:1.6 }}>as complete? This cannot be undone.</p>
        <div style={{ display:"flex", gap:10, marginTop:24 }}>
          <button style={{ flex:1, padding:"12px 0", background:T.cancelBg, border:`1.5px solid ${T.cancelBorder}`, borderRadius:12, color:T.cancelColor, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:SF }} onClick={onCancel}>Cancel</button>
          <button style={{ flex:1, padding:"12px 0", background:T.confirmBg, border:"none", borderRadius:12, color:T.confirmColor, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:SF }} onClick={onConfirm}>✔ Yes, Mark Done</button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, userId, getUserName }) {
  const { isDark, C: custom } = useTheme();
  const T = palette(isDark, custom);
  const [activeLog, setActiveLog] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const timer = useLiveTimer(activeLog?.startTime);

  const DESC_LIMIT = 80;

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
    // Permanently store points — never decremented, uses task's custom points value
    const taskPoints = task.points || 10;
    await updateDoc(doc(db, "users", userId), {
      lifetimeCompleted: increment(1),
      lifetimePoints: increment(taskPoints),
    });
  };

  const isRunning  = !!activeLog;
  const overdue    = isOverdue(task);
  const status     = getTaskStatus(task);
  const statusColor = getStatusColor(status);
  const typeColor  = getTypeColor(task.type);
  const isDelayed  = status === "Delayed";
  const accentColor = task.completed ? T.green : isRunning ? T.accent : overdue ? T.red : T.border;

  return (
    <>
      {showConfirm && (
        <ConfirmModal T={T}
          taskTitle={task.title}
          onConfirm={() => { handleComplete(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showDesc && (
        <DescriptionModal T={T} title={task.title} description={task.description} onClose={() => setShowDesc(false)} />
      )}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 16,
        background: isDelayed ? (isDark ? "rgba(239,68,68,0.06)" : "rgba(102,20,20,0.04)") : T.bgCard,
        border: isDelayed ? `1.5px solid ${T.red}44` : `1px solid ${T.border}`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 14, padding: "14px 18px",
        boxShadow: T.shadow,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        fontFamily: SF, opacity: task.completed ? 0.7 : 1,
        transition: "box-shadow 0.2s",
      }}>

        {/* Title + badges + description */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: isDelayed ? T.red : T.text, wordBreak: "break-word", lineHeight: 1.4 }}>{task.title}</span>
            {task.projectName && <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: T.accentDim, color: T.accent, whiteSpace: "nowrap", flexShrink: 0 }}>📁 {task.projectName}</span>}
            <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: typeColor.bg, color: typeColor.text, whiteSpace: "nowrap", flexShrink: 0 }}>{typeColor.label}</span>
            {task.category && <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: T.accentDim, color: T.accent, whiteSpace: "nowrap", flexShrink: 0 }}>{task.category}</span>}
            <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 800, background: statusColor.bg, color: statusColor.text, whiteSpace: "nowrap", flexShrink: 0 }}>{statusColor.label}</span>
            {isRunning && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: T.workingBg, color: T.workingColor, flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.workingColor, animation: "pulseDot 1.2s ease-in-out infinite" }} />
                In Progress
              </span>
            )}
          </div>
          {task.description && (
            <p style={{ fontSize: 12, color: T.textDim, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
              {task.description.length > DESC_LIMIT ? (
                <>
                  {task.description.slice(0, DESC_LIMIT)}&hellip;{" "}
                  <span onClick={() => setShowDesc(true)} style={{ color: T.accent, fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>View description</span>
                </>
              ) : task.description}
            </p>
          )}
          {task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && getUserName && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>Team:</span>
              {task.assignedTo.map(id => {
                const isMe = id === userId;
                return (
                  <span key={id} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: isDark ? "rgba(16,185,129,0.15)" : "rgba(5,150,105,0.1)",
                    color: isDark ? "#6ee7b7" : "#065f46",
                    border: `1px solid ${isDark ? "rgba(16,185,129,0.3)" : "rgba(5,150,105,0.25)"}`,
                  }}>
                    <span style={{ fontSize: 9 }}>{isMe ? "👤" : "👥"}</span>
                    {getUserName(id)}{isMe ? " (you)" : ""}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Deadline */}
        <div style={{ flexShrink: 0, minWidth: 110, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Deadline</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: isDelayed ? T.red : T.textDim }}>{formatDeadline(task.deadline)}</div>
          {isDelayed && <div style={{ fontSize: 10, color: T.red, fontWeight: 700, marginTop: 2 }}>⚠ Overdue</div>}
        </div>

        {/* Points */}
        <div style={{ flexShrink: 0, minWidth: 70, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Points</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 20,
            background: isDark ? "rgba(167,139,250,0.15)" : "rgba(124,58,237,0.1)",
            border: `1px solid ${isDark ? "rgba(167,139,250,0.3)" : "rgba(124,58,237,0.25)"}`,
          }}>
            <span style={{ fontSize: 11 }}>⭐</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#a78bfa" : "#7c3aed", fontFamily: MONO }}>
              {task.points || 10}
            </span>
          </div>
        </div>

        {/* Live timer */}
        <div style={{ flexShrink: 0, minWidth: 100, textAlign: "center" }}>
          {isRunning ? (
            <>
              <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Live</div>
              <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: T.accent, letterSpacing: 1 }}>{timer}</span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: T.textDim }}>—</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {task.completed ? (
            <div style={{ padding: "8px 14px", background: T.successBg, border: `1.5px solid ${T.successBorder}`, color: T.successText, borderRadius: 8, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              ✔ Completed
            </div>
          ) : (
            <>
              {!task.accepted ? (
                <button style={{ padding: "8px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: SF }}
                  onClick={() => updateDoc(doc(db, "tasks", task.id), { accepted: true })}>
                  ✔ Accept
                </button>
              ) : !isRunning ? (
                <button style={{ padding: "8px 14px", background: T.startBg, color: T.startColor, border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12, boxShadow: T.startShadow, fontFamily: SF }}
                  onClick={handleStart}>▶ Start</button>
              ) : (
                <button style={{ padding: "8px 14px", background: T.stopBg, color: T.stopColor, border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12, boxShadow: T.stopShadow, fontFamily: SF }}
                  onClick={handleStop}>■ Stop</button>
              )}
              {task.accepted && (
                <button style={{ padding: "8px 14px", background: T.successBg, border: `1.5px solid ${T.successBorder}`, color: T.successText, borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: SF }}
                  onClick={() => setShowConfirm(true)}>✔ Done</button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function TaskCardList({ userId }) {
  const { isDark, C: custom } = useTheme();
  const T = palette(isDark, custom);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "tasks"), where("assignedTo", "array-contains", userId));
    return onSnapshot(q, snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [userId]);

  useEffect(() => {
    return onSnapshot(collection(db, "users"), snap =>
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const getUserName = (id) => users.find(u => u.id === id)?.name || id;

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.deadline || "").localeCompare(b.deadline || "");
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sortedTasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", background: T.bgCard, borderRadius: 20, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4, fontFamily: SF }}>No tasks yet</p>
          <p style={{ fontSize: 13, color: T.textDim, fontFamily: SF }}>Your assigned tasks will appear here</p>
        </div>
      )}
      {sortedTasks.map(t => <TaskCard key={t.id} task={t} userId={userId} getUserName={getUserName} />)}
    </div>
  );
}
