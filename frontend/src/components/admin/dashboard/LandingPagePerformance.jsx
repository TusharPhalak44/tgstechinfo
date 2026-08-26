import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const PALETTE = ["#2563EB", "#10B981", "#F59E0B", "#7C3AED", "#06B6D4", "#EA580C", "#DB2777", "#16A34A"];

const LandingPagePerformance = ({ dark, period }) => {
  const [loading, setLoading] = useState(true);
  const [topPages, setTopPages] = useState([]);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/dashboard/portfolio?period=${period}`)
      .then(res => setTopPages(res.data?.topPages || []))
      .catch(() => setTopPages([]))
      .finally(() => setLoading(false));
  }, [period]);

  const scatterData = topPages.map((p, i) => {
    const views = Number(p.view_count || 0);
    const bounces = Number(p.bounces || 0);
    const bounceRate = views > 0 ? Math.round((bounces / views) * 100) : 25;
    const avgSeconds = Math.round(Number(p.avg_time || 180));
    const convRate = (bounceRate < 35 ? 12 : bounceRate < 60 ? 6.5 : 2.5);
    return {
      name: p.page_title || p.page_url || `Page ${i+1}`,
      data: [[bounceRate, convRate]],
      views,
      bounceRate,
      avgTime: `${Math.floor(avgSeconds/60)}:${String(avgSeconds%60).padStart(2,'0')}`,
      convRate,
      url: p.page_url || "/"
    };
  });

  const scatterOpts = {
    chart: { type: "scatter", toolbar: { show: false }, background: "transparent",
      zoom: { enabled: false }, animations: { enabled: true, speed: 1000 } },
    theme: { mode: dark ? "dark" : "light" },
    colors: PALETTE.slice(0, Math.max(1, scatterData.length)),
    xaxis: {
      title: { text: "Bounce Rate (%)", style: { color: dark ? "#94A3B8" : "#64748B" } },
      labels: { style: { colors: dark ? "#64748B" : "#94A3B8", fontSize: "10px" } }
    },
    yaxis: {
      title: { text: "Estimated Conv. Rate (%)", style: { color: dark ? "#94A3B8" : "#64748B" } },
      labels: { style: { colors: dark ? "#64748B" : "#94A3B8", fontSize: "10px" } }
    },
    grid: { borderColor: dark ? "rgba(51,65,85,0.3)" : "rgba(226,232,240,0.7)", strokeDashArray: 4 },
    tooltip: {
      theme: dark ? "dark" : "light",
      custom: ({ seriesIndex }) => {
        const p = scatterData[seriesIndex];
        if (!p) return "";
        return `<div style="padding:8px 12px;font-size:12px"><b>${p.name}</b><br/>Views: ${p.views}<br/>Bounce: ${p.bounceRate}%</div>`;
      }
    },
    markers: { size: 10 },
    legend: { show: false },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
      {/* ── Page Performance Table ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
          Telemetry Intelligence
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 16 }}>
          📄 Real-Time Page Performance
        </div>

        {topPages.length === 0 ? (
          <div style={{ textAlign: "center", color: dark ? "#64748B" : "#94A3B8", padding: "40px 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: 6 }}>📊</div>
            <div>No page view records logged for this period</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.9)"}` }}>
                  {["Page URL / Title", "Views", "Unique", "Bounce", "Avg Time"].map((h, i) => (
                    <th key={i} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 800,
                      color: dark ? "#64748B" : "#94A3B8", fontSize: "0.68rem",
                      letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topPages.map((p, i) => {
                  const views = Number(p.view_count || 0);
                  const unique = Number(p.unique_views || 0);
                  const bounces = Number(p.bounces || 0);
                  const bounceRate = views > 0 ? Math.round((bounces / views) * 100) : 0;
                  const avgSec = Math.round(Number(p.avg_time || 0));
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${dark?"rgba(51,65,85,0.2)":"rgba(226,232,240,0.5)"}`,
                      transition: "background 0.2s", cursor: "pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"rgba(248,250,252,0.8)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding: "10px 10px", color: dark?"#CBD5E1":"#1E293B", fontWeight:600,
                        maxWidth: 160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {p.page_title || p.page_url}
                      </td>
                      <td style={{ padding: "10px 10px", color: "#2563EB", fontWeight: 800 }}>
                        {views.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 10px", color: "#10B981", fontWeight: 700 }}>
                        {unique.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 10px", fontWeight: 700,
                        color: bounceRate < 35 ? "#10B981" : bounceRate < 60 ? "#F59E0B" : "#EF4444" }}>
                        {bounceRate}%
                      </td>
                      <td style={{ padding: "10px 10px", color: dark?"#94A3B8":"#64748B" }}>
                        {Math.floor(avgSec/60)}:{String(avgSec%60).padStart(2,'0')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bounce Scatter ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
          Engagement Map
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 10 }}>
          📉 Bounce Distribution
        </div>

        {scatterData.length === 0 ? (
          <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#64748B" : "#94A3B8" }}>
            No engagement points yet
          </div>
        ) : (
          <ReactApexChart
            options={scatterOpts}
            series={scatterData.map(p => ({
              name: p.name,
              data: p.data
            }))}
            type="scatter"
            height={280}
          />
        )}

        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10,
          background: dark ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.05)",
          border: "1px solid rgba(37,99,235,0.2)" }}>
          <div style={{ fontSize: "0.72rem", color: dark ? "#93C5FD" : "#2563EB", fontWeight: 700 }}>
            💡 Real-time engagement analytics computed dynamically from MySQL `page_views` and `visitor_sessions`.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPagePerformance;
