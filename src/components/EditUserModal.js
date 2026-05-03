import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useTheme } from "../context/ThemeContext";

const SF = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

export default function EditUserModal({ user, onClose }) {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role || "user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), { name: name.trim(), role });
      onClose();
    } catch (err) { setError(err.message); setSaving(false); }
  };

  const s = makeStyles(isDark);

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.avatarWrap}>{user.name?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <h3 style={s.title}>Edit User</h3>
            <p style={s.sub}>{user.email}</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={s.errorBox}>⚠ {error}</div>}

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
          <p style={s.hint}>Email cannot be changed</p>

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? "Saving..." : "✓ Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function makeStyles(isDark) {
  const modalBg    = isDark ? "rgba(0,0,0,0.95)"           : "rgba(255,255,255,0.97)";
  const border     = isDark ? "rgba(255,241,158,0.18)"      : "rgba(102,20,20,0.15)";
  const shadow     = isDark ? "0 24px 60px rgba(0,0,0,0.7)": "0 24px 60px rgba(102,20,20,0.15)";
  const titleColor = isDark ? "#FFF19E"                     : "#000000";
  const subColor   = isDark ? "rgba(255,241,158,0.4)"       : "rgba(102,20,20,0.5)";
  const labelColor = isDark ? "#FFF19E"                     : "#661414";
  const inputBg    = isDark ? "rgba(255,241,158,0.05)"      : "rgba(102,20,20,0.03)";
  const inputBdr   = isDark ? "rgba(255,241,158,0.18)"      : "rgba(102,20,20,0.18)";
  const inputColor = isDark ? "#FFF19E"                     : "#000000";
  const hintColor  = isDark ? "rgba(255,241,158,0.35)"      : "rgba(102,20,20,0.4)";
  const closeBg    = isDark ? "rgba(255,241,158,0.08)"      : "rgba(102,20,20,0.06)";
  const closeBdr   = isDark ? "rgba(255,241,158,0.2)"       : "rgba(102,20,20,0.15)";
  const avatarBg   = isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)";
  const avatarTx   = isDark ? "#000000"                     : "#FFFFFF";
  const cancelBg   = isDark ? "rgba(255,241,158,0.06)"      : "rgba(102,20,20,0.05)";
  const cancelBdr  = isDark ? "rgba(255,241,158,0.18)"      : "rgba(102,20,20,0.15)";
  const cancelTx   = isDark ? "#FFF19E"                     : "#661414";
  const saveBg     = isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)";
  const saveTx     = isDark ? "#000000"                     : "#FFFFFF";
  const saveShadow = isDark ? "0 4px 14px rgba(255,241,158,0.25)" : "0 4px 14px rgba(102,20,20,0.35)";
  const errBg      = isDark ? "rgba(239,68,68,0.1)"         : "rgba(102,20,20,0.06)";
  const errBdr     = isDark ? "rgba(239,68,68,0.3)"         : "rgba(102,20,20,0.25)";
  const errTx      = isDark ? "#fca5a5"                     : "#661414";

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
      borderRadius: 20, padding: "28px",
      width: 420, maxWidth: "90%",
      boxShadow: shadow,
      animation: "fadeSlideUp 0.25s ease both",
      fontFamily: SF,
    },
    header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
    avatarWrap: {
      width: 48, height: 48, borderRadius: "50%",
      background: avatarBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, fontWeight: 800, color: avatarTx, flexShrink: 0,
    },
    title: { fontSize: 18, fontWeight: 800, color: titleColor, margin: 0 },
    sub: { fontSize: 12, color: subColor, marginTop: 2 },
    closeBtn: {
      marginLeft: "auto", background: closeBg,
      border: `1px solid ${closeBdr}`, borderRadius: 8,
      color: labelColor, fontSize: 13, fontWeight: 700,
      padding: "6px 10px", cursor: "pointer", flexShrink: 0,
    },
    label: {
      display: "block", fontSize: 12, fontWeight: 700,
      color: labelColor, letterSpacing: 0.5,
      textTransform: "uppercase", marginBottom: 6,
    },
    input: {
      display: "block", width: "100%", padding: "11px 14px",
      borderRadius: 10, border: `1px solid ${inputBdr}`,
      background: inputBg, color: inputColor,
      fontSize: 14, marginBottom: 16, boxSizing: "border-box",
      fontFamily: SF, outline: "none",
    },
    hint: { fontSize: 11, color: hintColor, marginTop: -12, marginBottom: 16 },
    errorBox: {
      background: errBg, border: `1px solid ${errBdr}`,
      borderRadius: 10, padding: "10px 14px", marginBottom: 16,
      color: errTx, fontSize: 13, fontWeight: 600,
    },
    actions: { display: "flex", gap: 10, marginTop: 8 },
    cancelBtn: {
      flex: 1, padding: "12px 0",
      background: cancelBg, border: `1px solid ${cancelBdr}`,
      borderRadius: 10, color: cancelTx,
      fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: SF,
    },
    saveBtn: {
      flex: 1, padding: "12px 0",
      background: saveBg, border: "none",
      borderRadius: 10, color: saveTx,
      fontWeight: 700, fontSize: 14, cursor: "pointer",
      boxShadow: saveShadow, fontFamily: SF,
    },
  };
}
