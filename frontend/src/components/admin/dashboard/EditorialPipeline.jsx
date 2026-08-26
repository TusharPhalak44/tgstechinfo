import React, { useState, useEffect } from "react";
import { Tooltip } from "antd";
import axios from "axios";

const STATUS_CONFIG = {
  published: { color: "#10B981", bg: "rgba(16,185,129,0.1)", label: "Published", icon: "✅" },
  draft:     { color: "#64748B", bg: "rgba(100,116,139,0.1)", label: "Draft", icon: "📝" },
  scheduled: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", label: "Scheduled", icon: "🕐" },
  pending:   { color: "#2563EB", bg: "rgba(37,99,235,0.1)", label: "Pending Review", icon: "⏳" },
  rejected:  { color: "#EF4444", bg: "rgba(239,68,68,0.1)", label: "Rejected", icon: "❌" },
  approved:  { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", label: "Approved", icon: "💜" },
};

const EditorialPipeline = ({ dark, period }) => {
  const [statusData, setStatusData] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      axios.get("/api/admin/content-by-status"),
      axios.get(`/api/admin/dashboard/portfolio?period=${period}`)
    ]).then(([statusRes, portfolioRes]) => {
      if (statusRes.status === "fulfilled") {
        setStatusData(statusRes.value.data || []);
      }
      if (portfolioRes.status === "fulfilled") {
        setRecentItems(portfolioRes.value.data?.recentActivity || []);
      }
    }).finally(() => setLoading(false));
  }, [period]);

  const total = statusData.reduce((a, s) => a + Number(s.count || 0), 0) || 1;

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "recently";
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 20 }}>
      {/* ── Status Distribution ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
          Editorial Workflow
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 20 }}>
          📋 Live Database Content Pipeline
        </div>

        {/* Stacked progress bar */}
        <div style={{ height: 10, borderRadius: 6, overflow: "hidden", display: "flex", marginBottom: 24, gap: 2 }}>
          {statusData.map((s, i) => {
            const cfg = STATUS_CONFIG[s.status] || { color: "#94A3B8" };
            return (
              <Tooltip key={i} title={`${s.status}: ${s.count}`}>
                <div style={{ flex: Number(s.count || 0), background: cfg.color, transition: "flex 1s ease", cursor: "pointer" }} />
              </Tooltip>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {statusData.map((s, i) => {
            const cfg = STATUS_CONFIG[s.status] || { color: "#94A3B8", bg: "rgba(148,163,184,0.1)", label: s.status, icon: "📄" };
            const count = Number(s.count || 0);
            const pct = ((count / total) * 100).toFixed(1);
            return (
              <div key={i} style={{ borderRadius: 12, padding: "14px 16px", background: cfg.bg,
                border: `1px solid ${cfg.color}30`, transition: "transform 0.2s ease", cursor: "default" }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1rem" }}>{cfg.icon}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: cfg.color }}>{pct}%</span>
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: cfg.color, letterSpacing: "-0.03em", marginTop: 6 }}>
                  {count}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: dark ? "#64748B" : "#94A3B8" }}>
                  {cfg.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      <div style={{ borderRadius: 18, padding: "24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: "0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 4 }}>
          Live Editorial Audit
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: dark ? "#F1F5F9" : "#0F172A", marginBottom: 16 }}>
          ⚡ Recent Content Activity
        </div>

        {recentItems.length === 0 ? (
          <div style={{ textAlign: "center", color: dark ? "#64748B" : "#94A3B8", padding: "40px 0" }}>
            No recent activity recorded
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentItems.map((item, i) => {
              const cfg = STATUS_CONFIG[item.status] || { color: "#94A3B8", label: item.status || "item", icon: "📄", bg: "rgba(148,163,184,0.1)" };
              const authorName = item.first_name ? `${item.first_name} ${item.last_name || ""}` : "Editor";
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 12,
                  background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                  border: `1px solid ${dark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.8)"}`,
                  transition: "all 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=dark?"rgba(255,255,255,0.07)":"#F1F5F9"; e.currentTarget.style.borderColor=cfg.color+"40"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=dark?"rgba(255,255,255,0.03)":"#F8FAFC"; e.currentTarget.style.borderColor=dark?"rgba(51,65,85,0.4)":"rgba(226,232,240,0.8)"; }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, flexShrink: 0 }}>{cfg.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: dark ? "#CBD5E1" : "#1E293B",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.68rem", color: dark ? "#64748B" : "#94A3B8" }}>by {authorName}</span>
                        <span style={{ fontSize: "0.68rem", padding: "1px 6px", borderRadius: 4,
                          background: `${cfg.color}18`, color: cfg.color, fontWeight: 700 }}>
                          {cfg.label}
                        </span>
                        {item.category && (
                          <span style={{ fontSize: "0.68rem", color: dark ? "#64748B" : "#94A3B8" }}>
                            • {item.category}
                          </span>
                        )}
                        <span style={{ fontSize: "0.68rem", color: dark ? "#64748B" : "#94A3B8", marginLeft: "auto" }}>
                          {formatRelativeTime(item.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorialPipeline;
