import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function EditTaskModal({ task, users, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || "");
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [deadline, setDeadline] = useState(task.deadline || "");
  const [type, setType] = useState(task.type || "Task");
  const [category, setCategory] = useState(task.category || "Frontend");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Task title is required");
    if (!assignedTo) return setError("Please assign the task to a user");
    if (!deadline) return setError("Please set a deadline");
    setSaving(true);
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        title: title.trim(),
        description: desc.trim(),
        assignedTo,
        deadline,
        type,
        category,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 20px", fontSize: 20 }}>✏️ Edit Task</h3>

        {error && <div style={styles.errorBox}>❌ {error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Task Title *</label>
          <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />

          <label style={styles.label}>Description</label>
          <textarea style={{ ...styles.input, height: 80, resize: "vertical" }} value={desc} onChange={e => setDesc(e.target.value)} />

          <label style={styles.label}>Category *</label>
          <select style={styles.input} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="Frontend">🖥️ Frontend</option>
            <option value="Backend">⚙️ Backend</option>
            <option value="Database">🗄️ Database (DB)</option>
            <option value="Deployment">🚀 Deployment</option>
          </select>

          <label style={styles.label}>Task Type *</label>
          <select style={styles.input} value={type} onChange={e => setType(e.target.value)}>
            <option value="Task">📋 Task</option>
            <option value="Bug">🐛 Bug</option>
          </select>

          <label style={styles.label}>Deadline *</label>
          <input style={styles.input} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />

          <label style={styles.label}>Assign To *</label>
          <select style={styles.input} value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
            <option value="">Select user...</option>
            {users.filter(u => u.role !== "admin").sort((a, b) => a.name.localeCompare(b.name)).map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" style={styles.saveBtn} disabled={saving}>{saving ? "Saving..." : "✓ Save Changes"}</button>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>✕ Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", maxWidth: 500, width: "90%", maxHeight: "90vh", overflowY: "auto" },
  label: { display: "block", margin: "0 0 8px", fontWeight: 600, fontSize: 14, color: "#333" },
  input: { display: "block", width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, marginBottom: 16, fontFamily: "inherit", boxSizing: "border-box" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#991b1b", fontSize: 13 },
  saveBtn: { flex: 1, padding: "12px 0", background: "#667eea", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  cancelBtn: { flex: 1, padding: "12px 0", background: "#e0e0e0", color: "#333", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
};
