import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useLiveTimer } from "../hooks/useLiveTimer";
import { useTheme } from "../context/ThemeContext";
import { getTaskStatus, getStatusColor, getTypeColor, formatDeadline, isOverdue } from "../utils/taskUtils";

const SF   = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, monospace";

function palette(isDark) {
  return isDark ? {
    bgCard:        "rgba(255,241,158,0.05)",
    bgCardAlt:     "rgba(255,241,158,0.02)",
    bgTimerCard:   "rgba(255,241,158,0.06)",
    border:        "rgba(255,241,158,0.14)",
    borderMid:     "rgba(255,241,158,0.22)",
    accent:        "#FFF19E",
    accentDim:     "rgba(255,241,158,0.1)",
    text:          "#FFF19E",
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
    modalBorder:   "rgba(255,241,158,0.18)",
    modalShadow:   "0 24px 60px rgba(0,0,0,0.7)",
    cancelBg:      "rgba(255,241,158,0.06)",
    cancelBorder:  "rgba(255,241,158,0.18)",
    cancelColor:   "#FFF19E",
    confirmBg:     "linear-gradient(135deg,#10b981,#047857)",
    confirmColor:  "#ffffff",
  } : {
    bgCard:        "rgba(255,255,255,0.88)",
    bgCardAlt:     "rgba(102,20,20,0.03)",
    bgTimerCard:   "rgba(102,20,20,0.04)",
    border:        "rgba(102,20,20,0.12)",
    borderMid:     "rgba(102,20,20,0.2)",
    accent:        "#661414",
    accentDim:     "rgba(102,20,20,0.07)",
    text:          "#000000",
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
    modalBorder:   "rgba(102,20,20,0.15)",
    modalShadow:   "0 24px 60px rgba(102,20,20,0.15)",
    cancelBg:      "rgba(102,20,20,0.05)",
    cancelBorder:  "rgba(102,20,20,0.15)",
    cancelColor:   "#661414",
    confirmBg:     "linear-gradient(135deg,#059669,#047857)",
    confirmColor:  "#ffffff",
  };
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

function TaskCard({ task, userId }) {
  const { isDark } = useTheme();
  const T = palette(isDark);
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
      <div style={{
        background: isDelayed ? (isDark ? "rgba(239,68,68,0.06)" : "rgba(102,20,20,0.04)") : T.bgCard,
        border: isDelayed ? `1.5px solid ${T.red}44` : `1px solid ${T.border}`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 16, padding: "18px 20px",
        boxShadow: T.shadow,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        transition: "box-shadow 0.2s",
        display: "flex", flexDirection: "column", gap: 0,
        fontFamily: SF, opacity: task.completed ? 0.75 : 1,
      }}>

        {isDelayed && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:T.delayedBg, color:T.delayedColor, borderRadius:8, padding:"8px 12px", fontSize:11, fontWeight:800, letterSpacing:0.4, marginBottom:12, textTransform:"uppercase", boxShadow:`0 2px 8px ${T.red}35` }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#fff", flexShrink:0, animation:"pulseDot 1s infinite", boxShadow:"0 0 6px rgba(255,255,255,0.8)" }} />
            <span>⚠ DELAYED — Deadline passed on {formatDeadline(task.deadline)}</span>
          </div>
        )}

        {isRunning && !isDelayed && (
          <div style={{ display:"flex", alignItems:"center", gap:6, background:T.workingBg, borderRadius:8, padding:"5px 10px", marginBottom:12, width:"fit-content" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:T.workingColor, display:"inline-block", animation:"pulseDot 1.2s ease-in-out infinite", boxShadow:`0 0 6px ${T.workingColor}` }} />
            <span style={{ fontSize:11, fontWeight:700, color:T.workingColor, letterSpacing:0.3 }}>In Progress</span>
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:8 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color: isDelayed ? T.red : T.text, flex:1, lineHeight:1.4, margin:0 }}>{task.title}</h3>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
            <span style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700, whiteSpace:"nowrap", background:typeColor.bg, color:typeColor.text }}>{typeColor.label}</span>
            {task.category && <span style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700, whiteSpace:"nowrap", background:T.accentDim, color:T.accent }}>{task.category}</span>}
            <span style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:800, whiteSpace:"nowrap", background:statusColor.bg, color:statusColor.text }}>{statusColor.label}</span>
          </div>
        </div>

        {task.description && <p style={{ fontSize:13, color:T.textDim, lineHeight:1.6, margin:"0 0 10px" }}>{task.description}</p>}

        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:12 }}>
          <span style={{ fontSize:12, fontWeight: isDelayed ? 700 : 500, color: isDelayed ? T.red : T.textDim }}>
            📅 {formatDeadline(task.deadline)}
          </span>
        </div>

        {isRunning && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bgTimerCard, border:`1px solid ${T.borderMid}`, borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>⏱</span>
              <span style={{ fontFamily:MONO, fontSize:22, fontWeight:800, color:T.accent, letterSpacing:2 }}>{timer}</span>
            </div>
            <span style={{ fontSize:10, fontWeight:800, color:T.accent, letterSpacing:1, background:T.accentDim, padding:"3px 8px", borderRadius:6 }}>● LIVE</span>
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {task.completed ? (
            <div style={{ flex:1, padding:"10px 0", textAlign:"center", background:T.successBg, border:`1.5px solid ${T.successBorder}`, color:T.successText, borderRadius:10, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:SF }}>
              <span>✔</span> Task Completed
            </div>
          ) : (
            <>
              {!isRunning
                ? <button style={{ flex:1, padding:"10px 0", background:T.startBg, color:T.startColor, border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13, boxShadow:T.startShadow, fontFamily:SF }} onClick={handleStart}>▶ Start Timer</button>
                : <button style={{ flex:1, padding:"10px 0", background:T.stopBg, color:T.stopColor, border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13, boxShadow:T.stopShadow, fontFamily:SF }} onClick={handleStop}>■ Stop</button>
              }
              <button style={{ flex:1, padding:"10px 0", background:T.successBg, border:`1.5px solid ${T.successBorder}`, color:T.successText, borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:SF }} onClick={() => setShowConfirm(true)}>✔ Mark Done</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function TaskCardList({ userId }) {
  const { isDark } = useTheme();
  const T = palette(isDark);
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
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:16 }}>
      {sortedTasks.length === 0 && (
        <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"60px 0", background:T.bgCard, borderRadius:20, border:`1px solid ${T.border}`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
          <div style={{ fontSize:44, marginBottom:12 }}>📭</div>
          <p style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:4, fontFamily:SF }}>No tasks yet</p>
          <p style={{ fontSize:13, color:T.textDim, fontFamily:SF }}>Your assigned tasks will appear here</p>
        </div>
      )}
      {sortedTasks.map(t => <TaskCard key={t.id} task={t} userId={userId} />)}
    </div>
  );
}
