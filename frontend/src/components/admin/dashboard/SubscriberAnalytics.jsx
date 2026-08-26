import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const SubscriberAnalytics = ({ dark, period }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    monthlyGrowth: [],
    totalActive: 0,
    totalInactive: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    setLoading(true);
    axios.get("/api/admin/dashboard/subscribers")
      .then(res => setData(res.data || {}))
      .catch(() => setData({ monthlyGrowth: [], totalActive: 0, totalInactive: 0, newThisMonth: 0 }))
      .finally(() => setLoading(false));
  }, [period]);

  const months = (data.monthlyGrowth || []).map(m => m.month || "");
  const newSubs = (data.monthlyGrowth || []).map(m => Number(m.new_subscribers || 0));
  
  // Calculate running cumulative total if monthly growth exists
  let running = 0;
  const cumulative = newSubs.map(val => {
    running += val;
    return running;
  });

  const chartLabels = months.length > 0 ? months : ["Current"];
  const chartCumulative = cumulative.length > 0 ? cumulative : [data.totalActive || 0];
  const chartNew = newSubs.length > 0 ? newSubs : [data.newThisMonth || 0];

  const lineOptions = {
    chart: { type: "line", toolbar: { show: false }, background: "transparent",
      animations: { enabled: true, speed: 1000 } },
    theme: { mode: dark ? "dark" : "light" },
    colors: ["#2563EB", "#10B981"],
    stroke: { curve: "smooth", width: [3, 2] },
    markers: { size: [0, 3] },
    xaxis: { categories: chartLabels, labels: { style: { colors: dark ? "#64748B" : "#94A3B8", fontSize: "11px" } },
      axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: dark ? "#64748B" : "#94A3B8", fontSize: "11px" } } },
    grid: { borderColor: dark ? "rgba(51,65,85,0.3)" : "rgba(226,232,240,0.7)", strokeDashArray: 5 },
    legend: { position: "top", horizontalAlign: "right", labels: { colors: dark ? "#94A3B8" : "#475569" } },
    fill: { type: ["gradient","solid"], gradient: { shadeIntensity:1, opacityFrom:0.2, opacityTo:0.01 } },
    tooltip: { theme: dark ? "dark" : "light" },
    dataLabels: { enabled: false },
  };

  const totalActive = data.totalActive || 0;
  const totalInactive = data.totalInactive || 0;
  const newThisMonth = data.newThisMonth || 0;
  const retentionRate = (totalActive + totalInactive) > 0
    ? ((totalActive / (totalActive + totalInactive)) * 100).toFixed(1)
    : "100";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      {/* ── Subscriber Growth Chart ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
              Newsletter Growth Engine
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A" }}>
              📧 Live Subscriber Growth
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#2563EB", letterSpacing: "-0.04em" }}>
              {totalActive.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.7rem", color: dark ? "#64748B" : "#94A3B8", fontWeight: 600 }}>
              Active Subscribers
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#64748B" : "#94A3B8" }}>
            Loading subscriber data...
          </div>
        ) : (
          <ReactApexChart
            options={lineOptions}
            series={[
              { name: "Total Subscribers", data: chartCumulative },
              { name: "New Signups", data: chartNew },
            ]}
            type="line"
            height={270}
          />
        )}

        {/* Mini KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16 }}>
          {[
            { label: "New This Month", value: `+${newThisMonth}`, color: "#10B981" },
            { label: "Unsubscribed", value: `${totalInactive}`, color: "#EF4444" },
            { label: "Retention Rate", value: `${retentionRate}%`, color: "#2563EB" },
          ].map((m, i) => (
            <div key={i} style={{ borderRadius: 10, padding: "12px 14px",
              background: `${m.color}10`, border: `1px solid ${m.color}25`, textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 900, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: "0.68rem", color: dark ? "#64748B" : "#94A3B8", fontWeight: 700, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Audience Retention Breakdown ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
          Subscription Health
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 20 }}>
          📊 Audience Status
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.84rem", fontWeight: 600, color: dark ? "#CBD5E1" : "#334155" }}>
                Active Subscribers
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#10B981" }}>
                {totalActive}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: dark ? "rgba(51,65,85,0.4)" : "#F1F5F9", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${retentionRate}%`, borderRadius: 4,
                background: "linear-gradient(90deg, #10B981, #34D399)" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.84rem", fontWeight: 600, color: dark ? "#CBD5E1" : "#334155" }}>
                Unsubscribed
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#EF4444" }}>
                {totalInactive}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: dark ? "rgba(51,65,85,0.4)" : "#F1F5F9", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(100 - Number(retentionRate)) || 0}%`, borderRadius: 4,
                background: "linear-gradient(90deg, #EF4444, #F87171)" }} />
            </div>
          </div>

          <div style={{ marginTop: 20, padding: "16px", borderRadius: 14,
            background: dark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.05)",
            border: "1px solid rgba(37,99,235,0.2)" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              💡 Real-Time Subscriber Telemetry
            </div>
            <div style={{ fontSize: "0.8rem", color: dark ? "#94A3B8" : "#64748B", marginTop: 6, lineHeight: 1.5 }}>
              Active subscribers receive automated publication releases and digest updates based on configured campaign workflows.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriberAnalytics;
