import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { userData, logout } = useAuth();
  const isAdmin = userData?.role === "admin";

  if (isAdmin) return <AdminNav userData={userData} logout={logout} />;
  return <UserNav userData={userData} logout={logout} />;
}

function UserNav({ userData, logout }) {
  return (
    <nav style={u.nav}>
      <div style={u.logoWrap}>
        <img src="/logo.svg" alt="ARMB" style={u.logoImage} />
        <div>
          <div style={u.brand}>ARMB Tracker</div>
          <div style={u.brandSub}>Task Management</div>
        </div>
      </div>
      <div style={u.right}>
        <div style={u.userChip}>
          <div style={u.avatar}>{userData?.name?.[0]?.toUpperCase() || "U"}</div>
          <span style={u.userName}>{userData?.name}</span>
        </div>
        <button style={u.logoutBtn} onClick={logout}>↪ Logout</button>
      </div>
    </nav>
  );
}

function AdminNav({ userData, logout }) {
  return (
    <nav style={a.nav}>
      <div style={a.logoWrap}>
        <img src="/logo.svg" alt="ARMB" style={a.logoImage} />
        <div>
          <div style={a.brand}>ARMB Tracker</div>
          <div style={a.brandSub}>Admin Panel</div>
        </div>
      </div>
      <div style={a.right}>
        <div style={a.rolePill}>⚙ Admin</div>
        <div style={a.divider} />
        <div style={a.userInfo}>
          <div style={a.avatar}>{userData?.name?.[0]?.toUpperCase() || "A"}</div>
          <div>
            <div style={a.userName}>{userData?.name}</div>
            <div style={a.userEmail}>{userData?.email}</div>
          </div>
        </div>
        <button style={a.logoutBtn} onClick={logout}>↪ Logout</button>
      </div>
    </nav>
  );
}

// User nav styles — light
const u = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 28px", height: 64,
    background: "#fff",
    borderBottom: "1px solid #e8eaf6",
    position: "sticky", top: 0, zIndex: 200,
    boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 12 },
  logoImage: {
    width: 40, height: 40, objectFit: "contain",
  },
  logoIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  brand: { fontSize: 16, fontWeight: 800, color: "#1e293b", letterSpacing: 0.2 },
  brandSub: { fontSize: 10, color: "#94a3b8", letterSpacing: 0.5, textTransform: "uppercase" },
  right: { display: "flex", alignItems: "center", gap: 14 },
  userChip: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f5f7ff", border: "1px solid #e0e7ff",
    borderRadius: 30, padding: "5px 14px 5px 6px",
  },
  avatar: {
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, color: "#fff",
  },
  userName: { fontSize: 13, fontWeight: 600, color: "#1e293b" },
  logoutBtn: {
    padding: "8px 16px", background: "#fff",
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600,
    transition: "all 0.2s",
  },
};

// Admin nav styles — dark
const a = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 28px", height: 68,
    background: "rgba(15,22,41,0.97)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky", top: 0, zIndex: 200,
    boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 12 },
  logoImage: {
    width: 40, height: 40, objectFit: "contain",
  },
  logoIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
  },
  brand: { fontSize: 17, fontWeight: 800, color: "#f1f5f9", letterSpacing: 0.3 },
  brandSub: { fontSize: 10, color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 1 },
  right: { display: "flex", alignItems: "center", gap: 16 },
  rolePill: { padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc" },
  divider: { width: 1, height: 28, background: "rgba(255,255,255,0.08)" },
  userInfo: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#fff",
    boxShadow: "0 2px 10px rgba(99,102,241,0.4)",
  },
  userName: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  userEmail: { fontSize: 10, color: "#64748b", marginTop: 1 },
  logoutBtn: {
    padding: "8px 16px", background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
    color: "#fca5a5", cursor: "pointer", fontSize: 12, fontWeight: 600,
  },
};
