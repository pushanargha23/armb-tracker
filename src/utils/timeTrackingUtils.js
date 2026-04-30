import { format, parseISO, isToday } from "date-fns";

/**
 * Calculate total working time per user per day
 * Returns array of { userId, userName, date, totalMinutes, formattedTime }
 */
export const calculateDailyTimeTracking = (timeLogs, users) => {
  const dailyMap = {}; // {userId}_{date} -> { userId, userName, totalSeconds, date }

  timeLogs.forEach((log) => {
    if (!log.status || log.status !== "idle" || !log.duration) return; // Only count completed sessions

    const startDate = log.startTime?.toDate?.();
    if (!startDate) return;

    const dateKey = format(startDate, "yyyy-MM-dd");
    const userId = log.userId;
    const key = `${userId}_${dateKey}`;

    if (!dailyMap[key]) {
      const userName = users.find((u) => u.id === userId)?.name || userId;
      dailyMap[key] = {
        userId,
        userName,
        date: dateKey,
        totalSeconds: 0,
      };
    }

    dailyMap[key].totalSeconds += log.duration || 0;
  });

  return Object.values(dailyMap)
    .map((item) => ({
      ...item,
      formattedTime: formatDuration(item.totalSeconds),
    }))
    .sort((a, b) => {
      // Sort by date DESC, then by user name
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.userName.localeCompare(b.userName);
    });
};

/**
 * Calculate total working time for a specific user for a specific date
 */
export const getUserDailyTime = (timeLogs, userId, date) => {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
  const userLogs = timeLogs.filter((log) => {
    if (log.userId !== userId || log.status !== "idle") return false;
    const logDate = log.startTime?.toDate?.();
    return logDate && format(logDate, "yyyy-MM-dd") === dateStr;
  });

  const totalSeconds = userLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  return {
    totalSeconds,
    formattedTime: formatDuration(totalSeconds),
  };
};

/**
 * Get today's summary for all users
 */
export const getTodaySummary = (timeLogs, users) => {
  const dailyTracking = calculateDailyTimeTracking(timeLogs, users);
  const today = format(new Date(), "yyyy-MM-dd");
  return dailyTracking.filter((item) => item.date === today);
};

/**
 * Format seconds to "Xh Ym Zs" format
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.slice(0, 2).join(" "); // Show only h:m or m:s
};

/**
 * Calculate average hours per user
 */
export const calculateAverageHours = (timeLogs, users, days = 7) => {
  const dailyTracking = calculateDailyTimeTracking(timeLogs, users);
  const avgMap = {};

  dailyTracking.forEach((item) => {
    if (!avgMap[item.userId]) {
      avgMap[item.userId] = {
        userId: item.userId,
        userName: item.userName,
        totalSeconds: 0,
        count: 0,
      };
    }
    avgMap[item.userId].totalSeconds += item.totalSeconds;
    avgMap[item.userId].count += 1;
  });

  return Object.values(avgMap)
    .map((item) => ({
      ...item,
      averageHours: (item.totalSeconds / item.count / 3600).toFixed(1),
      formattedAverage: formatDuration(Math.round(item.totalSeconds / item.count)),
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
};
