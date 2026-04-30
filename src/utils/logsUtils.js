import { format, parseISO, isToday } from "date-fns";
import { getTypeColor, getStatusColor } from "./taskUtils";

/**
 * Generate CSV content from logs
 */
export const generateLogsCSV = (logs, users, tasks) => {
  const headers = ["User Name", "Task Name", "Type", "Start Time", "End Time", "Duration", "Status"];
  const rows = logs.map((log) => {
    const userName = users.find((u) => u.id === log.userId)?.name || log.userId;
    const task = tasks.find((t) => t.id === log.taskId);
    const taskName = task?.title || log.taskTitle || "Unknown";
    const taskType = task?.type || "Task";
    
    const startTime = log.startTime?.toDate?.() 
      ? format(log.startTime.toDate(), "yyyy-MM-dd HH:mm:ss")
      : "-";
    const endTime = log.endTime?.toDate?.()
      ? format(log.endTime.toDate(), "yyyy-MM-dd HH:mm:ss")
      : "-";
    
    const hours = Math.floor(log.duration / 3600);
    const minutes = Math.floor((log.duration % 3600) / 60);
    const seconds = log.duration % 60;
    const durationStr = hours > 0 
      ? `${hours}h ${minutes}m ${seconds}s`
      : minutes > 0 
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;
    
    const status = log.status === "idle" ? "Completed" : "In Progress";

    return [userName, taskName, taskType, startTime, endTime, durationStr, status];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadLogsCSV = (csvContent, date) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `daily-work-report-${date}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Group logs by date
 */
export const groupLogsByDate = (logs) => {
  const grouped = {};

  logs.forEach((log) => {
    const logDate = log.startTime?.toDate?.();
    if (!logDate) return;

    const dateKey = format(logDate, "yyyy-MM-dd");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(log);
  });

  // Sort dates descending (newest first)
  const sorted = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  return sorted.map(([date, logs]) => ({
    date,
    displayDate: format(parseISO(date), "EEEE, MMMM d, yyyy"), // E.g., "Monday, April 28, 2024"
    isToday: isToday(parseISO(date)),
    logs: logs.sort((a, b) => {
      const timeA = a.startTime?.toDate?.()?.getTime() || 0;
      const timeB = b.startTime?.toDate?.()?.getTime() || 0;
      return timeB - timeA; // Sort by start time descending
    }),
  }));
};

/**
 * Calculate daily totals
 */
export const calculateDayTotals = (logs) => {
  let totalSeconds = 0;
  let completedCount = 0;

  logs.forEach((log) => {
    totalSeconds += log.duration || 0;
    if (log.status === "idle") completedCount++;
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = hours > 0 
    ? `${hours}h ${minutes}m`
    : minutes > 0
    ? `${minutes}m`
    : `${seconds}s`;

  return { totalSeconds, formattedTime, completedCount, count: logs.length };
};

/**
 * Format duration for display
 */
export const formatLogDuration = (seconds) => {
  if (!seconds || seconds === 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/**
 * Format time for display in logs
 */
export const formatLogTime = (timestamp) => {
  if (!timestamp?.toDate) return "-";
  return format(timestamp.toDate(), "HH:mm:ss");
};
