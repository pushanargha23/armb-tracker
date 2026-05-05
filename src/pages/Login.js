import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

function Blobs() {
  return (
    <>
      <div style={{ position:"absolute", top:"-80px", left:"-80px", width:340, height:340, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,241,158,0.18), transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-60px", right:"-60px", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,241,158,0.12), transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"55%", left:"8%", width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,241,158,0.08), transparent 70%)", pointerEvents:"none" }} />
    </>
  );
}
/*--*/
export default function Login() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && userData) navigate(userData.role === "admin" ? "/admin" : "/dashboard");
  }, [user, userData, navigate]);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") { setLoading(false); return; }
      if (err.code === "auth/popup-blocked") {
        try { await signInWithRedirect(auth, googleProvider); return; } catch (e) { setError(e.message); }
      } else { setError(err.message); }
      setLoading(false);
    }
  };

  return (
    <div style={S.root}>
      <style>{`
        * { box-sizing: border-box; }
        .google-btn:hover { background: rgba(255,241,158,0.12) !important; border-color: rgba(255,241,158,0.5) !important; box-shadow: 0 4px 20px rgba(255,241,158,0.15) !important; transform: translateY(-1px); }
        .google-btn:active { transform: translateY(0); }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>

      <Blobs />

      <div style={S.card}>
        <div style={S.logoWrap}>
          <div style={S.logoRing}>
            <img src="https://media.licdn.com/dms/image/v2/D560BAQF2cEsbgPrWSg/company-logo_200_200/B56ZvlQAWBKwAI-/0/1769077737321?e=1779321600&v=beta&t=3AikRIFFUy-Y7Nfa3RzqXJW3s1LhW8LgP1GcnAdXJYI"
              alt="ARMB" style={{ width:36, height:36, objectFit:"contain" }}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="block"; }} />
            <span style={{ display:"none", fontSize:22, fontWeight:800, color:"#000" }}>A</span>
          </div>
        </div>

        <div style={S.liveBadge}>
          <span style={S.liveDot} />
          <span style={S.liveLabel}>LIVE DASHBOARD</span>
        </div>

        <h1 style={S.title}>ARMB. Tracker</h1>
        <p style={S.subtitle}>Track employee tasks &amp; time in real‑time</p>

        <div style={S.dividerRow}>
          <div style={S.dividerLine} />
          <span style={S.dividerLabel}>Sign in to continue</span>
          <div style={S.dividerLine} />
        </div>

        <button className="google-btn" style={S.googleBtn} onClick={handleLogin} disabled={loading}>
          {loading ? (
            <><span style={S.spinner} />Signing in…</>
          ) : (
            <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width={18} height={18} style={{ flexShrink:0 }} />Continue with Google</>
          )}
        </button>

        {error && (
          <div style={S.errorBanner}><span style={{ fontSize:13 }}>⚠</span>{error}</div>
        )}

        <div style={S.featRow}>
          {[{ icon:"⚡", label:"Real-time" }, { icon:"📊", label:"Analytics" }, { icon:"🔒", label:"Secure" }].map(({ icon, label }) => (
            <div key={label} style={S.featChip}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span style={S.featLabel}>{label}</span>
            </div>
          ))}
        </div>

        <p style={S.footerNote}>Access is restricted to authorised team members only.</p>
      </div>
    </div>
  );
}

const SF = "-apple-system, 'San Francisco', 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const S = {
  root: {
    minHeight:"100vh",
    background:"#000000",
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    fontFamily: SF,
    position:"relative", overflow:"hidden",
  },
  card: {
    position:"relative", zIndex:2,
    background:"rgba(255,241,158,0.06)",
    backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
    border:"1.5px solid rgba(255,241,158,0.22)",
    borderRadius:24, padding:"44px 38px 34px",
    width:"100%", maxWidth:400,
    boxShadow:"0 8px 40px rgba(255,241,158,0.08), 0 2px 12px rgba(0,0,0,0.6)",
    display:"flex", flexDirection:"column", alignItems:"center",
    animation:"fadeUp 0.5s ease both",
  },
  logoWrap: { marginBottom:20, animation:"float 3.5s ease-in-out infinite" },
  logoRing: {
    width:70, height:70, borderRadius:20,
    background:"linear-gradient(135deg, #FFF19E 0%, #e8d800 100%)",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 6px 28px rgba(255,241,158,0.35)",
  },
  liveBadge: {
    display:"flex", alignItems:"center", gap:6,
    background:"rgba(255,241,158,0.08)", border:"1px solid rgba(255,241,158,0.25)",
    borderRadius:20, padding:"4px 12px", marginBottom:16,
  },
  liveDot: {
    width:7, height:7, borderRadius:"50%",
    background:"#FFF19E", boxShadow:"0 0 6px rgba(255,241,158,0.8)",
    display:"inline-block", animation:"pulse 2s infinite",
  },
  liveLabel: { fontSize:11, fontWeight:700, color:"#FFF19E", letterSpacing:"0.8px" },
  title: { margin:"0 0 7px", fontSize:24, fontWeight:800, color:"#FFF19E", textAlign:"center", letterSpacing:"-0.5px" },
  subtitle: { margin:"0 0 26px", fontSize:13, color:"rgba(255,241,158,0.6)", textAlign:"center", lineHeight:1.55 },
  dividerRow: { display:"flex", alignItems:"center", gap:10, width:"100%", marginBottom:18 },
  dividerLine: { flex:1, height:1, background:"rgba(255,241,158,0.15)" },
  dividerLabel: { fontSize:11, fontWeight:700, color:"rgba(255,241,158,0.4)", letterSpacing:"0.8px", textTransform:"uppercase", whiteSpace:"nowrap" },
  googleBtn: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:10,
    width:"100%", padding:"13px 20px",
    background:"rgba(255,241,158,0.07)", border:"1.5px solid rgba(255,241,158,0.25)",
    borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:600,
    color:"#FFF19E", fontFamily: SF,
    transition:"all 0.2s", boxShadow:"0 2px 10px rgba(255,241,158,0.06)", letterSpacing:"0.1px",
  },
  spinner: {
    width:18, height:18, border:"2.5px solid rgba(255,241,158,0.2)", borderTopColor:"#FFF19E",
    borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block", flexShrink:0,
  },
  errorBanner: {
    display:"flex", alignItems:"center", gap:8, marginTop:14, width:"100%",
    padding:"10px 14px", borderRadius:10,
    background:"rgba(102,20,20,0.4)", border:"1px solid rgba(102,20,20,0.6)",
    color:"#fca5a5", fontSize:12, fontWeight:500,
  },
  featRow: { display:"flex", gap:8, width:"100%", marginTop:20 },
  featChip: {
    flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5,
    background:"rgba(255,241,158,0.05)", border:"1px solid rgba(255,241,158,0.15)",
    borderRadius:10, padding:"10px 6px",
  },
  featLabel: { fontSize:10, fontWeight:700, color:"#FFF19E", letterSpacing:"0.3px" },
  footerNote: { marginTop:18, marginBottom:0, fontSize:11, color:"rgba(255,241,158,0.35)", textAlign:"center", lineHeight:1.6 },
};
