import { useState } from "react";
import { getTypeColor, getStatusColor } from "../utils/taskUtils";
import { groupLogsByDate, calculateDayTotals, formatLogDuration, formatLogTime, generateLogsCSV, downloadLogsCSV } from "../utils/logsUtils";

export default function OrganizedLogsList({ timeLogs, users, tasks }) {
  const [expandedDates, setExpandedDates] = useState({});

  const groupedLogs = groupLogsByDate(timeLogs);

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const handleDownloadCSV = (date, logs) => {
    const csvContent = generateLogsCSV(logs, users, tasks);
    downloadLogsCSV(csvContent, date);
  };

  const getUserName = (id) => users.find((u) => u.id === id)?.name || id;
  const getTaskInfo = (id) => {
    const task = tasks.find((t) => t.id === id);
    return {
      title: task?.title || "Unknown Task",
      type: task?.type || "Task",
    };
  };

  if (groupedLogs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
        <p>📋 No time logs available</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {groupedLogs.map((dayGroup) => {
        const dayTotals = calculateDayTotals(dayGroup.logs);
        const isExpanded = expandedDates[dayGroup.date];

        return (
          <div key={dayGroup.date} style={styles.daySection}>
            {/* Date Header */}
            <div
              style={styles.dayHeader}
              onClick={() => toggleDate(dayGroup.date)}
            >
              <div style={styles.dateInfo}>
                <span style={styles.dateText}>{dayGroup.displayDate}</span>
                {dayGroup.isToday && (
                  <span style={styles.todayBadge}>Today</span>
                )}
              </div>
              <div style={styles.dayStats}>
                <span style={styles.stat}>
                  ⏱️ {dayTotals.formattedTime}
                </span>
                <span style={styles.stat}>
                  ✓ {dayTotals.completedCount}/{dayTotals.count}
                </span>
                <span style={styles.expandIcon}>
                  {isExpanded ? "▼" : "▶"}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div style={styles.dayContent}>
                <div style={styles.logsTable}>
                  <div style={styles.tableHeader}>
                    <div style={styles.col1}>User</div>
                    <div style={styles.col2}>Task</div>
                    <div style={styles.col3}>Type</div>
                    <div style={styles.col4}>Start</div>
                    <div style={styles.col4}>End</div>
                    <div style={styles.col5}>Duration</div>
                    <div style={styles.col6}>Status</div>
                  </div>

                  {dayGroup.logs.map((log, idx) => {
                    const taskInfo = getTaskInfo(log.taskId);
                    const typeColor = getTypeColor(taskInfo.type);
                    const statusLabel =
                      log.status === "idle" ? "Completed" : "In Progress";
                    const statusColor = getStatusColor(
                      statusLabel === "Completed" ? "Completed" : "In Progress"
                    );

                    return (
                      <div key={idx} style={styles.tableRow}>
                        <div style={styles.col1}>
                          {getUserName(log.userId)}
                        </div>
                        <div style={styles.col2}>{taskInfo.title}</div>
                        <div style={styles.col3}>
                          <span
                            style={{
                              ...styles.typeBadge,
                              background: typeColor.bg,
                              color: typeColor.text,
                            }}
                          >
                            {typeColor.label}
                          </span>
                        </div>
                        <div style={styles.col4}>{formatLogTime(log.startTime)}</div>
                        <div style={styles.col4}>{formatLogTime(log.endTime)}</div>
                        <div style={styles.col5}>
                          {formatLogDuration(log.duration)}
                        </div>
                        <div style={styles.col6}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              background: statusColor.bg,
                              color: statusColor.text,
                            }}
                          >
                            {statusColor.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Download Button */}
                <button
                  style={styles.downloadBtn}
                  onClick={() =>
                    handleDownloadCSV(dayGroup.date, dayGroup.logs)
                  }
                  title="Download daily report as CSV"
                >
                  📥 Download Report
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  daySection: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "#f8f9ff",
    borderBottom: "1px solid #e0e7ff",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  dayHeaderHover: {
    background: "#f0f4ff",
  },
  dateInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  todayBadge: {
    background: "#dcfce7",
    color: "#16a34a",
    padding: "4px 10px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
  },
  dayStats: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  stat: {
    fontSize: 13,
    color: "#666",
    fontWeight: 500,
  },
  expandIcon: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
    transition: "transform 0.2s",
  },
  dayContent: {
    padding: "20px 24px",
    background: "#f9fafb",
  },
  logsTable: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr 0.8fr 0.9fr 0.9fr 0.9fr 0.9fr",
    gap: 12,
    padding: "12px 16px",
    background: "#f3f4f6",
    borderBottom: "2px solid #e5e7eb",
    fontWeight: 600,
    fontSize: 12,
    color: "#6b7280",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr 0.8fr 0.9fr 0.9fr 0.9fr 0.9fr",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    alignItems: "center",
    fontSize: 13,
    color: "#333",
  },
  col1: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" },
  col2: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" },
  col3: { minWidth: 0 },
  col4: { textAlign: "center", fontFamily: "monospace", fontSize: 12 },
  col5: { textAlign: "center", fontFamily: "monospace", fontWeight: 600 },
  col6: { minWidth: 0 },
  typeBadge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  statusBadge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  downloadBtn: {
    padding: "10px 16px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  },
};
