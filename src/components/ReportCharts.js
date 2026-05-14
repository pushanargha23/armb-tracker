import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { format, subDays, startOfDay, startOfWeek } from "date-fns";
import { useTheme } from "../context/ThemeContext";

const SF   = "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, monospace";

const DARK_COLORS  = ["#FFF19E", "#10b981", "#38bdf8", "#f59e0b", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];
const LIGHT_COLORS = ["#661414", "#059669", "#0284c7", "#b45309", "#7c3aed", "#db2777", "#047857", "#c2410c"];

const DARK_BAR_DAILY  = ["#FFF19E", "#e8d800"];
const DARK_BAR_USER   = ["#10b981", "#059669"];
const LIGHT_BAR_DAILY = ["#661414", "#991b1b"];
const LIGHT_BAR_USER  = ["#059669", "#047857"];

const SUMMARY_DARK  = ["#FFF19E", "#10b981", "#38bdf8", "#f59e0b"];
const SUMMARY_LIGHT = ["#661414", "#059669", "#0284c7", "#b45309"];

function makeStyles(isDark) {
  const bg      = isDark ? "rgba(255,241,158,0.04)"  : "rgba(255,255,255,0.82)";
  const border  = isDark ? "rgba(255,241,158,0.3)"   : "rgba(102,20,20,0.22)";
  const shadow  = isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 20px rgba(102,20,20,0.07)";
  const title   = isDark ? "#FFF19E"                 : "#661414";
  const text    = isDark ? "#FFF19E"                 : "#000000";
  const textDim = isDark ? "rgba(255,241,158,0.4)"   : "rgba(102,20,20,0.45)";
  const ttBg    = isDark ? "rgba(0,0,0,0.92)"        : "rgba(255,255,255,0.97)";
  const ttBdr   = isDark ? "rgba(255,241,158,0.2)"   : "rgba(102,20,20,0.15)";
  const ttColor = isDark ? "#FFF19E"                 : "#000000";
  const gridClr = isDark ? "rgba(255,241,158,0.06)"  : "rgba(102,20,20,0.06)";
  const tickClr = isDark ? "rgba(255,241,158,0.45)"  : "rgba(102,20,20,0.45)";
  const inputBg = isDark ? "rgba(255,241,158,0.05)"  : "rgba(102,20,20,0.03)";
  const selectorActiveBg = isDark ? "linear-gradient(135deg,#FFF19E,#e8d800)" : "linear-gradient(135deg,#661414,#991b1b)";
  const selectorActiveTx = isDark ? "#000" : "#fff";
  return { bg, border, shadow, title, text, textDim, ttBg, ttBdr, ttColor, gridClr, tickClr, inputBg, selectorActiveBg, selectorActiveTx };
}

export default function ReportCharts({ timeLogs, users, tasks }) {
  const { isDark } = useTheme();
  const C = makeStyles(isDark);
  const PIE_COLORS     = isDark ? DARK_COLORS  : LIGHT_COLORS;
  const barDaily       = isDark ? DARK_BAR_DAILY  : LIGHT_BAR_DAILY;
  const barUser        = isDark ? DARK_BAR_USER   : LIGHT_BAR_USER;
  const summaryAccents = isDark ? SUMMARY_DARK : SUMMARY_LIGHT;

  // Derive all unique project names
  const projectNames = useMemo(() =>
    ["All Projects", ...new Set(tasks.map(t => t.projectName).filter(Boolean)).values()].sort((a, b) =>
      a === "All Projects" ? -1 : b === "All Projects" ? 1 : a.localeCompare(b)
    ), [tasks]);

  const [selectedProject, setSelectedProject] = useState("All Projects");

  // Filter tasks by selected project
  const filteredTasks = useMemo(() =>
    selectedProject === "All Projects"
      ? tasks
      : tasks.filter(t => t.projectName === selectedProject),
    [tasks, selectedProject]);

  const filteredTaskIds = useMemo(() => new Set(filteredTasks.map(t => t.id)), [filteredTasks]);

  // Filter timeLogs to only those belonging to filtered tasks
  const filteredLogs = useMemo(() =>
    timeLogs.filter(l => filteredTaskIds.has(l.taskId)),
    [timeLogs, filteredTaskIds]);

  const tickStyle    = { fontSize: 11, fill: C.tickClr, fontFamily: SF };
  const tooltipStyle = {
    background: C.ttBg, border: `1px solid ${C.ttBdr}`,
    borderRadius: 10, fontFamily: SF, fontSize: 12,
    color: C.ttColor, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  };

  const card = {
    background: C.bg,
    backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
    border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 24,
    boxShadow: C.shadow, fontFamily: SF,
  };

  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, "MMM d"), day: startOfDay(d).getTime(), hours: 0 };
    });
    filteredLogs.filter(l => l.status === "idle" && l.startTime?.toDate).forEach(l => {
      const logDay = startOfDay(l.startTime.toDate()).getTime();
      const entry = days.find(d => d.day === logDay);
      if (entry) entry.hours = +(entry.hours + l.duration / 3600).toFixed(2);
    });
    return days;
  }, [filteredLogs]);

  const userHours = useMemo(() => {
    const map = {};
    filteredLogs.filter(l => l.status === "idle").forEach(l => {
      map[l.userId] = (map[l.userId] || 0) + l.duration / 3600;
    });
    return Object.entries(map).map(([id, hours], i) => ({
      name: users.find(u => u.id === id)?.name || id,
      hours: +hours.toFixed(2),
      fill: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [filteredLogs, users]);

  const taskHours = useMemo(() => {
    const map = {};
    filteredLogs.filter(l => l.status === "idle").forEach(l => {
      map[l.taskId] = (map[l.taskId] || 0) + l.duration / 3600;
    });
    return Object.entries(map).map(([id, value]) => ({
      name: tasks.find(t => t.id === id)?.title || id,
      value: +value.toFixed(2),
    }));
  }, [filteredLogs, tasks]);

  // Task status breakdown for selected project
  const taskStatusData = useMemo(() => {
    const completed  = filteredTasks.filter(t => t.completed).length;
    const delayed    = filteredTasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
    const inProgress = filteredTasks.length - completed - delayed;
    return [
      { name: "Completed",   value: completed,  color: isDark ? "#10b981" : "#059669" },
      { name: "In Progress", value: inProgress, color: isDark ? "#FFF19E" : "#661414" },
      { name: "Delayed",     value: delayed,    color: isDark ? "#ef4444" : "#dc2626" },
    ].filter(d => d.value > 0);
  }, [filteredTasks, isDark]);

  const totalHours    = (filteredLogs.filter(l => l.status === "idle").reduce((a, l) => a + l.duration, 0) / 3600).toFixed(1);
  const totalSessions = filteredLogs.filter(l => l.status === "idle").length;
  const completedCount = filteredTasks.filter(t => t.completed).length;
  const totalTaskCount = filteredTasks.length;

  // ── New analytics ──

  // 30-day weekly trend (group by week)
  const weeklyTrend = useMemo(() => {
    const weeks = Array.from({ length: 5 }, (_, i) => {
      const d = subDays(new Date(), (4 - i) * 7);
      return { week: "W" + format(d, "MMM d"), start: startOfWeek(d).getTime(), hours: 0 };
    });
    filteredLogs.filter(l => l.status === "idle" && l.startTime?.toDate).forEach(l => {
      const logWeek = startOfWeek(l.startTime.toDate()).getTime();
      const entry = weeks.find(w => w.start === logWeek);
      if (entry) entry.hours = +(entry.hours + l.duration / 3600).toFixed(2);
    });
    return weeks;
  }, [filteredLogs]);

  // Avg session duration per user (minutes)
  const avgSessionPerUser = useMemo(() => {
    const map = {};
    const count = {};
    filteredLogs.filter(l => l.status === "idle").forEach(l => {
      map[l.userId] = (map[l.userId] || 0) + l.duration;
      count[l.userId] = (count[l.userId] || 0) + 1;
    });
    return Object.entries(map).map(([id, total]) => ({
      name: users.find(u => u.id === id)?.name || id,
      avg: +((total / count[id]) / 60).toFixed(1),
    })).sort((a, b) => b.avg - a.avg);
  }, [filteredLogs, users]);

  // Task completion rate per user
  const completionPerUser = useMemo(() => {
    const map = {};
    filteredTasks.forEach(t => {
      const ids = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
      ids.forEach(uid => {
        if (!map[uid]) map[uid] = { total: 0, done: 0 };
        map[uid].total++;
        if (t.completed) map[uid].done++;
      });
    });
    return Object.entries(map).map(([id, v]) => ({
      name: users.find(u => u.id === id)?.name || id,
      rate: v.total ? Math.round((v.done / v.total) * 100) : 0,
      done: v.done, total: v.total,
    })).sort((a, b) => b.rate - a.rate);
  }, [filteredTasks, users]);

  // Category breakdown (hours per category)
  const categoryHours = useMemo(() => {
    const map = {};
    filteredLogs.filter(l => l.status === "idle").forEach(l => {
      const cat = tasks.find(t => t.id === l.taskId)?.category || "Uncategorized";
      map[cat] = (map[cat] || 0) + l.duration / 3600;
    });
    return Object.entries(map).map(([cat, hours]) => ({ cat, hours: +hours.toFixed(2) }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredLogs, tasks]);

  // Top 5 tasks by time spent
  const topTasks = useMemo(() => {
    const map = {};
    filteredLogs.filter(l => l.status === "idle").forEach(l => {
      map[l.taskId] = (map[l.taskId] || 0) + l.duration;
    });
    return Object.entries(map)
      .map(([id, dur]) => ({ title: tasks.find(t => t.id === id)?.title || id, hours: +(dur / 3600).toFixed(2) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [filteredLogs, tasks]);

  // Accepted vs not accepted
  const acceptanceData = useMemo(() => {
    const accepted = filteredTasks.filter(t => t.accepted).length;
    const pending  = filteredTasks.filter(t => !t.accepted && !t.completed).length;
    return [
      { name: "Accepted",    value: accepted, color: isDark ? "#10b981" : "#059669" },
      { name: "Not Accepted", value: pending,  color: isDark ? "#f59e0b" : "#b45309" },
    ].filter(d => d.value > 0);
  }, [filteredTasks, isDark]);

  const summaryItems = [
    { label: "Total Hours",   value: totalHours + "h", icon: "⏱" },
    { label: "Sessions",      value: totalSessions,     icon: "📋" },
    { label: "Tasks",         value: totalTaskCount,    icon: "✦"  },
    { label: "Completed",     value: completedCount,    icon: "✓"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Project Selector ── */}
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", boxShadow: C.shadow }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
          📁 Filter by Project
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {projectNames.map(p => {
            const active = selectedProject === p;
            return (
              <button key={p} onClick={() => setSelectedProject(p)} style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: SF, border: `1px solid ${C.border}`,
                background: active ? C.selectorActiveBg : C.inputBg,
                color: active ? C.selectorActiveTx : C.text,
                boxShadow: active ? `0 2px 10px ${isDark ? "rgba(255,241,158,0.2)" : "rgba(102,20,20,0.2)"}` : "none",
                transition: "all 0.18s",
              }}>
                {p === "All Projects" ? "🌐 All Projects" : `📁 ${p}`}
              </button>
            );
          })}
        </div>
        {selectedProject !== "All Projects" && (
          <div style={{ marginTop: 12, fontSize: 12, color: C.textDim }}>
            Showing analytics for <strong style={{ color: C.title }}>{selectedProject}</strong> — {totalTaskCount} task{totalTaskCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
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

      {/* ── Charts Grid ── */}
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
          {userHours.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No data yet</div>
          ) : (
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
          )}
        </div>

        {/* Task Status Pie */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🥧</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Task Status Breakdown</h3>
          </div>
          {taskStatusData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={taskStatusData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={30}
                  paddingAngle={3}
                  label={({ name, value }) => `${value}`}
                  labelLine={{ stroke: C.tickClr, strokeWidth: 1 }}
                >
                  {taskStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color}
                      stroke={isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)"}
                      strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [v, "Tasks"]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: C.textDim, fontFamily: SF }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Time by Task Pie */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>⏱</span>
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
                  label={({ value }) => `${value}h`}
                  labelLine={{ stroke: C.tickClr, strokeWidth: 1 }}
                >
                  {taskHours.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                      stroke={isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)"}
                      strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, "Hours"]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: C.textDim, fontFamily: SF }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ── User Breakdown ── */}
      {userHours.length > 0 && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>User Breakdown</h3>
          </div>
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
        </div>
      )}

      {/* ── Weekly Trend (30 days) ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>📈</span>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Weekly Hours Trend — Last 5 Weeks</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weeklyTrend}>
            <defs>
              <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={barDaily[0]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={barDaily[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gridClr} vertical={false} />
            <XAxis dataKey="week" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}h`, "Hours"]} />
            <Area type="monotone" dataKey="hours" stroke={barDaily[0]} strokeWidth={2.5} fill="url(#gradArea)" dot={{ fill: barDaily[0], r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row: Avg Session + Category Breakdown ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Avg Session Duration per User */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>⏱</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Avg Session Duration (min)</h3>
          </div>
          {avgSessionPerUser.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avgSessionPerUser} layout="vertical" barCategoryGap="30%">
                <defs>
                  <linearGradient id="gradAvg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={PIE_COLORS[2]} stopOpacity={1} />
                    <stop offset="100%" stopColor={PIE_COLORS[2]} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gridClr} horizontal={false} />
                <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={tickStyle} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v} min`, "Avg Session"]} cursor={{ fill: isDark ? "rgba(255,241,158,0.05)" : "rgba(102,20,20,0.04)" }} />
                <Bar dataKey="avg" fill="url(#gradAvg)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Hours */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🗂</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Hours by Category</h3>
          </div>
          {categoryHours.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {categoryHours.map((c, i) => {
                const accent = PIE_COLORS[i % PIE_COLORS.length];
                const max = categoryHours[0].hours;
                const pct = max ? Math.round((c.hours / max) * 100) : 0;
                return (
                  <div key={c.cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{c.cat}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: accent, fontFamily: MONO }}>{c.hours}h</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: accent + "22", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: accent, width: `${pct}%`, transition: "width 0.8s ease", boxShadow: `0 0 8px ${accent}55` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row: Completion Rate + Acceptance Rate ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Task Completion Rate per User */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Completion Rate by User</h3>
          </div>
          {completionPerUser.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {completionPerUser.map((u, i) => {
                const accent = u.rate === 100 ? (isDark ? "#10b981" : "#059669") : u.rate >= 50 ? (isDark ? "#f59e0b" : "#b45309") : (isDark ? "#ef4444" : "#dc2626");
                return (
                  <div key={u.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{u.name}</span>
                      <span style={{ fontSize: 12, color: C.textDim }}>
                        <span style={{ fontWeight: 800, color: accent, fontFamily: MONO }}>{u.rate}%</span>
                        <span style={{ marginLeft: 6 }}>({u.done}/{u.total})</span>
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: accent + "22", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: accent, width: `${u.rate}%`, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Acceptance Pie */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🤝</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Task Acceptance Status</h3>
          </div>
          {acceptanceData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim, fontSize: 13 }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={acceptanceData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  paddingAngle={4}
                  label={({ name, value }) => `${value}`}
                  labelLine={{ stroke: C.tickClr, strokeWidth: 1 }}
                >
                  {acceptanceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke={isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.6)"} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [v, "Tasks"]} />
                <Legend iconType="circle" iconSize={8}
                  formatter={value => <span style={{ fontSize: 11, color: C.textDim, fontFamily: SF }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top Tasks by Time ── */}
      {topTasks.length > 0 && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.title }}>Top Tasks by Time Spent</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topTasks.map((t, i) => {
              const accent = PIE_COLORS[i % PIE_COLORS.length];
              const max = topTasks[0].hours;
              const pct = max ? Math.round((t.hours / max) * 100) : 0;
              const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
              return (
                <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{medals[i]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, wordBreak: "break-word" }}>{t.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: accent, fontFamily: MONO, flexShrink: 0, marginLeft: 8 }}>{t.hours}h</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: accent + "22", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, background: accent, width: `${pct}%`, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
