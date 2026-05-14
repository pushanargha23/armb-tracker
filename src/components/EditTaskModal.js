import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const SF = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

export default function EditTaskModal({ task, users, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || "");
  const [projectName, setProjectName] = useState(task.projectName || "");
  const [assignedTo, setAssignedTo] = useState(
    Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : []
  );

  const toggleUser = (uid) =>
    setAssignedTo(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  const [deadline, setDeadline] = useState(task.deadline || "");
  const [type, setType] = useState(task.type || "Task");
  const [category, setCategory] = useState(task.category || "Frontend");
  const [points, setPoints] = useState(task.points || 10);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Task title is required");
    if (!projectName.trim()) return setError("Project name is required");
    if (!assignedTo.length) return setError("Please assign the task to at least one user");
    if (!deadline) return setError("Please set a deadline");
    setSaving(true);
    try {
      await updateDoc(doc(db, "tasks", task.id), { title: title.trim(), description: desc.trim(), projectName: projectName.trim(), assignedTo, deadline, type, category, points: Number(points) || 10 });
      onClose();
    } catch (err) { setError(err.message); setSaving(false); }
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.iconWrap}>✏️</div>
          <div>
            <h3 style={s.title}>Edit Task</h3>
            <p style={s.sub}>Update task details</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={s.errorBox}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Task Title *</label>
          <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} required />

          <label style={s.label}>Project Name *</label>
          <input style={s.input} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. College Website, Mobile App" required />

          <label style={s.label}>Description</label>
          <textarea style={{ ...s.input, height: 80, resize: "vertical" }} value={desc} onChange={e => setDesc(e.target.value)} />

          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Category *</label>
              <select style={s.input} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Frontend">🖥️ Frontend</option>
                <option value="Backend">⚙️ Backend</option>
                <option value="Database">🗄️ Database</option>
                <option value="Deployment">🚀 Deployment</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Task Type *</label>
              <select style={s.input} value={type} onChange={e => setType(e.target.value)}>
                <option value="Task">📋 Task</option>
                <option value="Bug">🐛 Bug</option>
              </select>
            </div>
          </div>

          <label style={s.label}>Deadline *</label>
          <input style={s.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />

          <label style={s.label}>Task Points (awarded on completion)</label>
          <input style={s.input} type="number" min={1} max={1000} value={points} onChange={e => setPoints(e.target.value)} placeholder="Default: 10" />

          <label style={s.label}>Assign To * {assignedTo.length > 0 && `(${assignedTo.length} selected)`}</label>
          <div style={{ ...s.input, height: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
            {users.filter(u => u.role !== "admin").sort((a, b) => a.name.localeCompare(b.name)).map(u => (
              <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#000" }}>
                <input
                  type="checkbox"
                  checked={assignedTo.includes(u.id)}
                  onChange={() => toggleUser(u.id)}
                  style={{ accentColor: "#661414", width: 15, height: 15 }}
                />
                {u.name} <span style={{ opacity: 0.5, fontSize: 11 }}>({u.email})</span>
              </label>
            ))}
          </div>

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>✕ Cancel</button>
            <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? "Saving..." : "✓ Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(102,20,20,0.28)",
    borderRadius: 20, padding: "28px 28px 24px",
    maxWidth: 500, width: "90%", maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 24px 60px rgba(102,20,20,0.15)",
    fontFamily: SF,
  },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    background: "linear-gradient(135deg,#661414,#991b1b)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, flexShrink: 0,
  },
  title: { fontSize: 18, fontWeight: 800, color: "#000000", margin: 0 },
  sub: { fontSize: 12, color: "rgba(102,20,20,0.5)", margin: "2px 0 0" },
  closeBtn: {
    marginLeft: "auto", background: "rgba(102,20,20,0.06)",
    border: "1px solid rgba(102,20,20,0.15)", borderRadius: 8,
    color: "#661414", fontSize: 13, fontWeight: 700,
    padding: "6px 10px", cursor: "pointer", flexShrink: 0,
  },
  label: { display: "block", margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: "#661414", letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    display: "block", width: "100%", padding: "11px 14px",
    border: "1px solid rgba(102,20,20,0.3)", borderRadius: 10,
    fontSize: 14, marginBottom: 16, fontFamily: SF,
    background: "rgba(102,20,20,0.03)", color: "#000000",
    boxSizing: "border-box", outline: "none",
    transition: "border-color 0.2s",
  },
  row: { display: "flex", gap: 12 },
  errorBox: {
    background: "rgba(102,20,20,0.06)", border: "1px solid rgba(102,20,20,0.3)",
    borderRadius: 10, padding: "10px 14px", marginBottom: 16,
    color: "#661414", fontSize: 13, fontWeight: 600,
  },
  actions: { display: "flex", gap: 10, marginTop: 8 },
  saveBtn: {
    flex: 1, padding: "12px 0",
    background: "linear-gradient(135deg,#661414,#991b1b)",
    color: "#FFFFFF", border: "none", borderRadius: 10,
    fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: SF,
    boxShadow: "0 4px 14px rgba(102,20,20,0.35)",
  },
  cancelBtn: {
    flex: 1, padding: "12px 0",
    background: "rgba(102,20,20,0.05)", border: "1px solid rgba(102,20,20,0.28)",
    color: "#661414", borderRadius: 10,
    fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: SF,
  },
};
