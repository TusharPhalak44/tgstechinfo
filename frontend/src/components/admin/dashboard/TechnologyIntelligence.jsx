import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const PALETTE = ["#2563EB", "#10B981", "#F59E0B", "#7C3AED", "#0D9488", "#EA580C", "#64748B", "#DB2777", "#06B6D4", "#16A34A"];

const TechnologyIntelligence = ({ dark, period }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ categories: [], byType: [], trending: [] });

  useEffect(() => {
    setLoading(true);
    axios.get("/api/admin/dashboard/categories")
      .then(res => setData(res.data || {}))
      .catch(() => setData({ categories: [], byType: [], trending: [] }))
      .finally(() => setLoading(false));
  }, [period]);

  const categories = data.categories || [];
  const industries = data.byType && data.byType.length > 0
    ? data.byType
    : categories.map((c, i) => ({
        industry: c.name,
        count: Number(c.count || 0),
        views: Number(c.total_views || 0)
      }));

  const maxCount = Math.max(...industries.map(i => Number(i.count || 0)), 1);

  // Radar for categories/technologies
  const radarCategories = categories.slice(0, 8);
  const radarOptions = {
    chart: { type: "radar", toolbar: { show: false }, background: "transparent",
      animations: { enabled: true, speed: 1000 } },
    theme: { mode: dark ? "dark" : "light" },
    colors: ["#2563EB", "#10B981"],
    plotOptions: { radar: { polygons: {
      strokeColors: dark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.7)",
      fill: { colors: dark ? ["rgba(17,28,61,0.6)", "rgba(17,28,61,0.3)"] : ["rgba(248,250,252,0.6)", "rgba(248,250,252,0.3)"] }
    }}},
    xaxis: {
      categories: radarCategories.map(t => (t.name || "").split(" ")[0] || "Topic"),
      labels: { style: { colors: Array(8).fill(dark ? "#94A3B8" : "#64748B"), fontSize: "11px" } }
    },
    yaxis: { show: false },
    stroke: { width: 2 },
    fill: { opacity: [0.2, 0.08] },
    markers: { size: 4 },
    legend: { labels: { colors: dark ? "#94A3B8" : "#64748B" } },
    tooltip: { theme: dark ? "dark" : "light" },
    dataLabels: { enabled: false },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* ── Industry Breakdown ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
          Industry & Segment Intelligence
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 18 }}>
          🏭 Content Distribution by Vertical
        </div>

        {industries.length === 0 ? (
          <div style={{ textAlign: "center", color: dark ? "#64748B" : "#94A3B8", padding: "40px 0" }}>
            No vertical data found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {industries.map((ind, i) => {
              const color = PALETTE[i % PALETTE.length];
              const count = Number(ind.count || 0);
              const pct = ((count / maxCount) * 100);
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: dark ? "#CBD5E1" : "#334155" }}>
                        {ind.industry || ind.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color }}>
                        {count} {count === 1 ? 'article' : 'articles'}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: dark ? "rgba(51,65,85,0.4)" : "#F1F5F9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3,
                      background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: "width 1.2s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Technology Radar ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
          Topic Coverage Map
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 6 }}>
          💻 Live Category Coverage (Radar)
        </div>

        {radarCategories.length === 0 ? (
          <div style={{ textAlign: "center", color: dark ? "#64748B" : "#94A3B8", padding: "40px 0" }}>
            Add categories to view radar
          </div>
        ) : (
          <ReactApexChart
            options={radarOptions}
            series={[
              { name: "Articles Count", data: radarCategories.map(t => Number(t.count || 0)) },
            ]}
            type="radar"
            height={300}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
          {radarCategories.slice(0, 4).map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", color: dark ? "#94A3B8" : "#64748B", fontWeight: 600,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnologyIntelligence;
