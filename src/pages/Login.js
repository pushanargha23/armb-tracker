import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

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
      // popup closed by user — not a real error
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setLoading(false);
        return;
      }
      // fallback to redirect on popup-blocked environments
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
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" alt="ARMB" style={styles.logo} />
        <h1 style={styles.title}>ARMB Task Tracker</h1>
        <p style={styles.subtitle}>Track employee tasks and time in real-time</p>
        <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width={20} style={{ marginRight: 10 }} />
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        {error && <p style={{ color: "#ef4444", marginTop: 14, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "48px 40px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    maxWidth: 400,
    width: "90%",
  },
  logo: { width: 80, height: 80, objectFit: "contain", marginBottom: 16 },
  title: { margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#1a1a2e" },
  subtitle: { color: "#666", marginBottom: 32, fontSize: 15 },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "14px 24px",
    border: "2px solid #e0e0e0",
    borderRadius: 10,
    background: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#333",
  },
};
