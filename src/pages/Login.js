import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

/* ─── Decorative background blobs ─── */
function Blobs() {
  return (
    <>
      <div style={{
        position: "absolute", top: "-80px", left: "-80px",
        width: 340, height: 340, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.28), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-60px", right: "-60px",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(251,146,60,0.22), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "55%", left: "8%",
        width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "15%", right: "5%",
        width: 140, height: 140, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(244,114,182,0.2), transparent 70%)",
        pointerEvents: "none",
      }} />
    </>
  );
}

export default function Login() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && userData) {
      navigate(userData.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, userData, navigate]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        setLoading(false);
        return;
      }
      if (err.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setError(redirectErr.message);
        }
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .google-btn:hover {
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%) !important;
          border-color: rgba(124, 58, 237, 0.45) !important;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.16) !important;
          transform: translateY(-1px);
        }
        .google-btn:active { transform: translateY(0); }
        .google-btn:disabled { opacity: 0.72; cursor: not-allowed; transform: none !important; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>

      {/* Background */}
      <Blobs />

      {/* Card */}
      <div style={S.card}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoRing}>
            <img
              src="https://media.licdn.com/dms/image/v2/D560BAQF2cEsbgPrWSg/company-logo_200_200/B56ZvlQAWBKwAI-/0/1769077737321?e=1779321600&v=beta&t=3AikRIFFUy-Y7Nfa3RzqXJW3s1LhW8LgP1GcnAdXJYI"
              alt="ARMB"
              style={{ width: 36, height: 36, objectFit: "contain" }}
              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
            />
            <span style={{ display: "none", fontSize: 22, fontWeight: 800, color: "#fff" }}>A</span>
          </div>
        </div>

        {/* Live badge */}
        <div style={S.liveBadge}>
          <span style={S.liveDot} />
          <span style={S.liveLabel}>LIVE DASHBOARD</span>
        </div>

        {/* Heading */}
        <h1 style={S.title}>ARMB Task Tracker</h1>
        <p style={S.subtitle}>Track employee tasks &amp; time in real‑time</p>

        {/* Divider */}
        <div style={S.dividerRow}>
          <div style={S.dividerLine} />
          <span style={S.dividerLabel}>Sign in to continue</span>
          <div style={S.dividerLine} />
        </div>

        {/* Google Button */}
        <button
          className="google-btn"
          style={S.googleBtn}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={S.spinner} />
              Signing in…
            </>
          ) : (
            <>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="G"
                width={18}
                height={18}
                style={{ flexShrink: 0 }}
              />
              Continue with Google
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={S.errorBanner}>
            <span style={{ fontSize: 13 }}>⚠</span>
            {error}
          </div>
        )}

        {/* Feature chips */}
        <div style={S.featRow}>
          {[
            { icon: "⚡", label: "Real-time" },
            { icon: "📊", label: "Analytics" },
            { icon: "🔒", label: "Secure" },
          ].map(({ icon, label }) => (
            <div key={label} style={S.featChip}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={S.featLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={S.footerNote}>
          Access is restricted to authorised team members only.
        </p>
      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4ff 0%, #fdf0fb 45%, #fff7ed 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  card: {
    position: "relative",
    zIndex: 2,
    background: "rgba(255, 255, 255, 0.82)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1.5px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: "44px 38px 34px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 8px 40px rgba(100, 60, 200, 0.1), 0 2px 12px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "fadeUp 0.5s ease both",
  },

  logoWrap: {
    marginBottom: 20,
    animation: "float 3.5s ease-in-out infinite",
  },
  logoRing: {
    width: 70,
    height: 70,
    borderRadius: 20,
    background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #38bdf8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 28px rgba(124, 58, 237, 0.32)",
  },

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(90deg, #f0fdf4, #ecfdf5)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    borderRadius: 20,
    padding: "4px 12px",
    marginBottom: 16,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 6px rgba(34, 197, 94, 0.65)",
    display: "inline-block",
    animation: "pulse 2s infinite",
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#15803d",
    letterSpacing: "0.8px",
  },

  title: {
    margin: "0 0 7px",
    fontSize: 24,
    fontWeight: 800,
    color: "#1e1b4b",
    textAlign: "center",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "0 0 26px",
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.55,
    fontWeight: 400,
  },

  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "rgba(99, 102, 241, 0.15)",
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#a5b4fc",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "13px 20px",
    background: "linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)",
    border: "1.5px solid rgba(124, 58, 237, 0.2)",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#4c1d95",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: "all 0.2s",
    boxShadow: "0 2px 10px rgba(124, 58, 237, 0.08)",
    letterSpacing: "0.1px",
  },

  spinner: {
    width: 18,
    height: 18,
    border: "2.5px solid rgba(124, 58, 237, 0.25)",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
    flexShrink: 0,
  },

  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 500,
  },

  featRow: {
    display: "flex",
    gap: 8,
    width: "100%",
    marginTop: 20,
  },
  featChip: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    background: "rgba(248, 246, 255, 0.9)",
    border: "1px solid rgba(167, 139, 250, 0.22)",
    borderRadius: 10,
    padding: "10px 6px",
  },
  featLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#7c3aed",
    letterSpacing: "0.3px",
  },

  footerNote: {
    marginTop: 18,
    marginBottom: 0,
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.6,
    fontWeight: 400,
  },
};