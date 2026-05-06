import { useState } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useTheme } from "../context/ThemeContext";
import { parseCSVFile, downloadCSVTemplate } from "../utils/csvUtils";

const SF = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

function makeStyles(isDark) {
  const modalBg   = isDark ? "rgba(0,0,0,0.96)"                  : "rgba(255,255,255,0.97)";
  const border    = isDark ? "rgba(255,241,158,0.35)"             : "rgba(102,20,20,0.28)";
  const shadow    = isDark ? "0 24px 60px rgba(0,0,0,0.7)"       : "0 24px 60px rgba(102,20,20,0.15)";
  const text      = isDark ? "#FFF19E"                            : "#000000";
  const textDim   = isDark ? "rgba(255,241,158,0.5)"              : "rgba(102,20,20,0.5)";
  const accent    = isDark ? "#FFF19E"                            : "#661414";
  const inputBg   = isDark ? "rgba(255,241,158,0.05)"             : "rgba(102,20,20,0.03)";
  const inputBdr  = isDark ? "rgba(255,241,158,0.35)"             : "rgba(102,20,20,0.3)";
  const rowBorder = isDark ? "rgba(255,241,158,0.18)"             : "rgba(102,20,20,0.15)";
  const thBorder  = isDark ? "rgba(255,241,158,0.3)"              : "rgba(102,20,20,0.28)";
  const helpBg    = isDark ? "rgba(255,241,158,0.05)"             : "rgba(102,20,20,0.04)";
  const helpBdr   = isDark ? "rgba(255,241,158,0.3)"              : "rgba(102,20,20,0.28)";
  const errBg     = isDark ? "rgba(239,68,68,0.1)"                : "rgba(102,20,20,0.06)";
  const errBdr    = isDark ? "rgba(239,68,68,0.4)"                : "rgba(102,20,20,0.3)";
  const errTx     = isDark ? "#fca5a5"                            : "#661414";
  const uploadBg  = isDark ? "rgba(255,241,158,0.04)"             : "rgba(102,20,20,0.03)";
  const uploadBdr = isDark ? "#FFF19E"                            : "#661414";
  const cancelBg  = isDark ? "rgba(255,241,158,0.06)"             : "rgba(102,20,20,0.05)";
  const cancelBdr = isDark ? "rgba(255,241,158,0.35)"             : "rgba(102,20,20,0.28)";
  const cancelTx  = isDark ? "#FFF19E"                            : "#661414";
  const createBg  = isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)";
  const createTx  = isDark ? "#000000"                            : "#FFFFFF";
  const createShd = isDark ? "0 4px 14px rgba(255,241,158,0.25)" : "0 4px 14px rgba(102,20,20,0.35)";
  const errRowBg  = isDark ? "rgba(239,68,68,0.08)"               : "rgba(102,20,20,0.05)";

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
      borderRadius: 20, padding: "28px 28px 24px",
      maxWidth: 600, width: "90%", maxHeight: "90vh", overflowY: "auto",
      boxShadow: shadow, fontFamily: SF,
    },
    heading: { margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: text },
    uploadArea: {
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      border: `2px dashed ${uploadBdr}`, borderRadius: 12, padding: 32, cursor: "pointer",
      background: uploadBg, transition: "all 0.2s", marginBottom: 16,
    },
    uploadLabel: { fontSize: 14, fontWeight: 600, color: text, margin: "8px 0 0" },
    uploadSub:   { fontSize: 12, color: textDim, margin: "4px 0 0" },
    helpSection: {
      background: helpBg, border: `1px solid ${helpBdr}`,
      borderRadius: 10, padding: "14px 16px", marginTop: 16,
    },
    helpTitle: { margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: accent },
    helpText:  { margin: "0 0 6px", fontSize: 12, color: textDim },
    helpList:  { margin: "4px 0", paddingLeft: 20, fontSize: 12, color: textDim },
    errorBox: {
      background: errBg, border: `1px solid ${errBdr}`,
      borderRadius: 10, padding: "10px 14px",
      color: errTx, fontSize: 13, fontWeight: 600,
    },
    previewTable: {
      border: `1px solid ${inputBdr}`, borderRadius: 10,
      overflow: "hidden", maxHeight: 300, overflowY: "auto", marginBottom: 4,
    },
    th: {
      padding: "9px 10px", textAlign: "left",
      fontSize: 11, fontWeight: 700, color: accent,
      letterSpacing: 0.5, textTransform: "uppercase",
      background: inputBg, borderBottom: `2px solid ${thBorder}`,
    },
    td: { padding: "8px 10px", fontSize: 12, color: text, borderBottom: `1px solid ${rowBorder}` },
    errRowBg,
    actions: { display: "flex", gap: 10, marginTop: 20 },
    createBtn: {
      flex: 1, padding: "11px 0",
      background: createBg, color: createTx,
      border: "none", borderRadius: 10,
      fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: SF,
      boxShadow: createShd,
    },
    cancelBtn: {
      flex: 1, padding: "11px 0",
      background: cancelBg, border: `1px solid ${cancelBdr}`,
      color: cancelTx, borderRadius: 10,
      fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: SF,
    },
    templateBtn: {
      padding: "9px 16px", marginTop: 12,
      background: cancelBg, border: `1px solid ${cancelBdr}`,
      color: cancelTx, borderRadius: 8,
      fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: SF,
    },
  };
}

export default function BulkUploadModal({ users, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const s = makeStyles(isDark);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setError(null); setFile(selectedFile);
    try {
      setPreview(await parseCSVFile(selectedFile));
    } catch (err) {
      setError(err.message); setPreview(null); setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!preview?.length) return;
    setLoading(true); setError(null);
    let successCount = 0, failureCount = 0;
    const errors = [];
    try {
      for (const task of preview) {
        if (task._error) { failureCount++; errors.push(task._error); continue; }
        try {
          const emails = task.assignedUser.split("|").map(e => e.trim()).filter(Boolean);
          const uids = [];
          let hasError = false;
          for (const email of emails) {
            const snap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
            if (snap.empty) { errors.push(`User "${email}" not found`); hasError = true; break; }
            uids.push(snap.docs[0].id);
          }
          if (hasError) { failureCount++; continue; }
          await addDoc(collection(db, "tasks"), {
            title: task.title, description: task.description || "",
            type: task.type || "Task", assignedTo: uids,
            deadline: task.deadline, status: "In Progress",
            completed: false, createdAt: serverTimestamp(), createdBy: "bulk_upload",
          });
          successCount++;
        } catch (err) { failureCount++; errors.push(`(${task.title}): ${err.message}`); }
      }
      if (successCount > 0) {
        setPreview(null); setFile(null);
        if (onSuccess) onSuccess(`Uploaded ${successCount} task(s) successfully`);
        if (errors.length === 0) onClose();
      }
      if (errors.length > 0) setError(`${failureCount} error(s):\n${errors.join("\n")}`);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h3 style={s.heading}>📂 Bulk Upload Tasks</h3>

        {!preview ? (
          <>
            <input type="file" accept=".csv" onChange={handleFileChange} disabled={loading}
              style={{ display: "none" }} id="csv-file-input" />
            <label htmlFor="csv-file-input" style={s.uploadArea}>
              <div style={{ fontSize: 32 }}>📤</div>
              <p style={s.uploadLabel}>{file ? file.name : "Click to select CSV file"}</p>
              <p style={s.uploadSub}>{file ? "Click to change" : "Supports .csv format"}</p>
            </label>

            {error && (
              <div style={{ ...s.errorBox, marginTop: 0 }}>
                <strong>⚠ Error:</strong>
                <pre style={{ margin: "6px 0 0", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error}</pre>
              </div>
            )}

            <div style={s.helpSection}>
              <p style={s.helpTitle}>📝 CSV Format Required</p>
              <p style={s.helpText}>Your CSV must include these columns:</p>
              <ul style={s.helpList}>
                <li>Task Name (required)</li>
                <li>Assigned User — single or multiple emails separated by <strong>|</strong> e.g. <em>a@x.com|b@x.com</em> (required)</li>
                <li>Deadline (YYYY-MM-DD, required)</li>
                <li>Description (optional)</li>
                <li>Type (Bug or Task, optional)</li>
              </ul>
              <button type="button" style={s.templateBtn} onClick={downloadCSVTemplate}>
                ⬇ Download Template
              </button>
            </div>

            <div style={s.actions}>
              <button style={s.cancelBtn} onClick={onClose} disabled={loading}>✕ Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: s.heading.color }}>
              ✓ {preview.length} task(s) ready to upload
            </p>

            <div style={s.previewTable}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Title", "User", "Deadline", "Type"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((task, idx) => (
                    <tr key={idx} style={{ background: task._error ? s.errRowBg : "transparent" }}>
                      <td style={s.td}>{task._error ? "❌" : "✓"} {task.title}</td>
                      <td style={s.td}>{task.assignedUser}</td>
                      <td style={s.td}>{task.deadline}</td>
                      <td style={s.td}>{task.type || "Task"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.some(t => t._error) && (
              <div style={{ ...s.errorBox, marginTop: 12 }}>
                <strong>⚠ Validation Errors:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 12 }}>
                  {preview.filter(t => t._error).map((t, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{t._error}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div style={{ ...s.errorBox, marginTop: 12 }}>
                <strong>⚠ Upload Errors:</strong>
                <pre style={{ margin: "6px 0 0", fontSize: 12, whiteSpace: "pre-wrap" }}>{error}</pre>
              </div>
            )}

            <div style={s.actions}>
              <button style={s.createBtn} onClick={handleUpload}
                disabled={loading || preview.some(t => t._error)}>
                {loading ? "Uploading..." : "✓ Upload Tasks"}
              </button>
              <button style={s.cancelBtn} onClick={() => { setPreview(null); setFile(null); setError(null); }}
                disabled={loading}>
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
