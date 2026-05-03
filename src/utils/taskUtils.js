import { isPast, isToday, parseISO, format } from "date-fns";

/**
 * Determines task status based on deadline and completion status
 */
export const getTaskStatus = (task) => {
  if (task.completed) return "Completed";
  if (!task.deadline) return task.status || "In Progress";
  
  try {
    const deadlineDate = typeof task.deadline === "string" 
      ? parseISO(task.deadline) 
      : task.deadline.toDate?.() || task.deadline;
    
    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      return "Delayed";
    }
  } catch (e) {
    console.warn("Error parsing deadline:", e);
  }
  
  return task.status || "In Progress";
};

/**
 * Get color for status badge
 */
export const getStatusColor = (status) => {
  switch (status) {
    case "Completed":
      return { bg: "rgba(5,150,105,0.12)", text: "#059669", label: "✅ Completed" };
    case "Delayed":
      return { bg: "rgba(102,20,20,0.1)", text: "#661414", label: "🔴 Delayed" };
    case "In Progress":
    default:
      return { bg: "rgba(102,20,20,0.08)", text: "#661414", label: "🟢 In Progress" };
  }
};

/**
 * Get color for task type
 */
export const getTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case "bug":
      return { bg: "rgba(102,20,20,0.12)", text: "#661414", label: "🐛 Bug" };
    case "task":
    default:
      return { bg: "rgba(102,20,20,0.07)", text: "#661414", label: "📋 Task" };
  }
};

/**
 * Format deadline for display
 */
export const formatDeadline = (deadline) => {
  if (!deadline) return "No deadline";
  try {
    const date = typeof deadline === "string" 
      ? parseISO(deadline) 
      : deadline.toDate?.() || deadline;
    return format(date, "MMM d, yyyy");
  } catch (e) {
    return "Invalid date";
  }
};

/**
 * Check if task is overdue
 */
export const isOverdue = (task) => {
  if (task.completed || !task.deadline) return false;
  try {
    const deadlineDate = typeof task.deadline === "string" 
      ? parseISO(task.deadline) 
      : task.deadline.toDate?.() || task.deadline;
    return isPast(deadlineDate) && !isToday(deadlineDate);
  } catch (e) {
    return false;
  }
};
