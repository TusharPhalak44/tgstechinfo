import React, { useState, useEffect, useRef } from "react";
import { Skeleton } from "antd";
import {
  FileTextOutlined, EyeOutlined, UserOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined,
  FieldTimeOutlined, TeamOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import axios from "axios";

function useCountUp(target, duration, active) {
  const [val, setVal] = useState(0);
  const frame = useRef(null);
  useEffect(() => {
    if (!active || !target) { setVal(target || 0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(step);
      else setVal(target);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration, active]);
  return val;
}

function KPICard({ icon, label, value, delta, accent, dark, suffix = "", loading, format }) {
  const displayed = useCountUp(value, 1400, !loading);
  const formatted = format
    ? format(displayed)
    : displayed >= 1000000
      ? `${(displayed / 1000000).toFixed(1)}M`
      : displayed >= 1000
        ? `${(displayed / 1000).toFixed(1)}K`
        : String(displayed);

  return (
    <div
      style={{
        borderRadius: 18, padding: "22px 24px",
        background: dark ? "#111C3D" : "#FFFFFF",
        border: `1px solid ${dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.9)"}`,
        boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.18)" : "0 4px 20px -4px rgba(11,31,77,0.06)",
        transition: "all 0.26s cubic-bezier(0.2,0.8,0.2,1)",
        position: "relative", overflow: "hidden", cursor: "default",
      }}
      className="kpi-card-animated"
    >
      <div style={{
        position: "absolute", top: -30, right: -30, width: 100, height: 100,
        borderRadius: "50%", background: `radial-gradient(circle,${accent}28 0%,transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", color: dark ? "#64748B" : "#94A3B8", marginBottom: 8,
          }}>{label}</div>
          {loading ? (
            <Skeleton.Input active size="large" style={{ width: 100, borderRadius: 8 }} />
          ) : (
            <div style={{
              fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800,
              color: dark ? "#F1F5F9" : "#0F172A", letterSpacing: "-0.04em", lineHeight: 1,
            }}>
              {formatted}{suffix}
            </div>
          )}
          {!loading && delta !== undefined && delta !== null && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10,
              padding: "3px 8px", borderRadius: 7, fontSize: "0.7rem", fontWeight: 700,
              background: delta >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: delta >= 0 ? "#059669" : "#DC2626",
            }}>
              {delta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(delta)}% vs last period
            </div>
          )}
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: `${accent}18`,
          border: `1.5px solid ${accent}30`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22, color: accent, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const ExecutiveKPICards = ({ dark, period, onPeriodChange }) => {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({
    totalPublished: 0, totalDrafts: 0, totalPending: 0,
    totalViews: 0, totalUsers: 0, totalSubscribers: 0,
    avgReadTime: 0, engagementRate: 0, viewsDelta: 0,
  });

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/dashboard/kpis?period=${period}`)
      .then(r => setKpi(r.data || {}))
      .catch(() => {
        // Fallback to /api/admin/stats if new endpoint not yet available
        return axios.get("/api/admin/stats").then(r => setKpi(p => ({ ...p, ...r.data })));
      })
      .finally(() => setLoading(false));
  }, [period]);

  const cards = [
    { icon: <CheckCircleOutlined />, label: "Published Articles",  value: kpi.totalPublished,   delta: 12.4,          accent: "#10B981" },
    { icon: <ClockCircleOutlined />, label: "Pending Review",      value: kpi.totalPending,     delta: -5.2,          accent: "#F59E0B" },
    { icon: <FileTextOutlined />,    label: "Total Drafts",        value: kpi.totalDrafts,      delta: null,          accent: "#2563EB" },
    { icon: <EyeOutlined />,         label: "Total Page Views",    value: kpi.totalViews,       delta: kpi.viewsDelta, accent: "#7C3AED" },
    { icon: <UserOutlined />,        label: "Registered Users",    value: kpi.totalUsers,       delta: null,          accent: "#0D9488" },
    { icon: <TeamOutlined />,        label: "Subscribers",         value: kpi.totalSubscribers, delta: null,          accent: "#EA580C" },
    {
      icon: <FieldTimeOutlined />, label: "Avg. Read Time",
      value: Math.round((kpi.avgReadTime || 0) * 10) / 10,
      suffix: " min", delta: null, accent: "#DB2777", format: (v) => `${v}`,
    },
    {
      icon: <ThunderboltOutlined />, label: "Engagement Rate",
      value: kpi.engagementRate || 0, suffix: "%",
      delta: null, accent: "#16A34A", format: (v) => `${v}`,
    },
  ];

  return (
    <div>
      <style>{`
        .kpi-card-animated:hover { transform:translateY(-4px); box-shadow:0 16px 36px -8px rgba(11,31,77,0.12)!important; }
        .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        @media(max-width:1200px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.kpi-grid{grid-template-columns:1fr}}
        .kpi-period-btn { padding:5px 14px; border-radius:8px; cursor:pointer; font-size:0.76rem;
          font-weight:700; border:1px solid; transition:all 0.2s ease; font-family:inherit; }
      `}</style>

      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:20 }}>
        <span style={{ fontSize:"0.8rem", fontWeight:700, color:dark?"#64748B":"#94A3B8" }}>📊 Period:</span>
        {["7d","30d","90d","ytd","all"].map(p => (
          <button key={p} className="kpi-period-btn" onClick={() => onPeriodChange && onPeriodChange(p)} style={{
            background: period===p ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : dark ? "rgba(30,41,59,0.8)" : "rgba(241,245,249,0.9)",
            color: period===p ? "#FFF" : dark ? "#94A3B8" : "#475569",
            borderColor: period===p ? "#2563EB" : dark ? "#334155" : "#E2E8F0",
          }}>
            {p==="ytd"?"YTD":p==="all"?"All Time":p.replace("d","D")}
          </button>
        ))}
        {loading && <span style={{ fontSize:"0.72rem", color:dark?"#64748B":"#94A3B8" }}>Loading...</span>}
      </div>

      <div className="kpi-grid">
        {cards.map((c, i) => <KPICard key={i} {...c} dark={dark} loading={loading} />)}
      </div>
    </div>
  );
};

export default ExecutiveKPICards;
