import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SF = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

export default function Navbar() {
  const { userData, logout } = useAuth();
  const { isDark, C: custom } = useTheme();
  const isAdmin = userData?.role === "admin";
  const logoSrc = isDark ? "/logo.svg" : "/logo-light.svg";
  const s = makeStyles(isDark, custom || {});

  if (isAdmin) {
    return (
      <nav style={s.nav}>
        <div style={s.logoWrap}>
          <img src={logoSrc} alt="ARMB" style={s.logoImage} />
          <div>
            <div style={s.brand}>ARMB. Tracker</div>
            <div style={s.brandSub}>Admin Panel</div>
          </div>
        </div>
        <div style={s.right}>
          <div style={s.rolePill}>⚙ Admin</div>
          <div style={s.divider} />
          <div style={s.userInfo}>
            <div style={s.avatar}>{userData?.name?.[0]?.toUpperCase() || "A"}</div>
            <div>
              <div style={s.userName}>{userData?.name}</div>
              <div style={s.userEmail}>{userData?.email}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={logout}>↪ Logout</button>
        </div>
      </nav>
    );
  }

  return (
    <nav style={s.nav}>
      <div style={s.logoWrap}>
        <img src={logoSrc} alt="ARMB" style={s.logoImage} />
        <div>
          <div style={s.brand}>ARMB. Tracker</div>
          <div style={s.brandSub}>Task Management</div>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.userChip}>
          <div style={s.avatar}>{userData?.name?.[0]?.toUpperCase() || "U"}</div>
          <span style={s.userName}>{userData?.name}</span>
        </div>
        <button style={s.logoutBtn} onClick={logout}>↪ Logout</button>
      </div>
    </nav>
  );
}

function makeStyles(isDark, custom) {
  const bg       = custom.bg     || (isDark ? "#000000"                      : "#FFFFFF");
  const border   = custom.border || (isDark ? "rgba(255,241,158,0.28)"       : "rgba(102,20,20,0.28)");
  const shadow   = isDark ? "0 2px 16px rgba(0,0,0,0.6)"  : "0 2px 16px rgba(102,20,20,0.08)";
  const brand    = custom.text   || (isDark ? "#FFF19E"                      : "#661414");
  const brandSub = isDark ? "rgba(255,241,158,0.4)"        : "rgba(102,20,20,0.45)";
  const text     = custom.text   || (isDark ? "#FFF19E"                      : "#000000");
  const textDim  = isDark ? "rgba(255,241,158,0.4)"        : "rgba(102,20,20,0.45)";
  const chipBg   = isDark ? "rgba(255,241,158,0.08)"       : "rgba(102,20,20,0.05)";
  const chipBdr  = custom.border || (isDark ? "rgba(255,241,158,0.35)"       : "rgba(102,20,20,0.28)");
  const pillBg   = isDark ? "rgba(255,241,158,0.1)"        : "rgba(102,20,20,0.07)";
  const pillBdr  = custom.border || (isDark ? "rgba(255,241,158,0.4)"        : "rgba(102,20,20,0.32)");
  const divider  = custom.border || (isDark ? "rgba(255,241,158,0.22)"       : "rgba(102,20,20,0.2)");
  const avatarBg = isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)";
  const avatarTx = isDark ? "#000000"                      : "#FFFFFF";
  const logoutBg = isDark ? "rgba(255,241,158,0.06)"       : "rgba(102,20,20,0.06)";
  const logoutBd = custom.border || (isDark ? "rgba(255,241,158,0.35)"       : "rgba(102,20,20,0.32)");

  return {
    nav: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 64,
      background: bg,
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1.5px solid ${border}`,
      position: "sticky", top: 0, zIndex: 200,
      boxShadow: shadow,
      fontFamily: SF,
      transition: "background 0.3s, border-color 0.3s",
    },
    logoWrap: { display: "flex", alignItems: "center", gap: 12 },
    logoImage: { width: 40, height: 40, objectFit: "contain" },
    brand: { fontSize: 16, fontWeight: 800, color: brand, letterSpacing: 0.2 },
    brandSub: { fontSize: 10, color: brandSub, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 1 },
    right: { display: "flex", alignItems: "center", gap: 14 },

    rolePill: {
      padding: "4px 12px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      background: pillBg, border: `1px solid ${pillBdr}`, color: brand,
    },
    divider: { width: 1, height: 28, background: divider },
    userInfo: { display: "flex", alignItems: "center", gap: 10 },

    userChip: {
      display: "flex", alignItems: "center", gap: 8,
      background: chipBg, border: `1px solid ${chipBdr}`,
      borderRadius: 30, padding: "5px 14px 5px 6px",
    },
    avatar: {
      width: 32, height: 32, borderRadius: "50%",
      background: avatarBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, color: avatarTx,
      boxShadow: isDark ? "0 2px 8px rgba(255,241,158,0.25)" : "0 2px 8px rgba(102,20,20,0.25)",
    },
    userName: { fontSize: 13, fontWeight: 600, color: text },
    userEmail: { fontSize: 10, color: textDim, marginTop: 1 },

    logoutBtn: {
      padding: "8px 16px",
      background: logoutBg,
      border: `1.5px solid ${logoutBd}`,
      borderRadius: 10, color: brand,
      cursor: "pointer", fontSize: 12, fontWeight: 700,
      transition: "all 0.2s", fontFamily: SF,
    },
  };
}
