/**
 * Firebase Cloud Function for Daily Work Report Email
 * 
 * Deploy this function to Firebase Cloud Functions:
 * 1. Copy this file to: functions/src/dailyReport.js
 * 2. Update imports in functions/src/index.js
 * 3. Run: firebase deploy --only functions
 * 
 * Schedule with Firebase Cloud Scheduler:
 * - Set to run daily at 11:50 PM (23:50)
 * - Cron: "50 23 * * *" (UTC time)
 * - Adjust timezone as needed
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { format } = require("date-fns");

// Initialize Firebase Admin SDK (done automatically in Cloud Functions)
// admin.initializeApp(); // Uncomment if needed

const db = admin.firestore();

// Configure email service (Gmail example)
// Important: Enable 2-Factor Authentication and create App Password from Google Account
// See: https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com", // Change this
    pass: "your-app-password", // Change this (16-character app password)
  },
});

/**
 * Cloud Function: Send Daily Work Report
 * Triggered by Cloud Scheduler at 11:50 PM daily
 */
exports.sendDailyReport = functions.pubsub
  .schedule("50 23 * * *") // 11:50 PM UTC
  .timeZone("UTC") // Change timezone as needed
  .onRun(async (context) => {
    try {
      const today = new Date();
      const dateStr = format(today, "yyyy-MM-dd");
      const displayDate = format(today, "EEEE, MMMM d, yyyy");

      console.log(`Generating daily report for ${dateStr}...`);

      // Get all logs for today
      const logsSnapshot = await db.collection("timeLogs").get();
      
      const todayLogs = logsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((log) => {
          const logDate = log.startTime?.toDate?.();
          if (!logDate) return false;
          return format(logDate, "yyyy-MM-dd") === dateStr;
        });

      // Get users and tasks for reference
      const usersSnapshot = await db.collection("users").get();
      const users = Object.fromEntries(
        usersSnapshot.docs.map((doc) => [doc.id, doc.data()])
      );

      const tasksSnapshot = await db.collection("tasks").get();
      const tasks = Object.fromEntries(
        tasksSnapshot.docs.map((doc) => [doc.id, doc.data()])
      );

      // Generate CSV content
      const csvContent = generateCSV(todayLogs, users, tasks);

      // Prepare email
      const subject = `Daily Work Report - ${displayDate}`;
      const htmlBody = generateEmailHTML(displayDate, todayLogs.length, csvContent);
      const csvBuffer = Buffer.from(csvContent, "utf-8");

      // Send email
      const mailOptions = {
        from: "your-email@gmail.com", // Change this
        to: "somnathpaul626@gmail.com",
        subject: subject,
        html: htmlBody,
        attachments: [
          {
            filename: `daily-work-report-${dateStr}.csv`,
            content: csvBuffer,
            contentType: "text/csv",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log(`Daily report emailed successfully for ${dateStr}`);

      return { success: true, date: dateStr, logsCount: todayLogs.length };
    } catch (error) {
      console.error("Error sending daily report:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to send daily report: " + error.message
      );
    }
  });

/**
 * Generate CSV content from logs
 */
function generateCSV(logs, users, tasks) {
  const headers = [
    "User Name",
    "Task Name",
    "Type",
    "Start Time",
    "End Time",
    "Duration",
    "Status",
  ];

  const rows = logs.map((log) => {
    const userName = users[log.userId]?.name || log.userId;
    const task = tasks[log.taskId];
    const taskName = task?.title || log.taskTitle || "Unknown Task";
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
    const durationStr =
      hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;

    const status = log.status === "idle" ? "Completed" : "In Progress";

    return [userName, taskName, taskType, startTime, endTime, durationStr, status];
  });

  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];

  return csvLines.join("\n");
}

/**
 * Generate HTML email body
 */
function generateEmailHTML(displayDate, logsCount, csvPreview) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          h1 { margin: 0; font-size: 24px; }
          .date { font-size: 14px; opacity: 0.9; margin-top: 5px; }
          .stats { background: #f8f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .stat-item { margin: 10px 0; font-size: 15px; }
          .stat-label { font-weight: 600; color: #667eea; }
          .message { background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .no-logs { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 15px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
          th { background: #f3f4f6; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Work Report</h1>
            <p class="date">${displayDate}</p>
          </div>

          ${
            logsCount === 0
              ? `<div class="no-logs">
                   <strong>ℹ️ No Activity</strong>
                   <p>No work logs were recorded for this day.</p>
                 </div>`
              : `
                <div class="stats">
                  <div class="stat-item">
                    <span class="stat-label">📋 Total Logs:</span> ${logsCount}
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">📅 Date:</span> ${displayDate}
                  </div>
                </div>

                <div class="message">
                  ✓ Complete activity logs and detailed CSV report are attached to this email.
                </div>

                <p style="margin-top: 20px; font-size: 14px;">
                  This report includes all time logs, task information, and activity details for the day.
                  Use the attached CSV file for further analysis or record-keeping.
                </p>
              `
          }

          <div class="footer">
            <p>This is an automated daily report generated by ARMB Tracker.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
