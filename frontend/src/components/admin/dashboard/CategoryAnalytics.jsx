import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import { Tooltip } from "antd";
import axios from "axios";

const COLORS = ["#2563EB","#7C3AED","#0D9488","#F59E0B","#10B981","#EA580C","#DB2777","#06B6D4","#64748B","#16A34A"];

const CategoryAnalytics = ({ dark, period }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ categories:[], byType:[], trending:[] });

  useEffect(() => {
    setLoading(true);
    axios.get("/api/admin/dashboard/categories")
      .then(r => setData(r.data || {}))
      .catch(() => setData({ categories:[], byType:[], trending:[] }))
      .finally(() => setLoading(false));
  }, [period]);

  const cats = data.categories || [];
  const maxCount = Math.max(...cats.map(c=>Number(c.count||0)),1);

  const donutOptions = {
    chart: { type:"donut", background:"transparent", animations:{enabled:true,speed:1000} },
    theme: { mode:dark?"dark":"light" },
    labels: cats.map(c=>c.name),
    colors: cats.map((_,i)=>COLORS[i%COLORS.length]),
    plotOptions: {
      pie: { donut: { size:"68%", labels: {
        show:true, total:{
          show:true, label:"Total",
          color:dark?"#94A3B8":"#64748B", fontSize:"12px", fontWeight:700,
          formatter:()=>cats.reduce((a,c)=>a+Number(c.count||0),0).toString()
        }
      }}}
    },
    legend: { position:"bottom", fontSize:"11px", itemMargin:{horizontal:4,vertical:3},
      labels:{colors:dark?"#94A3B8":"#64748B"} },
    dataLabels: { enabled:false },
    stroke: { width:0 },
    tooltip: { theme:dark?"dark":"light", y:{formatter:(v)=>`${v} articles`} },
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
      {/* Donut Chart */}
      <div style={{ borderRadius:18, padding:"24px", background:dark?"#111C3D":"#FFFFFF",
        border:`1px solid ${dark?"rgba(51,65,85,0.6)":"rgba(226,232,240,0.9)"}`,
        boxShadow:"0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize:"0.68rem", fontWeight:800, letterSpacing:"0.1em",
          textTransform:"uppercase", color:dark?"#64748B":"#94A3B8", marginBottom:4 }}>Content Distribution</div>
        <div style={{ fontSize:"1rem", fontWeight:800, color:dark?"#F1F5F9":"#0F172A", marginBottom:12 }}>
          📂 Category-Wise Count
        </div>
        {loading ? (
          <div style={{ height:300, display:"flex", alignItems:"center", justifyContent:"center",
            color:dark?"#64748B":"#94A3B8" }}>Loading...</div>
        ) : cats.length === 0 ? (
          <div style={{ height:300, display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:8, color:dark?"#64748B":"#94A3B8" }}>
            <div style={{ fontSize:"2rem" }}>📭</div>
            <div>No categories found</div>
          </div>
        ) : (
          <ReactApexChart options={donutOptions} series={cats.map(c=>Number(c.count||0))} type="donut" height={300} />
        )}
      </div>

      {/* Category Leaderboard */}
      <div style={{ borderRadius:18, padding:"24px", background:dark?"#111C3D":"#FFFFFF",
        border:`1px solid ${dark?"rgba(51,65,85,0.6)":"rgba(226,232,240,0.9)"}`,
        boxShadow:"0 4px 20px -4px rgba(11,31,77,0.06)" }}>
        <div style={{ fontSize:"0.68rem", fontWeight:800, letterSpacing:"0.1em",
          textTransform:"uppercase", color:dark?"#64748B":"#94A3B8", marginBottom:4 }}>Top Categories</div>
        <div style={{ fontSize:"1rem", fontWeight:800, color:dark?"#F1F5F9":"#0F172A", marginBottom:16 }}>
          🔥 Content by Category
        </div>
        {cats.length === 0 && !loading ? (
          <div style={{ textAlign:"center", paddingTop:40, color:dark?"#64748B":"#94A3B8" }}>
            No category data available
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {cats.slice(0,10).map((cat,i)=>{
              const color = COLORS[i%COLORS.length];
              const pct = maxCount > 0 ? ((Number(cat.count||0)/maxCount)*100) : 0;
              const trending = (data.trending||[]).some(t=>t.name===cat.name);
              return (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }} />
                      <span style={{ fontSize:"0.82rem", fontWeight:600, color:dark?"#CBD5E1":"#334155",
                        maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {cat.name}
                      </span>
                      {trending && (
                        <span style={{ fontSize:"0.64rem", fontWeight:800, background:"rgba(239,68,68,0.1)",
                          color:"#EF4444", padding:"1px 6px", borderRadius:5, flexShrink:0 }}>🔥 HOT</span>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize:"0.82rem", fontWeight:800, color }}>{cat.count||0}</span>
                      <span style={{ fontSize:"0.68rem", color:dark?"#64748B":"#94A3B8", marginLeft:4 }}>articles</span>
                    </div>
                  </div>
                  <div style={{ height:5, borderRadius:3, background:dark?"rgba(51,65,85,0.4)":"#F1F5F9", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, borderRadius:3,
                      background:color, transition:"width 1s ease" }} />
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

export default CategoryAnalytics;
