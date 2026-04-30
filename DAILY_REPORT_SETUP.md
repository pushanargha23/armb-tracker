# Daily Work Report Email Setup Guide

This guide explains how to set up the automated daily email feature for ARMB Tracker.

## Overview

The system will automatically:
1. Collect all work logs from the previous day at 11:50 PM
2. Generate a professionally formatted CSV file
3. Send the CSV as an email attachment to `somnathpaul626@gmail.com`
4. Handle cases where no logs exist for the day

## Prerequisites

- Firebase project set up
- Firebase CLI installed (`npm install -g firebase-tools`)
- Gmail account for sending emails
- Cloud Scheduler API enabled in Firebase

## Step-by-Step Setup

### Step 1: Enable Firebase Cloud Functions

```bash
cd d:\Desktop\Armb traker\armb-tracker
firebase init functions
```

Select:
- **Language**: JavaScript
- **ESLint**: Yes (recommended)

### Step 2: Initialize Functions Project

```bash
cd functions
npm install
```

### Step 3: Update functions/src/index.js

Add this to the exports:

```javascript
const dailyReport = require("./dailyReport");

// Re-export the daily report function
exports.sendDailyReport = dailyReport.sendDailyReport;
```

### Step 4: Set Up Email Authentication

#### For Gmail (Recommended):

1. Go to: https://myaccount.google.com/security
2. Enable 2-Factor Authentication if not already enabled
3. Go to: https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer" (or your device)
5. Google will generate a 16-character app password
6. Copy this password

#### Update dailyReport.js:

Replace these lines in the `transporter` configuration:

```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "whatsappargha1.527@gmail.com",           // ← Replace with your Gmail
    pass: "aksg feof mdtk ejir",              // ← Replace with 16-char app password
  },
});
```

Also update the `from` email in the `mailOptions`:

```javascript
const mailOptions = {
  from: "whatsappargha1.527@gmail.com",  // ← Replace with your Gmail
  to: "somnathpaul626@gmail.com",
  ...
};
```

### Step 5: Update Schedule (Optional)

The default schedule runs at **11:50 PM UTC**. To change:

Edit this line in `dailyReport.js`:

```javascript
.schedule("19 0 * * *")
.timeZone("Asia/Kolkata")
```

**Common timezones:**
- `"UTC"` - Coordinated Universal Time
- `"America/New_York"` - Eastern Time
- `"America/Chicago"` - Central Time
- `"America/Denver"` - Mountain Time
- `"America/Los_Angeles"` - Pacific Time
- `"Asia/Kolkata"` - India Standard Time
- `"Asia/Singapore"` - Singapore Time
- `"Europe/London"` - London Time

**Cron format:** `"minute hour * * *"`
- `"0 8 * * *"` - 8:00 AM
- `"30 14 * * *"` - 2:30 PM
- `"50 23 * * *"` - 11:50 PM

### Step 6: Deploy Cloud Function

```bash
firebase deploy --only functions
```

You should see:
```
✔ Deploy complete!
Function URL (sendDailyReport): https://...
```

### Step 7: Enable Cloud Scheduler

1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to **Cloud Scheduler** (search in top search bar)
4. Click "CREATE JOB"
5. Fill in:
   - **Name**: `send-daily-report`
   - **Frequency**: `50 23 * * *` (or your cron expression)
   - **Timezone**: Select your timezone
   - **Execution timeout**: `540s` (9 minutes)
   - **HTTP target**:
     - **URL**: Use the Cloud Function URL from Step 6
     - **HTTP method**: `POST`
     - **Auth header**: `Add OIDC token`
     - **Service account**: `Cloud Functions default service account`
6. Click "CREATE"

## Testing

### Test Cloud Function Locally

```bash
firebase emulators:start --only functions
```

Or send a test request manually:

```bash
curl -X POST https://YOUR_FUNCTION_URL
```

### Force Test Email

Temporarily change the schedule line to run immediately:

```javascript
.schedule("* * * * *") // Every minute (temporary)
```

Deploy and wait for the next minute mark. Then change back to `"50 23 * * *"`.

## Troubleshooting

### Issue: "PERMISSION_DENIED: Cloud Scheduler API"

**Solution**: Enable Cloud Scheduler API:
1. Go to: https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com
2. Click "ENABLE"
3. Wait 1-2 minutes
4. Try again

### Issue: "Authentication failed"

**Solution**: 
- Verify Gmail address is correct
- Verify 16-character app password (from myaccount.google.com/apppasswords)
- Ensure 2-Factor Authentication is enabled on Gmail

### Issue: "No logs received"

**Solution**: 
- Email will still be sent with a message saying "No Activity"
- Check Firebase console logs:
  - https://console.firebase.google.com → Functions → Logs

### Issue: "Email not received"

**Solution**:
- Check spam/trash folder
- Verify recipient email is correct (`somnathpaul626@gmail.com`)
- Check Firebase Cloud Functions logs for errors
- Verify Gmail app password is correct

## Log Monitoring

Monitor daily reports in Firebase Console:

1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to **Functions** → **Logs**
4. Search for "Daily report"
5. Check status and any errors

## Email Format

Recipients will receive:

**Subject**: `Daily Work Report - <Date>`

**Attachment**: `daily-work-report-YYYY-MM-DD.csv`

**CSV Columns**:
- User Name
- Task Name
- Type (Bug/Task)
- Start Time (YYYY-MM-DD HH:mm:ss)
- End Time (YYYY-MM-DD HH:mm:ss)
- Duration (Xh Ym Zs)
- Status (Completed/In Progress)

**Example CSV**:
```
"User Name","Task Name","Type","Start Time","End Time","Duration","Status"
"John Doe","Frontend Development","Task","2024-04-30 09:00:00","2024-04-30 11:30:00","2h 30m 0s","Completed"
"John Doe","Bug Fix","Bug","2024-04-30 12:00:00","2024-04-30 12:45:00","45m 0s","Completed"
```

## Customization

### Change Recipient Email

Edit `dailyReport.js`:

```javascript
to: "your-recipient@example.com",  // Change this
```

### Add Multiple Recipients

```javascript
to: "user1@gmail.com,user2@gmail.com,user3@gmail.com",
```

### Change Email Subject

Edit the subject line:

```javascript
const subject = `Custom Report - ${displayDate}`;
```

### Change from Email

Update the `from` field in `mailOptions`:

```javascript
from: "noreply@yourdomain.com",
```

## Security Notes

⚠️ **Important**: Keep your app password secret!
- Never commit `dailyReport.js` with real credentials to public repos
- Consider using Firebase Secrets Manager for sensitive data
- Only share credentials with authorized personnel

## Firestore Rules

Ensure your Firestore rules allow reading logs, users, and tasks:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timeLogs/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid != null;
    }
    match /users/{document=**} {
      allow read: if request.auth.uid != null;
    }
    match /tasks/{document=**} {
      allow read: if request.auth.uid != null;
    }
  }
}
```

## Support

If you encounter issues:

1. Check Firebase Console → Functions → Logs
2. Verify all setup steps were followed
3. Ensure Gmail credentials are correct
4. Check Cloud Scheduler is running
5. Verify email recipient is correct

---

**Last Updated**: April 30, 2026
**Version**: 1.0.0
