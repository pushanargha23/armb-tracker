import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["#667eea", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ReportCharts({ timeLogs, users, tasks }) {
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, "MMM d"), day: startOfDay(d).getTime(), hours: 0 };
    });
    timeLogs.filter(l => l.status === "idle" && l.startTime?.toDate).forEach(l => {
      const logDay = startOfDay(l.startTime.toDate()).getTime();
      const entry = days.find(d => d.day === logDay);
      if (entry) entry.hours = +(entry.hours + l.duration / 3600).toFixed(2);
    });
    return days;
  }, [timeLogs]);

  const userHours = useMemo(() => {
    const map = {};
    timeLogs.filter(l => l.status === "idle").forEach(l => {
      map[l.userId] = (map[l.userId] || 0) + l.duration / 3600;
    });
    return Object.entries(map).map(([id, hours]) => ({
      name: users.find(u => u.id === id)?.name || id,
      hours: +hours.toFixed(2)
    }));
  }, [timeLogs, users]);

  const taskHours = useMemo(() => {
    const map = {};
    timeLogs.filter(l => l.status === "idle").forEach(l => {
      map[l.taskId] = (map[l.taskId] || 0) + l.duration / 3600;
    });
    return Object.entries(map).map(([id, value]) => ({
      name: tasks.find(t => t.id === id)?.title || id,
      value: +value.toFixed(2)
    }));
  }, [timeLogs, tasks]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={styles.card}>
        <h3 style={styles.title}>Daily Hours (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
            <Bar dataKey="hours" fill="#667eea" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Hours by User</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={userHours} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
            <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
            <Bar dataKey="hours" fill="#22c55e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Time by Task</h3>
        {taskHours.length === 0 ? <p style={{ color: "#888" }}>No data yet</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={taskHours} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}h`}>
                {taskHours.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}h`]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Summary</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Total Logged Hours", value: (timeLogs.filter(l => l.status === "idle").reduce((a, l) => a + l.duration, 0) / 3600).toFixed(1) + "h" },
            { label: "Total Sessions", value: timeLogs.filter(l => l.status === "idle").length },
            { label: "Active Users", value: users.filter(u => u.status === "working").length },
            { label: "Total Tasks", value: tasks.length },
          ].map(s => (
            <div key={s.label} style={styles.summaryRow}>
              <span style={{ color: "#666" }}>{s.label}</span>
              <strong style={{ color: "#1a1a2e" }}>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  title: { margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#1a1a2e" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
};
