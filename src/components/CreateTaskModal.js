import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { format, addDays } from "date-fns";

const SF = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

function makeStyles(isDark) {
  const modalBg    = isDark ? "rgba(0,0,0,0.96)"                : "rgba(255,255,255,0.97)";
  const border     = isDark ? "rgba(255,241,158,0.35)"           : "rgba(102,20,20,0.28)";
  const shadow     = isDark ? "0 24px 60px rgba(0,0,0,0.7)"     : "0 24px 60px rgba(102,20,20,0.15)";
  const titleColor = isDark ? "#FFF19E"                          : "#000000";
  const subColor   = isDark ? "rgba(255,241,158,0.4)"            : "rgba(102,20,20,0.5)";
  const labelColor = isDark ? "#FFF19E"                          : "#661414";
  const inputBg    = isDark ? "rgba(255,241,158,0.05)"           : "rgba(102,20,20,0.03)";
  const inputBdr   = isDark ? "rgba(255,241,158,0.35)"           : "rgba(102,20,20,0.3)";
  const inputColor = isDark ? "#FFF19E"                          : "#000000";
  const hintColor  = isDark ? "rgba(255,241,158,0.35)"           : "rgba(102,20,20,0.4)";
  const closeBg    = isDark ? "rgba(255,241,158,0.08)"           : "rgba(102,20,20,0.06)";
  const closeBdr   = isDark ? "rgba(255,241,158,0.35)"           : "rgba(102,20,20,0.28)";
  const iconBg     = isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)";
  const errBg      = isDark ? "rgba(239,68,68,0.1)"              : "rgba(102,20,20,0.06)";
  const errBdr     = isDark ? "rgba(239,68,68,0.4)"              : "rgba(102,20,20,0.3)";
  const errColor   = isDark ? "#fca5a5"                          : "#661414";
  const cancelBg   = isDark ? "rgba(255,241,158,0.06)"           : "rgba(102,20,20,0.05)";
  const cancelBdr  = isDark ? "rgba(255,241,158,0.35)"           : "rgba(102,20,20,0.28)";
  const cancelTx   = isDark ? "#FFF19E"                          : "#661414";
  const createBg   = isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)";
  const createTx   = isDark ? "#000000"                          : "#FFFFFF";
  const createShdw = isDark ? "0 4px 14px rgba(255,241,158,0.25)" : "0 4px 14px rgba(102,20,20,0.35)";

  return {
    overlay: {
      position: "fixed", inset: 0, zIndex: 1000,
      background: isDark ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.55)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    modal: {
      background: modalBg,
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      border: `1px solid ${border}`,
      borderRadius: 20, padding: "28px 28px 24px",
      maxWidth: 500, width: "90%", maxHeight: "90vh", overflowY: "auto",
      boxShadow: shadow, fontFamily: SF,
    },
    header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
    iconWrap: {
      width: 44, height: 44, borderRadius: 12,
      background: iconBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, flexShrink: 0,
    },
    title: { fontSize: 18, fontWeight: 800, color: titleColor, margin: 0 },
    sub:   { fontSize: 12, color: subColor, margin: "2px 0 0" },
    closeBtn: {
      marginLeft: "auto", background: closeBg,
      border: `1px solid ${closeBdr}`, borderRadius: 8,
      color: labelColor, fontSize: 13, fontWeight: 700,
      padding: "6px 10px", cursor: "pointer", flexShrink: 0,
    },
    label: {
      display: "block", margin: "0 0 6px",
      fontWeight: 700, fontSize: 12, color: labelColor,
      letterSpacing: 0.5, textTransform: "uppercase",
    },
    input: {
      display: "block", width: "100%", padding: "11px 14px",
      border: `1px solid ${inputBdr}`, borderRadius: 10,
      fontSize: 14, marginBottom: 16, fontFamily: SF,
      background: inputBg, color: inputColor,
      boxSizing: "border-box", outline: "none",
      transition: "border-color 0.2s",
    },
    row:  { display: "flex", gap: 12 },
    hint: { margin: "-10px 0 16px", fontSize: 11, color: hintColor },
    errorBox: {
      background: errBg, border: `1px solid ${errBdr}`,
      borderRadius: 10, padding: "10px 14px", marginBottom: 16,
      color: errColor, fontSize: 13, fontWeight: 600,
    },
    actions: { display: "flex", gap: 10, marginTop: 8 },
    createBtn: {
      flex: 1, padding: "12px 0",
      background: createBg, color: createTx,
      border: "none", borderRadius: 10,
      fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: SF,
      boxShadow: createShdw,
    },
    cancelBtn: {
      flex: 1, padding: "12px 0",
      background: cancelBg, border: `1px solid ${cancelBdr}`,
      color: cancelTx, borderRadius: 10,
      fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: SF,
    },
  };
}

export default function CreateTaskModal({ users, onClose }) {
  const { isDark } = useTheme();
  const { userData } = useAuth();
  const s = makeStyles(isDark);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [projectName, setProjectName] = useState("");
  const [assignedTo, setAssignedTo] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [type, setType] = useState("Task");
  const [category, setCategory] = useState("Frontend");
  const [error, setError] = useState("");

  const toggleUser = (uid) =>
    setAssignedTo(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim())       { setError("Task title is required"); return; }
    if (!projectName.trim()) { setError("Project name is required"); return; }
    if (!assignedTo.length)  { setError("Please assign the task to at least one user"); return; }
    if (!deadline)           { setError("Please set a deadline"); return; }
    if (isNaN(new Date(deadline).getTime())) { setError("Invalid deadline date"); return; }
    try {
      await addDoc(collection(db, "tasks"), {
        title: title.trim(), description: desc.trim(),
        projectName: projectName.trim(),
        assignedTo, deadline, type, category,
        status: "In Progress", completed: false,
        createdBy: userData.id, createdAt: serverTimestamp(),
      });
      setTitle(""); setDesc(""); setAssignedTo([]); setDeadline(""); setProjectName("");
      setType("Task"); setCategory("Frontend");
      onClose();
    } catch (err) { setError(err.message); }
  };

  const defaultDeadline = format(addDays(new Date(), 7), "yyyy-MM-dd");

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.iconWrap}>📋</div>
          <div>
            <h3 style={s.title}>Create New Task</h3>
            <p style={s.sub}>Fill in the details below</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={s.errorBox}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Task Title *</label>
          <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter task title" required />

          <label style={s.label}>Project Name *</label>
          <input style={s.input} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. College Website, Mobile App" required />

          <label style={s.label}>Description</label>
          <textarea style={{ ...s.input, height: 80, resize: "vertical" }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" />

          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Category *</label>
              <select style={s.input} value={category} onChange={e => setCategory(e.target.value)} required>
                <option value="Frontend">🖥️ Frontend</option>
                <option value="Backend">⚙️ Backend</option>
                <option value="Database">🗄️ Database</option>
                <option value="Deployment">🚀 Deployment</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Task Type *</label>
              <select style={s.input} value={type} onChange={e => setType(e.target.value)} required>
                <option value="Task">📋 Task</option>
                <option value="Bug">🐛 Bug</option>
              </select>
            </div>
          </div>

          <label style={s.label}>Deadline *</label>
          <input style={s.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={format(new Date(), "yyyy-MM-dd")} required />
          <p style={s.hint}>Suggested: {defaultDeadline}</p>

          <label style={s.label}>Assign To * {assignedTo.length > 0 && `(${assignedTo.length} selected)`}</label>
          <div style={{ ...s.input, height: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
            {users.filter(u => u.role !== "admin").sort((a, b) => a.name.localeCompare(b.name)).map(u => (
              <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: s.input.color }}>
                <input
                  type="checkbox"
                  checked={assignedTo.includes(u.id)}
                  onChange={() => toggleUser(u.id)}
                  style={{ accentColor: s.label.color, width: 15, height: 15 }}
                />
                {u.name} <span style={{ opacity: 0.5, fontSize: 11 }}>({u.email})</span>
              </label>
            ))}
          </div>

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>✕ Cancel</button>
            <button type="submit" style={s.createBtn}>✓ Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}
