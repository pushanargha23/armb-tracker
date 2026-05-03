import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const SF = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const COLORS = ["#661414", "#991b1b", "#b91c1c", "#dc2626", "#ef4444", "#f87171"];

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
      hours: +hours.toFixed(2),
    }));
  }, [timeLogs, users]);

  const taskHours = useMemo(() => {
    const map = {};
    timeLogs.filter(l => l.status === "idle").forEach(l => {
      map[l.taskId] = (map[l.taskId] || 0) + l.duration / 3600;
    });
    return Object.entries(map).map(([id, value]) => ({
      name: tasks.find(t => t.id === id)?.title || id,
      value: +value.toFixed(2),
    }));
  }, [timeLogs, tasks]);

  const tickStyle = { fontSize: 11, fill: "rgba(102,20,20,0.5)", fontFamily: SF };
  const tooltipStyle = { background: "rgba(255,255,255,0.95)", border: "1px solid rgba(102,20,20,0.15)", borderRadius: 8, fontFamily: SF, fontSize: 12, color: "#000" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={s.card}>
        <h3 style={s.title}>Daily Hours (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData}>
            <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, "Hours"]} />
            <Bar dataKey="hours" fill="#661414" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={s.card}>
        <h3 style={s.title}>Hours by User</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={userHours} layout="vertical">
            <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={tickStyle} width={80} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, "Hours"]} />
            <Bar dataKey="hours" fill="#991b1b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={s.card}>
        <h3 style={s.title}>Time by Task</h3>
        {taskHours.length === 0
          ? <p style={{ color: "rgba(102,20,20,0.4)", fontSize: 13 }}>No data yet</p>
          : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskHours} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}h`}
                  labelLine={{ stroke: "rgba(102,20,20,0.3)" }}>
                  {taskHours.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
      </div>

      <div style={s.card}>
        <h3 style={s.title}>Summary</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Total Logged Hours", value: (timeLogs.filter(l => l.status === "idle").reduce((a, l) => a + l.duration, 0) / 3600).toFixed(1) + "h" },
            { label: "Total Sessions",     value: timeLogs.filter(l => l.status === "idle").length },
            { label: "Active Users",       value: users.filter(u => u.status === "working").length },
            { label: "Total Tasks",        value: tasks.length },
          ].map(item => (
            <div key={item.label} style={s.summaryRow}>
              <span style={{ color: "rgba(102,20,20,0.55)", fontSize: 13 }}>{item.label}</span>
              <strong style={{ color: "#000000", fontSize: 14, fontFamily: "'SF Mono', SFMono-Regular, ui-monospace, monospace" }}>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(102,20,20,0.1)",
    borderRadius: 14, padding: 24,
    boxShadow: "0 2px 12px rgba(102,20,20,0.06)",
    fontFamily: SF,
  },
  title: { margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#661414", letterSpacing: 0.3 },
  summaryRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid rgba(102,20,20,0.08)",
  },
};
