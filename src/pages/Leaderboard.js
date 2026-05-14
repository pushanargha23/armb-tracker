import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const SF   = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, monospace";

const RANK_COLORS_DARK  = ["#f59e0b", "#9ca3af", "#fb923c"];
const RANK_COLORS_LIGHT = ["#b45309", "#6b7280", "#c2410c"];

export default function Leaderboard() {
  const { isDark, C: custom } = useTheme();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers]     = useState([]);
  const [tasks, setTasks]     = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);

  const bg     = custom?.bg     || (isDark ? "#000000" : "#FFFFFF");
  const border = custom?.border || (isDark ? "rgba(255,241,158,0.3)" : "rgba(102,20,20,0.22)");
  const text   = custom?.text   || (isDark ? "#FFF19E" : "#000000");
  const textDim  = isDark ? "rgba(255,241,158,0.4)"  : "rgba(102,20,20,0.45)";
  const cardBg   = isDark ? "rgba(255,241,158,0.04)" : "rgba(255,255,255,0.82)";
  const shadow   = isDark ? "0 4px 24px rgba(0,0,0,0.5)" : "0 4px 20px rgba(102,20,20,0.08)";
  const accent   = text;
  const rankColors = isDark ? RANK_COLORS_DARK : RANK_COLORS_LIGHT;

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "users"),    s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, "tasks"),    s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, "timeLogs"), s => setTimeLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, []);

  const leaderboard = useMemo(() => {
    return users
      .filter(u => u.role !== "admin")
      .map(u => {
        const allAssigned = tasks.filter(t =>
          Array.isArray(t.assignedTo) ? t.assignedTo.includes(u.id) : t.assignedTo === u.id
        );
        const completed     = u.lifetimeCompleted || allAssigned.filter(t => t.completed).length;
        const totalAssigned = allAssigned.length;
        const hoursLogged   = +(timeLogs
          .filter(l => l.userId === u.id && l.status === "idle")
          .reduce((a, l) => a + l.duration, 0) / 3600).toFixed(1);
        const sessions = timeLogs.filter(l => l.userId === u.id && l.status === "idle").length;
        const rate = totalAssigned ? Math.round((completed / totalAssigned) * 100) : 0;
        const bonusEligible = rate >= 80 && totalAssigned > 0;
        // Use permanently stored lifetimePoints — never decreases
        const pts = u.lifetimePoints || 0;

        return { id: u.id, name: u.name, email: u.email, completed, totalAssigned, hoursLogged, sessions, rate, pts, bonusEligible: rate >= 80 && totalAssigned > 0 };
      })
      .sort((a, b) => b.pts - a.pts);
  }, [users, tasks, timeLogs]);

  const maxPts = leaderboard[0]?.pts || 1;

  const card = {
    background: cardBg,
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: `1px solid ${border}`,
    borderRadius: 16, boxShadow: shadow, fontFamily: SF,
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: SF, color: text }}>
      <style>{`
        * { box-sizing: border-box; }
        .lb-row:hover { background: ${isDark ? "rgba(255,241,158,0.04)" : "rgba(102,20,20,0.03)"} !important; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <button onClick={() => navigate(userData?.role === "admin" ? "/admin" : "/dashboard")} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", marginBottom: 14,
              background: isDark ? "rgba(255,241,158,0.06)" : "rgba(102,20,20,0.05)",
              border: `1px solid ${border}`, borderRadius: 10,
              color: accent, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: SF,
            }}>
              ← Back to Dashboard
            </button>
            <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: accent, letterSpacing: -0.5 }}>
              🏆 Career Leaderboard
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: textDim }}>
              All-time rankings based on completed tasks, hours logged & consistency
            </p>
          </div>
          {/* Points legend */}
          <div style={{ ...card, padding: "14px 18px", display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { icon: "🟢", label: "Points per task set by admin (default 10)" },
              { icon: "⭐", label: "Stored permanently — never decreases" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                <span style={{ fontSize: 11, color: textDim, fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 podium */}
        {leaderboard.length >= 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 32 }}>
            {[1, 0, 2].map(idx => {
              const u = leaderboard[idx];
              if (!u) return <div key={idx} style={{ width: 180 }} />;
              const rc = rankColors[idx];
              const heights = [160, 200, 140];
              const medals  = ["🥈", "🥇", "🥉"];
              const podiumH = heights[idx];
              return (
                <div key={u.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 180 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{medals[idx]}</div>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, marginBottom: 10,
                    background: `linear-gradient(135deg, ${rc}, ${rc}aa)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 800, color: isDark ? "#000" : "#fff",
                    border: `2px solid ${rc}88`,
                    boxShadow: `0 0 20px ${rc}55`,
                  }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 2, textAlign: "center" }}>{u.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: rc, fontFamily: MONO, marginBottom: 8, textShadow: `0 0 14px ${rc}88` }}>
                    {u.pts} <span style={{ fontSize: 11, fontWeight: 600, color: textDim }}>PTS</span>
                  </div>
                  <div style={{
                    width: "100%", height: podiumH, borderRadius: "12px 12px 0 0",
                    background: `linear-gradient(180deg, ${rc}33, ${rc}11)`,
                    border: `1px solid ${rc}44`, borderBottom: "none",
                    display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 12,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rc, letterSpacing: 1 }}>#{idx === 0 ? 2 : idx === 1 ? 1 : 3}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full rankings table */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${border}`, display: "grid", gridTemplateColumns: "48px 1fr 80px 80px 80px 80px 90px", gap: 8, alignItems: "center" }}>
            {["#", "Player", "Done", "Hours", "Sessions", "Rate", "Points"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: textDim, letterSpacing: 1, textTransform: "uppercase", textAlign: h === "#" || h === "Player" ? "left" : "center" }}>{h}</div>
            ))}
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: textDim, fontSize: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              No users to rank yet
            </div>
          ) : (
            leaderboard.map((u, i) => {
              const isTop3 = i < 3;
              const rc = isTop3 ? rankColors[i] : (isDark ? "rgba(255,241,158,0.3)" : "rgba(102,20,20,0.22)");
              const medals = ["🥇", "🥈", "🥉"];
              const barPct = Math.round((u.pts / maxPts) * 100);
              const rateBadgeColor = u.rate >= 80
                ? (isDark ? "#10b981" : "#059669")
                : u.rate >= 50
                ? (isDark ? "#f59e0b" : "#b45309")
                : (isDark ? "#ef4444" : "#dc2626");

              return (
                <div key={u.id} className="lb-row" style={{
                  padding: "14px 24px",
                  borderBottom: i < leaderboard.length - 1 ? `1px solid ${border}` : "none",
                  background: isTop3 ? `${rankColors[i]}06` : "transparent",
                  display: "grid", gridTemplateColumns: "48px 1fr 80px 80px 80px 80px 90px",
                  gap: 8, alignItems: "center", transition: "background 0.15s",
                }}>
                  {/* Rank */}
                  <div style={{ textAlign: "left" }}>
                    {isTop3
                      ? <span style={{ fontSize: 20 }}>{medals[i]}</span>
                      : <span style={{ fontSize: 13, fontWeight: 800, color: textDim, fontFamily: MONO }}>#{i + 1}</span>
                    }
                  </div>

                  {/* Player */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: isTop3 ? `linear-gradient(135deg,${rankColors[i]},${rankColors[i]}aa)` : (isDark ? "rgba(255,241,158,0.08)" : "rgba(102,20,20,0.06)"),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800,
                      color: isTop3 ? (isDark ? "#000" : "#fff") : textDim,
                      border: `1px solid ${rc}55`,
                      boxShadow: isTop3 ? `0 0 10px ${rankColors[i]}44` : "none",
                    }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</span>
                        {u.bonusEligible && <span style={{ fontSize: 12 }}>⭐</span>}
                      </div>
                      <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: rc + "22", overflow: "hidden", width: "100%" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: rc, width: `${barPct}%`, transition: "width 0.8s ease", boxShadow: isTop3 ? `0 0 6px ${rc}88` : "none" }} />
                      </div>
                    </div>
                  </div>

                  {/* Done */}
                  <div style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: isDark ? "#10b981" : "#059669", fontFamily: MONO }}>{u.completed}</div>

                  {/* Hours */}
                  <div style={{ textAlign: "center", fontSize: 14, fontWeight: 800, color: isDark ? "#38bdf8" : "#0284c7", fontFamily: MONO }}>{u.hoursLogged}h</div>

                  {/* Sessions */}
                  <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: textDim, fontFamily: MONO }}>{u.sessions}</div>

                  {/* Rate */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                      background: rateBadgeColor + "22", color: rateBadgeColor, border: `1px solid ${rateBadgeColor}44`,
                    }}>{u.rate}%</span>
                  </div>

                  {/* Points */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: isTop3 ? rankColors[i] : accent, fontFamily: MONO, textShadow: isTop3 ? `0 0 10px ${rankColors[i]}88` : "none" }}>
                      {u.pts}
                    </span>
                    <span style={{ fontSize: 10, color: textDim, fontWeight: 600, marginLeft: 3 }}>pts</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
