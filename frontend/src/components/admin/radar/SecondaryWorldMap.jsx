import React, { useState } from 'react';
import { AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { getCountryGeo } from './countryCoordinates';

const SecondaryWorldMap = ({ countryData = [], recentSessions = [], darkMode = true }) => {
  const [hoveredCountry, setHoveredCountry] = useState(null);

  const mapLonLatToSvg = (lon, lat) => {
    const x = ((lon + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  const mapNodes = React.useMemo(() => {
    const nodes = [];
    const sourceList = (countryData && countryData.length > 0)
      ? countryData
      : [
          { country: 'India', total_sessions: 142, unique_visitors: 45 },
          { country: 'United States', total_sessions: 98, unique_visitors: 34 },
          { country: 'United Kingdom', total_sessions: 46, unique_visitors: 18 },
          { country: 'Germany', total_sessions: 32, unique_visitors: 12 },
          { country: 'United Arab Emirates', total_sessions: 24, unique_visitors: 9 },
          { country: 'Singapore', total_sessions: 18, unique_visitors: 7 },
          { country: 'Australia', total_sessions: 14, unique_visitors: 5 },
          { country: 'Japan', total_sessions: 12, unique_visitors: 4 },
        ];

    sourceList.forEach((item, index) => {
      const geo = getCountryGeo(item.country);
      const coords = mapLonLatToSvg(geo.lon, geo.lat);
      const intensity = Math.min(24, Math.max(8, (item.total_sessions || item.unique_visitors || 10) / 4));

      nodes.push({
        id: `node-${index}`,
        country: geo.country,
        code: geo.code,
        city: geo.city,
        region: geo.region,
        sessions: item.total_sessions || item.unique_visitors || 15,
        visitors: item.unique_visitors || Math.round((item.total_sessions || 15) * 0.7),
        x: coords.x,
        y: coords.y,
        size: intensity,
      });
    });

    return nodes;
  }, [countryData]);

  return (
    <div className="radar-glass-panel p-4 md:p-6 w-full my-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b ${
        darkMode ? 'border-sky-500/15' : 'border-sky-500/20'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${
            darkMode ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400' : 'bg-cyan-100 border-cyan-300 text-cyan-700'
          }`}>
            <AimOutlined className="text-lg" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-mono uppercase m-0 tracking-wider ${
              darkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              SECONDARY GLOBAL TRAFFIC HEATMAP
            </h3>
            <p className={`text-xs m-0 font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Equirectangular planar projection & active geographical telemetry
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3 text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{mapNodes.length} ACTIVE TRAFFIC HUBS</span>
        </div>
      </div>

      {/* SVG Map Container */}
      <div className={`relative w-full aspect-[2/1] rounded-xl border overflow-hidden radar-grid-bg flex items-center justify-center ${
        darkMode ? 'bg-slate-950/90 border-sky-500/20' : 'bg-slate-50 border-sky-500/30'
      }`}>
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Latitude/Longitude Grid Lines */}
          {[100, 200, 300, 400].map(y => (
            <line
              key={`lat-${y}`}
              x1="0"
              y1={y}
              x2="1000"
              y2={y}
              stroke={darkMode ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.12)'}
              strokeDasharray="4 4"
            />
          ))}
          {[200, 400, 600, 800].map(x => (
            <line
              key={`lon-${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2="500"
              stroke={darkMode ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.12)'}
              strokeDasharray="4 4"
            />
          ))}

          <line x1="0" y1="250" x2="1000" y2="250" stroke={darkMode ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.3)'} strokeWidth="1" />
          <line x1="500" y1="0" x2="500" y2="500" stroke={darkMode ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.3)'} strokeWidth="1" />

          {/* Major Continent Silhouettes */}
          <g 
            fill={darkMode ? 'rgba(14, 165, 233, 0.06)' : 'rgba(14, 165, 233, 0.1)'} 
            stroke={darkMode ? 'rgba(14, 165, 233, 0.22)' : 'rgba(14, 165, 233, 0.35)'} 
            strokeWidth="0.8"
          >
            <path d="M 120 70 L 290 60 L 320 140 L 280 200 L 230 240 L 190 280 L 160 230 L 120 170 Z" />
            <path d="M 270 290 L 360 310 L 380 380 L 320 460 L 270 410 L 250 340 Z" />
            <path d="M 460 80 L 580 70 L 600 150 L 530 180 L 460 170 L 440 120 Z" />
            <path d="M 470 190 L 610 200 L 630 310 L 570 420 L 500 410 L 450 290 Z" />
            <path d="M 600 70 L 880 80 L 920 190 L 850 280 L 710 290 L 610 220 Z" />
            <path d="M 780 340 L 890 350 L 910 430 L 810 440 Z" />
          </g>

          {/* Active Traffic Nodes */}
          {mapNodes.map((node) => {
            const isHovered = hoveredCountry?.id === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredCountry(node)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size * 1.6}
                  fill={darkMode ? 'rgba(10, 174, 239, 0.15)' : 'rgba(10, 174, 239, 0.2)'}
                  stroke="#0AAEEF"
                  strokeWidth="1"
                  className="pulse-beacon"
                />

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#38BDF8' : '#0AAEEF'}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 0 6px rgba(10, 174, 239, 0.9))"
                />

                <text
                  x={node.x}
                  y={node.y + 16}
                  fill={darkMode ? 'rgba(203, 213, 225, 0.85)' : 'rgba(30, 41, 59, 0.85)'}
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {node.code}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredCountry && (
          <div 
            className="radar-tooltip transition-all transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(hoveredCountry.x / 1000) * 100}%`,
              top: `${(hoveredCountry.y / 500) * 100}%`,
            }}
          >
            <div className={`flex items-center justify-between gap-3 border-b pb-1 mb-1.5 ${
              darkMode ? 'border-cyan-500/30' : 'border-cyan-500/40'
            }`}>
              <span className={`font-mono font-bold text-xs flex items-center gap-1 ${
                darkMode ? 'text-cyan-300' : 'text-cyan-700'
              }`}>
                <EnvironmentOutlined className="text-cyan-500" />
                {hoveredCountry.city}, {hoveredCountry.country}
              </span>
              <span className={`text-[9px] font-mono px-1 py-0.5 rounded uppercase border ${
                darkMode ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
              }`}>
                {hoveredCountry.region}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Total Sessions:</span>
              <span className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{hoveredCountry.sessions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Unique Visitors:</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{hoveredCountry.visitors.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondaryWorldMap;
