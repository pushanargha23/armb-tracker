import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { useTheme } from "../context/ThemeContext";

const SF   = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, monospace";

/* Vibrant colour palettes per mode */
const DARK_COLORS  = ["#FFF19E", "#10b981", "#38bdf8", "#f59e0b", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];
const LIGHT_COLORS = ["#661414", "#059669", "#0284c7", "#b45309", "#7c3aed", "#db2777", "#047857", "#c2410c"];

/* Bar gradient pairs [from, to] */
const DARK_BAR_DAILY = ["#FFF19E", "#e8d800"];
const DARK_BAR_USER  = ["#10b981", "#059669"];
const LIGHT_BAR_DAILY = ["#661414", "#991b1b"];
const LIGHT_BAR_USER  = ["#059669", "#047857"];

function makeStyles(isDark) {
  const bg      = isDark ? "rgba(255,241,158,0.04)"  : "rgba(255,255,255,0.82)";
  const border  = isDark ? "rgba(255,241,158,0.12)"  : "rgba(102,20,20,0.1)";
  const shadow  = isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 20px rgba(102,20,20,0.07)";
  const title   = isDark ? "#FFF19E"                 : "#661414";
  const text    = isDark ? "#FFF19E"                 : "#000000";
  const textDim = isDark ? "rgba(255,241,158,0.4)"   : "rgba(102,20,20,0.45)";
  const rowBdr  = isDark ? "rgba(255,241,158,0.08)"  : "rgba(102,20,20,0.08)";
  const ttBg    = isDark ? "rgba(0,0,0,0.92)"        : "rgba(255,255,255,0.97)";
  const ttBdr   = isDark ? "rgba(255,241,158,0.2)"   : "rgba(102,20,20,0.15)";
  const ttColor = isDark ? "#FFF19E"                 : "#000000";
  const gridClr = isDark ? "rgba(255,241,158,0.06)"  : "rgba(102,20,20,0.06)";
  const tickClr = isDark ? "rgba(255,241,158,0.45)"  : "rgba(102,20,20,0.45)";
  return { bg, border, shadow, title, text, textDim, rowBdr, ttBg, ttBdr, ttColor, gridClr, tickClr };
}

/* Summary card accent colours */
const SUMMARY_DARK  = ["#FFF19E", "#10b981", "#38bdf8", "#f59e0b"];
const SUMMARY_LIGHT = ["#661414", "#059669", "#0284c7", "#b45309"];

export default function ReportCharts({ timeLogs, users, tasks }) {
  const { isDark } = useTheme();
  const C = makeStyles(isDark);
  const PIE_COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
  const barDaily   = isDark ? DARK_BAR_DAILY  : LIGHT_BAR_DAILY;
  const barUser    = isDark ? DARK_BAR_USER   : LIGHT_BAR_USER;
  const summaryAccents = isDark ? SUMMARY_DARK : SUMMARY_LIGHT;

  const tickStyle    = { fontSize: 11, fill: C.tickClr, fontFamily: SF };
  const tooltipStyle = {
    background: C.ttBg, border: `1px solid ${C.ttBdr}`,
    borderRadius: 10, fontFamily: SF, fontSize: 12,
    color: C.ttColor, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  };

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
    return Object.entries(map).map(([id, hours], i) => ({
      name: users.find(u => u.id === id)?.name || id,
      hours: +hours.toFixed(2),
      fill: PIE_COLORS[i % PIE_COLORS.length],
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

  const totalHours   = (timeLogs.filter(l => l.status === "idle").reduce((a, l) => a + l.duration, 0) / 3600).toFixed(1);
  const totalSessions = timeLogs.filter(l => l.status === "idle").length;
  const activeUsers  = users.filter(u => u.status === "working").length;
  const totalTasks   = tasks.length;

  const summaryItems = [
    { label: "Total Hours",    value: totalHours + "h",  icon: "⏱" },
    { label: "Sessions",       value: totalSessions,      icon: "📋" },
    { label: "Active Now",     value: activeUsers,        icon: "🟢" },
    { label: "Total Tasks",    value: totalTasks,         icon: "✦"  },
  ];

  const card = {
    background: C.bg,
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 24,
    boxShadow: C.shadow, fontFamily: SF,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Summary stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 14 }}>
        {summaryItems.map((item, i) => (
          <div key={item.label} style={{
            ...card, padding: "20px 18px", textAlign: "center",
            border: `1px solid ${summaryAccents[i]}33`,
            boxShadow: `0 4px 20px ${summaryAccents[i]}18`,
          }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: summaryAccents[i], fontFamily: MONO, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, marginTop: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{item.label}</div>
            <div style={{ height: 3, borderRadius: 2, marginTop: 12, background: summaryAccents[i] + "22" }}>
              <div style={{ height: "100%", borderRadius: 2, background: summaryAccents[i], width: "60%", transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Daily Hours Bar */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Daily Hours — Last 7 Days</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData} barCategoryGap="35%">
              <defs>
                <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barDaily[0]} stopOpacity={1} />
                  <stop offset="100%" stopColor={barDaily[1]} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gridClr} vertical={false} />
              <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, "Hours"]} cursor={{ fill: isDark ? "rgba(255,241,158,0.05)" : "rgba(102,20,20,0.04)" }} />
              <Bar dataKey="hours" fill="url(#gradDaily)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hours by User Bar */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>👥</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Hours by User</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userHours} layout="vertical" barCategoryGap="30%">
              <defs>
                <linearGradient id="gradUser" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={barUser[0]} stopOpacity={1} />
                  <stop offset="100%" stopColor={barUser[1]} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gridClr} horizontal={false} />
              <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={tickStyle} width={90} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, "Hours"]} cursor={{ fill: isDark ? "rgba(255,241,158,0.05)" : "rgba(102,20,20,0.04)" }} />
              <Bar dataKey="hours" fill="url(#gradUser)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time by Task Pie */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🥧</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Time by Task</h3>
          </div>
          {taskHours.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={taskHours} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={30}
                  paddingAngle={3}
                  label={({ name, value }) => `${value}h`}
                  labelLine={{ stroke: C.tickClr, strokeWidth: 1 }}
                >
                  {taskHours.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                      stroke={isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)"}
                      strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, "Hours"]} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: C.textDim, fontFamily: SF }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Multi-colour user breakdown */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>User Breakdown</h3>
          </div>
          {userHours.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {userHours.sort((a, b) => b.hours - a.hours).map((u, i) => {
                const accent = PIE_COLORS[i % PIE_COLORS.length];
                const maxHours = Math.max(...userHours.map(x => x.hours));
                const pct = maxHours ? Math.round((u.hours / maxHours) * 100) : 0;
                return (
                  <div key={u.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{u.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: accent, fontFamily: MONO }}>{u.hours}h</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: accent + "22", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: accent, width: `${pct}%`, transition: "width 0.8s ease", boxShadow: `0 0 8px ${accent}66` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
