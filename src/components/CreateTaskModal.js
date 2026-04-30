import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { format, addDays } from "date-fns";

export default function CreateTaskModal({ users, onClose }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [type, setType] = useState("Task");
  const [category, setCategory] = useState("Frontend");
  const [error, setError] = useState("");
  const { userData } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    if (!assignedTo) {
      setError("Please assign the task to a user");
      return;
    }

    if (!deadline) {
      setError("Please set a deadline");
      return;
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      setError("Invalid deadline date");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        title: title.trim(),
        description: desc.trim(),
        assignedTo,
        deadline,
        type,
        category,
        status: "In Progress",
        completed: false,
        createdBy: userData.id,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setDesc("");
      setAssignedTo("");
      setDeadline("");
      setType("Task");
      setCategory("Frontend");
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const defaultDeadline = format(addDays(new Date(), 7), "yyyy-MM-dd");

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ margin: "0 0 20px", fontSize: 20 }}>📋 Create New Task</h3>
        
        {error && (
          <div style={styles.errorBox}>
            <strong>❌ {error}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Task Title *</label>
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />

          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, height: 80, resize: "vertical" }}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Optional description"
          />

          <label style={styles.label}>Category *</label>
          <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="Frontend">🖥️ Frontend</option>
            <option value="Backend">⚙️ Backend</option>
            <option value="Database">🗄️ Database (DB)</option>
            <option value="Deployment">🚀 Deployment</option>
          </select>

          <label style={styles.label}>Task Type *</label>
          <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="Task">📋 Task</option>
            <option value="Bug">🐛 Bug</option>
          </select>

          <label style={styles.label}>Deadline *</label>
          <input
            style={styles.input}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            required
          />
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
            Default: {defaultDeadline}
          </p>

          <label style={styles.label}>Assign To *</label>
          <select
            style={styles.input}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
          >
            <option value="">Select user...</option>
            {users
              .filter((u) => u.role !== "admin")
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
          </select>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" style={styles.createBtn}>
              ✓ Create Task
            </button>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              ✕ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    maxWidth: 500,
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  label: {
    display: "block",
    margin: "0 0 8px",
    fontWeight: 600,
    fontSize: 14,
    color: "#333",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: "#991b1b",
    fontSize: 13,
  },
  createBtn: {
    flex: 1,
    padding: "12px 0",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    padding: "12px 0",
    background: "#e0e0e0",
    color: "#333",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
};
