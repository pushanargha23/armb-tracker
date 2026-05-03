import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function EditUserModal({ user, onClose }) {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role || "user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), { name: name.trim(), role });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.avatarWrap}>{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <h3 style={s.title}>Edit User</h3>
            <p style={s.sub}>{user.email}</p>
          </div>
        </div>

        {error && <div style={s.errorBox}>❌ {error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Full Name</label>
          <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />

          <label style={s.label}>Role</label>
          <select style={s.input} value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">👤 User</option>
            <option value="admin">⚙️ Admin</option>
          </select>

          <label style={s.label}>Email</label>
          <input style={{ ...s.input, opacity: 0.5, cursor: "not-allowed" }} value={user.email} disabled />
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: -12, marginBottom: 16 }}>Email cannot be changed</p>

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? "Saving..." : "✓ Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(10,15,30,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#0f1629", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, width: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.5)", animation: "fadeSlideUp 0.25s ease both" },
  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  avatarWrap: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0 },
  title: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  sub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  input: { display: "block", width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 14, marginBottom: 16, boxSizing: "border-box" },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 16, color: "#fca5a5", fontSize: 13 },
  actions: { display: "flex", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#94a3b8", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  saveBtn: { flex: 1, padding: "12px 0", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" },
};
