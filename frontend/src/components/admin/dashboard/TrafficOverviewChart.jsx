import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from "axios";

const PALETTE = ["#2563EB","#06B6D4","#10B981","#F43F5E","#7C3AED","#F59E0B","#0D9488","#EA580C"];

const TrafficOverviewChart = ({ dark, period }) => {
  const [metric, setMetric] = useState("sessions");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ dailySessions:[], dailyPageViews:[], regional:[], summary:{} });

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/admin/dashboard/traffic?period=${period}`)
      .then(r => setData(r.data || {}))
      .catch(() => setData({ dailySessions:[], dailyPageViews:[], regional:[], summary:{} }))
      .finally(() => setLoading(false));
  }, [period]);

  // Build chart categories (dates) from daily data
  const sessionDates = (data.dailySessions || []).map(d => d.date?.toString().slice(5) || "");
  const pvDates     = (data.dailyPageViews || []).map(d => d.date?.toString().slice(5) || "");

  const metricsMap = {
    sessions:    { label:"Sessions",    color:"#2563EB", data: (data.dailySessions||[]).map(d=>Number(d.sessions||0)),     dates: sessionDates },
    pageViews:   { label:"Page Views",  color:"#06B6D4", data: (data.dailyPageViews||[]).map(d=>Number(d.page_views||0)), dates: pvDates },
    uniqueUsers: { label:"Unique Users",color:"#10B981", data: (data.dailySessions||[]).map(d=>Number(d.unique_users||0)), dates: sessionDates },
    bounces:     { label:"Bounces",     color:"#F43F5E", data: (data.dailySessions||[]).map(d=>Number(d.bounces||0)),      dates: sessionDates },
  };

  const active = metricsMap[metric];

  const chartOptions = {
    chart: { type:"area", toolbar:{show:false}, background:"transparent",
      animations:{enabled:true, easing:"easeinout", speed:800} },
    theme: { mode: dark?"dark":"light" },
    colors: [active.color],
    stroke: { curve:"smooth", width:3 },
    fill: { type:"gradient", gradient:{shadeIntensity:1,opacityFrom:0.3,opacityTo:0.02,stops:[0,100]} },
    markers: { size:0, hover:{size:5} },
    xaxis: {
      categories: active.dates,
      labels: { style:{colors:dark?"#64748B":"#94A3B8",fontSize:"11px"}, rotate:-30 },
      axisBorder:{show:false}, axisTicks:{show:false},
    },
    yaxis: { labels:{style:{colors:dark?"#64748B":"#94A3B8",fontSize:"11px"}} },
    grid: { borderColor:dark?"rgba(51,65,85,0.3)":"rgba(226,232,240,0.7)", strokeDashArray:5 },
    dataLabels: { enabled:false },
    tooltip: { theme:dark?"dark":"light", x:{format:"dd MMM"} },
  };

  const summary = data.summary || {};
  const regional = data.regional || [];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
      {/* Main Chart */}
      <div style={{ borderRadius:18, padding:"24px",
        background:dark?"#111C3D":"#FFFFFF",
        border:`1px solid ${dark?"rgba(51,65,85,0.6)":"rgba(226,232,240,0.9)"}`,
        boxShadow:"0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ fontSize:"0.68rem", fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase",
              color:dark?"#64748B":"#94A3B8", marginBottom:4 }}>Session Traffic Analytics</div>
            <div style={{ display:"flex", gap:20, marginTop:6 }}>
              {[
                { label:"Sessions", value:(summary.totalSessions||0).toLocaleString(), color:"#2563EB" },
                { label:"Unique", value:(summary.uniqueVisitors||0).toLocaleString(), color:"#10B981" },
                { label:"Bounce %", value:`${summary.bounceRate||0}%`, color:"#F43F5E" },
              ].map((s,i)=>(
                <div key={i}>
                  <div style={{ fontSize:"1rem", fontWeight:900, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:"0.64rem", color:dark?"#64748B":"#94A3B8", fontWeight:700 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {Object.entries(metricsMap).map(([key,m])=>(
              <button key={key} onClick={()=>setMetric(key)} style={{
                padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:"0.76rem", fontWeight:700,
                border:"1px solid", fontFamily:"inherit", transition:"all 0.2s",
                background: metric===key ? m.color : dark?"rgba(30,41,59,0.8)":"rgba(241,245,249,0.9)",
                color: metric===key ? "#FFF" : dark?"#94A3B8":"#475569",
                borderColor: metric===key ? m.color : dark?"#334155":"#E2E8F0",
              }}>{m.label}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ height:280, display:"flex", alignItems:"center", justifyContent:"center",
            color:dark?"#64748B":"#94A3B8", fontSize:"0.9rem" }}>Loading traffic data...</div>
        ) : active.data.length === 0 ? (
          <div style={{ height:280, display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:8, color:dark?"#64748B":"#94A3B8" }}>
            <div style={{ fontSize:"2rem" }}>📭</div>
            <div style={{ fontSize:"0.88rem" }}>No session data recorded yet</div>
            <div style={{ fontSize:"0.76rem" }}>Visitor data will appear here as users visit the site</div>
          </div>
        ) : (
          <ReactApexChart options={chartOptions}
            series={[{name:active.label, data:active.data}]} type="area" height={280} />
        )}
      </div>

      {/* Regional Breakdown */}
      <div style={{ borderRadius:18, padding:"24px",
        background:dark?"#111C3D":"#FFFFFF",
        border:`1px solid ${dark?"rgba(51,65,85,0.6)":"rgba(226,232,240,0.9)"}`,
        boxShadow:"0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize:"0.68rem", fontWeight:800, letterSpacing:"0.1em",
          textTransform:"uppercase", color:dark?"#64748B":"#94A3B8", marginBottom:4 }}>
          Geographic Distribution
        </div>
        <div style={{ fontSize:"1rem", fontWeight:800, color:dark?"#F1F5F9":"#0F172A", marginBottom:20 }}>
          🌍 Traffic by Region
        </div>
        {regional.length === 0 ? (
          <div style={{ textAlign:"center", color:dark?"#64748B":"#94A3B8", paddingTop:40 }}>
            <div style={{ fontSize:"2rem" }}>🌐</div>
            <div style={{ fontSize:"0.82rem", marginTop:8 }}>No regional data yet</div>
          </div>
        ) : regional.map((r,i)=>(
          <div key={i} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:"0.82rem", fontWeight:600, color:dark?"#CBD5E1":"#334155" }}>{r.region}</span>
              <span style={{ fontSize:"0.78rem", fontWeight:800, color:PALETTE[i%PALETTE.length] }}>
                {Number(r.sessions).toLocaleString()} · {r.pct}%
              </span>
            </div>
            <div style={{ height:6, borderRadius:4, background:dark?"rgba(51,65,85,0.4)":"#F1F5F9", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(Number(r.pct)||0,100)}%`, borderRadius:4,
                background:PALETTE[i%PALETTE.length], transition:"width 1s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficOverviewChart;
