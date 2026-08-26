import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const PALETTE = ["#2563EB", "#0D9488", "#7C3AED", "#F59E0B", "#06B6D4", "#10B981", "#EA580C", "#DB2777"];

const ContentPortfolio = ({ dark, period }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ topArticles: [], recentActivity: [], topPages: [] });

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/dashboard/portfolio?period=${period}`)
      .then(res => setData(res.data || {}))
      .catch(() => setData({ topArticles: [], recentActivity: [], topPages: [] }))
      .finally(() => setLoading(false));
  }, [period]);

  const topArticles = data.topArticles || [];
  const viewsData = topArticles.slice(0, 5).map(a => Number(a.views || 0));
  const totalViewsTop5 = viewsData.reduce((a, b) => a + b, 0);
  const avgViews = viewsData.length > 0 ? Math.round(totalViewsTop5 / viewsData.length) : 0;

  const barOpts = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent", animations: { enabled: true, speed: 900 } },
    theme: { mode: dark ? "dark" : "light" },
    plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: "45%", distributed: true } },
    colors: PALETTE.slice(0, topArticles.slice(0, 5).length),
    xaxis: {
      categories: topArticles.slice(0, 5).map((_, i) => `#${i + 1}`),
      labels: { style: { colors: dark ? "#64748B" : "#94A3B8", fontSize: "11px" } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: dark ? "#64748B" : "#94A3B8", fontSize: "10px" },
        formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v
      }
    },
    grid: { borderColor: dark ? "rgba(51,65,85,0.3)" : "rgba(226,232,240,0.7)", strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${v.toLocaleString()} views` } },
  };

  return (
    <div style={{ borderRadius: 18, padding: "24px",
      background: dark ? "#111C3D" : "#FFFFFF",
      border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
      boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left: Trending List */}
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
            Content Portfolio
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 16 }}>
            🏆 Top Viewed Articles in Database
          </div>

          {topArticles.length === 0 ? (
            <div style={{ textAlign: "center", color: dark ? "#64748B" : "#94A3B8", padding: "40px 0" }}>
              No published articles found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topArticles.slice(0, 5).map((a, i) => {
                const color = PALETTE[i % PALETTE.length];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 10, background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                    border: `1px solid ${dark ? "rgba(51,65,85,0.3)" : "rgba(226,232,240,0.7)"}`,
                    cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=color+"50"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=dark?"rgba(51,65,85,0.3)":"rgba(226,232,240,0.7)"}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.78rem", fontWeight: 900, color: color, flexShrink: 0 }}>
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: dark ? "#CBD5E1" : "#1E293B",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: "0.68rem", color: dark ? "#64748B" : "#94A3B8" }}>
                          👁️ {Number(a.views || 0).toLocaleString()} views
                        </span>
                        {a.category && (
                          <span style={{ fontSize: "0.68rem", padding: "0 6px", borderRadius: 4,
                            background: `${color}15`, color: color, fontWeight: 700 }}>{a.category}</span>
                        )}
                        <span style={{ fontSize: "0.68rem", color: "#10B981", fontWeight: 700, marginLeft: "auto" }}>
                          Live
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Views Bar Chart */}
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
            Views Comparison
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 10 }}>
            📊 Top Articles Reach
          </div>

          {viewsData.length === 0 ? (
            <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#64748B" : "#94A3B8" }}>
              Publish content to view metrics
            </div>
          ) : (
            <ReactApexChart options={barOpts} series={[{ name: "Views", data: viewsData }]} type="bar" height={270} />
          )}

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "Top 5 Views", value: totalViewsTop5.toLocaleString(), color: "#2563EB" },
              { label: "Avg. per Top Item", value: avgViews.toLocaleString(), color: "#10B981" },
              { label: "Tracked Articles", value: topArticles.length, color: "#F59E0B" },
            ].map((m, i) => (
              <div key={i} style={{ borderRadius: 10, padding: "10px 12px",
                background: `${m.color}10`, border: `1px solid ${m.color}25`, textAlign: "center" }}>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: "0.64rem", color: dark ? "#64748B" : "#94A3B8", fontWeight: 700, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPortfolio;
