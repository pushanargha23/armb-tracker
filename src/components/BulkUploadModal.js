import { useState } from "react";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { parseCSVFile, downloadCSVTemplate } from "../utils/csvUtils";

export default function BulkUploadModal({ users, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    try {
      const tasks = await parseCSVFile(selectedFile);
      setPreview(tasks);
    } catch (err) {
      setError(err.message);
      setPreview(null);
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!preview || preview.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      for (const task of preview) {
        if (task._error) {
          failureCount++;
          errors.push(task._error);
          continue;
        }

        try {
          // Find user by email
          const userQuery = query(
            collection(db, "users"),
            where("email", "==", task.assignedUser)
          );
          const userSnapshot = await getDocs(userQuery);
          
          if (userSnapshot.empty) {
            failureCount++;
            errors.push(`Row: User "${task.assignedUser}" not found`);
            continue;
          }

          const userId = userSnapshot.docs[0].id;
          
          await addDoc(collection(db, "tasks"), {
            title: task.title,
            description: task.description || "",
            type: task.type || "Task",
            assignedTo: userId,
            deadline: task.deadline,
            status: "In Progress",
            completed: false,
            createdAt: serverTimestamp(),
            createdBy: "bulk_upload"
          });

          successCount++;
        } catch (err) {
          failureCount++;
          errors.push(`Row (${task.title}): ${err.message}`);
        }
      }

      if (successCount > 0) {
        setPreview(null);
        setFile(null);
        if (onSuccess) onSuccess(`Uploaded ${successCount} task(s) successfully`);
        if (errors.length === 0) onClose();
      }

      if (errors.length > 0) {
        setError(`${failureCount} error(s):\n${errors.join("\n")}`);
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 20px", fontSize: 20 }}>📂 Bulk Upload Tasks</h3>
        
        {!preview ? (
          <>
            <div style={styles.uploadSection}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
                style={{ display: "none" }}
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" style={styles.uploadArea}>
                <div style={{ fontSize: 24 }}>📋</div>
                <p style={{ margin: "8px 0 0", fontWeight: 600 }}>
                  {file ? file.name : "Click to select CSV file"}
                </p>
                <p style={{ margin: 4, fontSize: 12, color: "#666" }}>
                  {file ? "Click to change" : "or drag and drop"}
                </p>
              </label>
            </div>

            {error && (
              <div style={{ ...styles.errorBox, marginTop: 16 }}>
                <strong>❌ Error:</strong>
                <pre style={{ margin: "8px 0 0", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {error}
                </pre>
              </div>
            )}

            <div style={styles.helpSection}>
              <p style={{ margin: "0 0 12px", fontWeight: 600 }}>📝 CSV Format Required:</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#666" }}>
                Your CSV must include these columns:
              </p>
              <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12, color: "#666" }}>
                <li>Task Name (required)</li>
                <li>Assigned User (email, required)</li>
                <li>Deadline (YYYY-MM-DD, required)</li>
                <li>Description (optional)</li>
                <li>Type (Bug or Task, optional)</li>
              </ul>
              
              <button
                type="button"
                style={{ ...styles.cancelBtn, marginTop: 12 }}
                onClick={downloadCSVTemplate}
              >
                ⬇️ Download Template
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                style={{ ...styles.cancelBtn, flex: 1 }}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={styles.previewSection}>
              <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>
                <strong>✓ {preview.length} task(s) ready to upload</strong>
              </p>
              
              <div style={styles.previewTable}>
                <table style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
                      <th style={{ padding: "8px 4px" }}>Title</th>
                      <th style={{ padding: "8px 4px" }}>User</th>
                      <th style={{ padding: "8px 4px" }}>Deadline</th>
                      <th style={{ padding: "8px 4px" }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((task, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0", background: task._error ? "#fef2f2" : "transparent" }}>
                        <td style={{ padding: "8px 4px", fontWeight: task._error ? "normal" : 500 }}>
                          {task._error ? "❌" : "✓"} {task.title}
                        </td>
                        <td style={{ padding: "8px 4px" }}>{task.assignedUser}</td>
                        <td style={{ padding: "8px 4px" }}>{task.deadline}</td>
                        <td style={{ padding: "8px 4px" }}>{task.type || "Task"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.some(t => t._error) && (
                <div style={{ ...styles.errorBox, marginTop: 12 }}>
                  <strong>⚠️ Validation Errors:</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 12 }}>
                    {preview.filter(t => t._error).map((t, idx) => (
                      <li key={idx} style={{ color: "#dc2626", marginBottom: 4 }}>{t._error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                style={styles.createBtn}
                onClick={handleUpload}
                disabled={loading || preview.some(t => t._error)}
              >
                {loading ? "Uploading..." : "✓ Upload Tasks"}
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => { setPreview(null); setFile(null); setError(null); }}
                disabled={loading}
              >
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: 12, padding: 24,
    box: "0 10px 40px rgba(0,0,0,0.15)", maxWidth: 600, width: "90%",
    maxHeight: "90vh", overflowY: "auto",
  },
  uploadSection: { marginBottom: 16 },
  uploadArea: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    border: "2px dashed #667eea", borderRadius: 8, padding: 32, cursor: "pointer",
    background: "#f8f9ff", transition: "all 0.2s",
  },
  previewSection: { marginBottom: 16 },
  previewTable: {
    border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden",
    maxHeight: "300px", overflowY: "auto",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
    padding: 12, color: "#991b1b", fontSize: 13,
  },
  helpSection: {
    background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 8,
    padding: 12, marginTop: 16, fontSize: 12, color: "#1e40af",
  },
  createBtn: {
    flex: 1, padding: "10px 0", background: "#22c55e", color: "#fff",
    border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1, padding: "10px 0", background: "#e0e0e0", color: "#333",
    border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
    fontSize: 14,
  },
};
