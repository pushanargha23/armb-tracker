# ARMB Task Tracker

A full-stack employee task tracking and live time monitoring web app built with React + Firebase.

## Features

- Google Authentication (Firebase Auth)
- Role-based access: Admin & User
- Admin: Create/assign tasks, live user status, time logs, reports
- User: View assigned tasks, start/stop timer per task
- Real-time updates via Firestore listeners
- Live running timer (counts up in HH:MM:SS)
- Prevents multiple tasks running simultaneously
- Auto-stops timer on logout
- Daily/weekly report charts (Recharts)

## Tech Stack

- **Frontend**: React 18, React Router v6
- **Backend**: Firebase (Firestore + Auth)
- **Real-time**: Firestore `onSnapshot` listeners
- **Charts**: Recharts
- **Date utils**: date-fns

## Project Structure

```
armb-tracker/
├── public/
│   └── index.html
├── src/
│   ├── firebase/
│   │   └── config.js          # Firebase initialization
│   ├── context/
│   │   └── AuthContext.js     # Auth state + user data
│   ├── hooks/
│   │   └── useLiveTimer.js    # Live elapsed timer hook
│   ├── components/
│   │   ├── Navbar.js          # Top navigation bar
│   │   ├── TaskCard.js        # User task cards with start/stop
│   │   ├── ReportCharts.js    # Admin report charts
│   │   └── ProtectedRoute.js  # Role-based route guard
│   ├── pages/
│   │   ├── Login.js           # Google sign-in page
│   │   ├── UserDashboard.js   # User task view
│   │   └── AdminDashboard.js  # Admin panel
│   ├── App.js
│   ├── index.js
│   └── index.css
├── firestore.rules
├── .env.example
└── package.json
```

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → name it (e.g., `armb-tracker`)
3. Enable **Google Analytics** (optional)

### 2. Enable Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Add your domain to **Authorized domains** (add `localhost` for dev)

### 3. Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Start in **test mode** (update rules later using `firestore.rules`)
3. Choose a region close to you

### 4. Get Firebase Config

1. Firebase Console → Project Settings → **Your apps** → Add Web App
2. Copy the config object

### 5. Configure the Project

```bash
# Clone / extract the project
cd armb-tracker

# Install dependencies
npm install

# Copy env example
copy .env.example .env
```

Edit `src/firebase/config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 6. Set Admin Role

After first login with your Google account, go to Firestore Console:
1. Open the `users` collection
2. Find your user document
3. Change `role` field from `"user"` to `"admin"`

### 7. Deploy Firestore Rules

In Firebase Console → Firestore → **Rules** tab, paste the contents of `firestore.rules`.

### 8. Run the App

```bash
npm start
```

App runs at `http://localhost:3000`

## Firestore Collections

### `users`
| Field | Type | Description |
|-------|------|-------------|
| id | string | Firebase Auth UID |
| name | string | Display name |
| email | string | Gmail address |
| role | string | `"admin"` or `"user"` |
| status | string | `"working"` or `"idle"` |

### `tasks`
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated |
| title | string | Task name |
| description | string | Optional details |
| assignedTo | string | User UID |
| createdBy | string | Admin UID |
| createdAt | timestamp | Creation time |

### `timeLogs`
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated |
| userId | string | User UID |
| taskId | string | Task ID |
| taskTitle | string | Task name (denormalized) |
| startTime | timestamp | When started |
| endTime | timestamp | When stopped |
| duration | number | Seconds elapsed |
| status | string | `"working"` or `"idle"` |

## Usage

### As Admin
1. Log in with your Google account (set role to `admin` in Firestore)
2. Click **+ New Task** to create and assign tasks to users
3. Monitor live status in the **Overview** tab
4. View all tasks in **Tasks** tab
5. See full time logs in **Logs** tab
6. View charts in **Reports** tab

### As User
1. Log in with Google account
2. See assigned task cards
3. Click **▶ Start** to begin tracking (only one task at a time)
4. Click **■ Stop** to end the session
5. Timer counts up live in HH:MM:SS format

## Notes

- Only one task can run at a time per user — starting a new task auto-stops the previous one
- Logging out does NOT auto-stop the timer server-side (add a Cloud Function for production use)
- For production, update Firestore security rules from `firestore.rules`
