#!/usr/bin/env node

/**
 * Setup script for Daily Report Email Feature
 * Run: node setup-daily-report.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║    Daily Report Email Feature - Setup Wizard           ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Get Gmail address
  const gmailAddress = await question(
    "📧 Enter your Gmail address: "
  );

  if (!gmailAddress.includes("@")) {
    console.log("❌ Invalid email address!");
    process.exit(1);
  }

  // Get app password
  const appPassword = await question(
    "🔐 Enter your 16-character Gmail app password: "
  );

  if (appPassword.length < 15) {
    console.log(
      "❌ App password seems too short. Did you copy it correctly?"
    );
    process.exit(1);
  }

  // Get recipient email
  const recipientEmail = await question(
    "📬 Enter recipient email (default: somnathpaul626@gmail.com): "
  );

  const finalRecipient =
    recipientEmail.trim() || "somnathpaul626@gmail.com";

  // Get timezone
  const timezone = await question(
    "🌍 Enter timezone (default: UTC)\n   Examples: UTC, America/New_York, Asia/Kolkata: "
  );

  const finalTimezone = timezone.trim() || "UTC";

  // Get schedule time
  const time = await question(
    "⏰ Enter time in HH:MM format (default: 23:50 for 11:50 PM): "
  );

  let cronExpression = "50 23 * * *";
  if (time.trim()) {
    const [hours, minutes] = time.split(":");
    if (hours && minutes) {
      cronExpression = `${minutes} ${hours} * * *`;
    }
  }

  console.log("\n📝 Summary:");
  console.log(`  Gmail: ${gmailAddress}`);
  console.log(`  Recipient: ${finalRecipient}`);
  console.log(`  Timezone: ${finalTimezone}`);
  console.log(`  Schedule: ${cronExpression} (${convertCronToTime(cronExpression)})`);

  const confirm = await question("\n✓ Proceed with setup? (y/n): ");

  if (confirm.toLowerCase() !== "y") {
    console.log("❌ Setup cancelled.");
    process.exit(0);
  }

  // Update dailyReport.js
  updateDailyReportFile(gmailAddress, appPassword, finalRecipient, finalTimezone, cronExpression);

  console.log("\n✅ Setup complete!\n");
  console.log("📋 Next steps:");
  console.log("  1. cd functions");
  console.log("  2. npm install");
  console.log("  3. cd ..");
  console.log("  4. firebase deploy --only functions");
  console.log("  5. Enable Cloud Scheduler (see DAILY_REPORT_SETUP.md)\n");

  rl.close();
}

function updateDailyReportFile(
  gmailAddress,
  appPassword,
  recipientEmail,
  timezone,
  cronExpression
) {
  const filePath = path.join(
    __dirname,
    "functions",
    "src",
    "dailyReport.js"
  );

  if (!fs.existsSync(filePath)) {
    console.log("❌ dailyReport.js not found!");
    process.exit(1);
  }

  let content = fs.readFileSync(filePath, "utf-8");

  // Replace email config
  content = content.replace(
    /user: "your-email@gmail\.com",/,
    `user: "${gmailAddress}",`
  );

  content = content.replace(
    /pass: "your-app-password",/,
    `pass: "${appPassword}",`
  );

  // Replace recipient
  content = content.replace(
    /to: "somnathpaul626@gmail\.com",/,
    `to: "${recipientEmail}",`
  );

  // Replace from email (both instances)
  content = content.replace(
    /from: "your-email@gmail\.com",/g,
    `from: "${gmailAddress}",`
  );

  // Replace schedule
  content = content.replace(
    /\.schedule\("[^"]*"\)/,
    `.schedule("${cronExpression}")`
  );

  // Replace timezone
  content = content.replace(
    /\.timeZone\("[^"]*"\)/,
    `.timeZone("${timezone}")`
  );

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("✅ Updated dailyReport.js with your settings");
}

function convertCronToTime(cronExpression) {
  const parts = cronExpression.split(" ");
  if (parts.length < 2) return "";
  const minutes = parts[0];
  const hours = parts[1];
  return `${hours}:${minutes.padStart(2, "0")}`;
}

// Run setup
setup().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
