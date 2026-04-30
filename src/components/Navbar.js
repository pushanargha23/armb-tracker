import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { userData, logout } = useAuth();

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>⏱ ARMB Tracker</div>
      <div style={styles.right}>
        <span style={styles.role}>{userData?.role?.toUpperCase()}</span>
        <span style={styles.name}>{userData?.name}</span>
        <button style={styles.btn} onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", height: 60, background: "#1a1a2e",
    color: "#fff", position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },
  brand: { fontSize: 20, fontWeight: 700, letterSpacing: 0.5 },
  right: { display: "flex", alignItems: "center", gap: 16 },
  role: {
    background: "#667eea", padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700, letterSpacing: 1,
  },
  name: { fontSize: 14, color: "#ccc" },
  btn: {
    padding: "7px 16px", background: "transparent", border: "1px solid #555",
    borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13,
  },
};
