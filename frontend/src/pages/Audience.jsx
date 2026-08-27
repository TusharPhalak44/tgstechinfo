import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  Globe,
  Users,
  Building2,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Briefcase,
  Cpu,
  Compass,
  Award,
  Zap,
  Target,
  FileText,
  PieChart,
  BarChart2,
  Lock
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Map, MapControls } from '@/components/ui/map';
import { REGIONAL_DATA } from '@/components/ui/worldVectorData';
import { audienceService } from '@/services/audienceService';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function Audience() {
  const { darkMode } = useTheme();
  const [selectedRegionId, setSelectedRegionId] = useState('GLOBAL');

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-[#070E1A] text-slate-100' : 'bg-[#FAFBFD] text-slate-900'
      }`}
    >
      {/* ── Dynamic Ambient Page Background Animation ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Floating Aurora 1: Electric Cyan */}
        <motion.div
          animate={{
            x: [-40, 50, -40],
            y: [-30, 40, -30],
            scale: [1, 1.2, 1],
            opacity: darkMode ? [0.18, 0.28, 0.18] : [0.12, 0.22, 0.12]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full blur-[140px] bg-[#0AAEEF]"
        />

        {/* Floating Aurora 2: Sunfire Amber */}
        <motion.div
          animate={{
            x: [40, -50, 40],
            y: [30, -40, 30],
            scale: [1.1, 0.9, 1.1],
            opacity: darkMode ? [0.14, 0.24, 0.14] : [0.08, 0.18, 0.08]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -right-28 w-[550px] h-[550px] rounded-full blur-[150px] bg-[#F7941D]"
        />

        {/* Floating Aurora 3: Emerald Sync */}
        <motion.div
          animate={{
            x: [-35, 45, -35],
            y: [25, -35, 25],
            scale: [0.95, 1.15, 0.95],
            opacity: darkMode ? [0.14, 0.22, 0.14] : [0.08, 0.16, 0.08]
          }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-2/3 left-10 w-[500px] h-[500px] rounded-full blur-[150px] bg-[#10B981]"
        />

        {/* Floating Aurora 4: Royal Indigo / Purple */}
        <motion.div
          animate={{
            x: [30, -30, 30],
            y: [-30, 30, -30],
            scale: [1, 1.25, 1],
            opacity: darkMode ? [0.12, 0.2, 0.12] : [0.06, 0.14, 0.06]
          }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 right-1/4 w-[520px] h-[520px] rounded-full blur-[160px] bg-[#8B5CF6]"
        />

        {/* Dynamic Subtle Tech Dot Grid */}
        <div
          className={`absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] ${
            darkMode ? 'opacity-[0.04]' : 'opacity-[0.06]'
          }`}
        />
      </div>

      {/* ── 1. Hero Section ── */}
      <section className="relative z-10 overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Top Brand Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-6 bg-sky-500/10 border-sky-500/30 text-[#0AAEEF] dark:text-[#38BDF8]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Global B2B Reach</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]"
            >
              Connect with{' '}
              <span className="bg-gradient-to-r from-[#0AAEEF] via-[#0284C7] to-[#F7941D] bg-clip-text text-transparent">
                78 Million+
              </span>{' '}
              Decision-Makers Worldwide
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`mt-6 text-base sm:text-lg leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Taraj Global empowers enterprise technology vendors and B2B marketers with verified,
              high-intent C-Suite leaders, Directors, and senior professionals across 195+ countries.
            </motion.p>
          </div>

          {/* ── Key Metrics Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {[
              {
                icon: Users,
                num: 78,
                decimals: 0,
                suffix: 'M+',
                label: 'Business Professionals',
                color: 'text-[#0AAEEF]',
                iconBg: 'bg-sky-500/10 border-sky-500/20 text-[#0AAEEF]',
                glowRgba: 'rgba(10, 174, 239, 0.25)',
                borderHover: 'hover:border-[#0AAEEF]'
              },
              {
                icon: Building2,
                num: 4.25,
                decimals: 2,
                suffix: 'M+',
                label: 'Target Enterprise Accounts',
                color: 'text-[#F7941D]',
                iconBg: 'bg-amber-500/10 border-amber-500/20 text-[#F7941D]',
                glowRgba: 'rgba(247, 148, 29, 0.25)',
                borderHover: 'hover:border-[#F7941D]'
              },
              {
                icon: Globe,
                num: 195,
                decimals: 0,
                suffix: '+',
                label: 'Countries & Territories',
                color: 'text-[#10B981]',
                iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-[#10B981]',
                glowRgba: 'rgba(16, 185, 129, 0.25)',
                borderHover: 'hover:border-[#10B981]'
              },
              {
                icon: Award,
                num: 82,
                decimals: 0,
                suffix: '%',
                label: 'CXO & Director Level',
                color: 'text-[#0284C7]',
                iconBg: 'bg-blue-500/10 border-blue-500/20 text-[#0284C7]',
                glowRgba: 'rgba(2, 132, 199, 0.25)',
                borderHover: 'hover:border-[#0284C7]'
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: [0, -5, 0]
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.2 + i * 0.1 },
                  y: {
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3
                  }
                }}
                whileHover={{
                  y: -8,
                  scale: 1.025,
                  boxShadow: `0 16px 32px ${stat.glowRgba}`,
                  transition: { duration: 0.2 }
                }}
                className={`relative group p-5 sm:p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                  darkMode
                    ? 'bg-slate-900/80 border-slate-800/90 shadow-lg'
                    : 'bg-white/90 border-slate-200/90 shadow-[0_8px_24px_rgba(10,174,239,0.06)]'
                } ${stat.borderHover}`}
              >
                {/* Micro Hover Corner Glow Accent */}
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
                  style={{ background: stat.glowRgba }}
                />

                <div className="flex items-center gap-3.5">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stat.iconBg} shrink-0 transition-transform`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-baseline">
                      <CountUp
                        end={stat.num}
                        decimals={stat.decimals}
                        duration={2.2}
                        separator=","
                        enableScrollSpy
                        scrollSpyOnce
                      />
                      <span>{stat.suffix}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-tight mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 2. Real Google World Geographic Map Section ── */}
      <section className="py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0AAEEF] mb-2">
                <Compass className="w-4 h-4" />
                <span>Google Geographic Intelligence Map</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Global Coverage & Regional Sizing Map
              </h2>
              <p className={`mt-2 text-sm sm:text-base ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Actual world geography with verified audience counts. Select a continent pill or zoom in to inspect country numbers.
              </p>
            </div>

            {/* Quick Regional Pills in Website Colors */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedRegionId('GLOBAL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  selectedRegionId === 'GLOBAL'
                    ? 'bg-gradient-to-r from-[#0AAEEF] to-[#0284C7] text-white border-[#0AAEEF] shadow-md'
                    : darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-[#0AAEEF]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#0AAEEF]'
                }`}
              >
                🌍 Global (78M+)
              </button>

              {REGIONAL_DATA.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegionId(reg.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    selectedRegionId === reg.id
                      ? 'bg-gradient-to-r from-[#0AAEEF] to-[#0284C7] text-white border-[#0AAEEF] shadow-md'
                      : darkMode
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-[#0AAEEF]'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-[#0AAEEF]'
                  }`}
                >
                  {reg.code} <span className="text-[#F7941D] font-mono">({reg.contacts})</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Embedded Google Map Component ── */}
          <div className="h-[480px] sm:h-[540px] w-full">
            <Map
              center={[2.3522, 48.8566]}
              activeRegion={selectedRegionId}
              onSelectRegion={(rId) => setSelectedRegionId(rId)}
              className="h-full w-full"
            >
              <MapControls
                position="bottom-right"
                showZoom
                showCompass
                showLocate
                showFullscreen
              />
            </Map>
          </div>
        </div>
      </section>

      {/* ── 3. Enhanced Animated Multidimensional Audience Allocations Cards ── */}
      <section className="py-12 lg:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F7941D] mb-2.5"
            >
              <Layers className="w-4 h-4" />
              <span>Firmographic & Persona Allocations</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-4xl font-extrabold tracking-tight"
            >
              Multidimensional Audience Allocations
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={`mt-3 text-sm sm:text-base ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Granular distribution across core industry sectors, functional decision centers, and executive seniority authority.
            </motion.p>
          </div>

          {/* ── Staggered Animated Cards Grid ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {/* ── Card 1: Industry Sectors ── */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`p-7 rounded-3xl border transition-all duration-300 hover:shadow-2xl relative overflow-hidden ${
                darkMode
                  ? 'bg-slate-900/80 border-slate-800 hover:border-[#F7941D]/40 shadow-xl'
                  : 'bg-white border-slate-200/80 hover:border-[#F7941D] shadow-[0_12px_36px_rgba(247,148,29,0.06)]'
              }`}
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F7941D] via-[#FB923C] to-[#FBBF24]" />

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-[#F7941D] flex items-center justify-center shadow-inner">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Industry Sectors</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    12 Primary Verticals
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Technology & Telecommunications', count: '17.2M+', share: 22 },
                  { name: 'Finance, Banking & VC', count: '12.5M+', share: 16 },
                  { name: 'Manufacturing & Process', count: '11.0M+', share: 14 },
                  { name: 'Healthcare & Pharma', count: '8.6M+', share: 11 },
                  { name: 'Business & Professional Services', count: '7.8M+', share: 10 },
                  { name: 'Retail, Wholesale & Logistics', count: '6.2M+', share: 8 }
                ].map((item, i) => (
                  <div key={i} className="group/row">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="truncate max-w-[70%] group-hover/row:text-[#F7941D] transition-colors">
                        {item.name}
                      </span>
                      <span className="font-mono text-[#F7941D] font-bold">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.share * 4.2}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#F7941D] to-[#FB923C] rounded-full shadow-[0_0_8px_rgba(247,148,29,0.5)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Card 2: Department Functions ── */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`p-7 rounded-3xl border transition-all duration-300 hover:shadow-2xl relative overflow-hidden ${
                darkMode
                  ? 'bg-slate-900/80 border-slate-800 hover:border-[#10B981]/40 shadow-xl'
                  : 'bg-white border-slate-200/80 hover:border-[#10B981] shadow-[0_12px_36px_rgba(16,185,129,0.06)]'
              }`}
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#6EE7B7]" />

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-[#10B981] flex items-center justify-center shadow-inner">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Department Functions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Decision Centers
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'IT & Engineering', count: '25.1M+', share: 32 },
                  { name: 'Sales & Revenue Leadership', count: '14.1M+', share: 18 },
                  { name: 'Marketing & Digital', count: '12.5M+', share: 16 },
                  { name: 'Operations & Procurement', count: '10.9M+', share: 14 },
                  { name: 'Finance & Accounting', count: '7.8M+', share: 10 },
                  { name: 'Human Resources & Talent', count: '4.7M+', share: 6 }
                ].map((item, i) => (
                  <div key={i} className="group/row">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="group-hover/row:text-[#10B981] transition-colors">
                        {item.name}
                      </span>
                      <span className="font-mono text-[#10B981] font-bold">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.share * 3.1}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Card 3: Seniority Levels ── */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`p-7 rounded-3xl border transition-all duration-300 hover:shadow-2xl relative overflow-hidden ${
                darkMode
                  ? 'bg-slate-900/80 border-slate-800 hover:border-[#0AAEEF]/40 shadow-xl'
                  : 'bg-white border-slate-200/80 hover:border-[#0AAEEF] shadow-[0_12px_36px_rgba(10,174,239,0.06)]'
              }`}
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0AAEEF] via-[#0284C7] to-[#38BDF8]" />

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-[#0AAEEF] flex items-center justify-center shadow-inner">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Seniority Levels</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Decision Authority
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Director Level', count: '20.4M+', share: 26 },
                  { name: 'Manager / Decision Maker', count: '23.5M+', share: 30 },
                  { name: 'VP & Executive Leadership', count: '10.9M+', share: 14 },
                  { name: 'C-Level & Board CXOs', count: '9.4M+', share: 12 },
                  { name: 'Technical Leads & Architects', count: '10.9M+', share: 14 },
                  { name: 'Other Professional Staff', count: '3.1M+', share: 4 }
                ].map((item, i) => (
                  <div key={i} className="group/row">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="group-hover/row:text-[#0AAEEF] transition-colors">
                        {item.name}
                      </span>
                      <span className="font-mono text-[#0AAEEF] font-bold">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.share * 3.3}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#0AAEEF] to-[#0284C7] rounded-full shadow-[0_0_8px_rgba(10,174,239,0.5)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 4. Verification Pillars ── */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-12 rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-slate-900/30 to-amber-500/10 dark:from-sky-950/40 dark:to-slate-900/60"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0AAEEF] mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>Uncompromising Data Standards</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  How We Ensure High-Quality Demographic Accuracy
                </h3>
                <p className={`mt-4 text-sm sm:text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Our database undergoes automated 30-day freshness cycles, multi-point verification,
                  and strict global privacy compliance (GDPR, CCPA, CASL) to ensure maximum engagement
                  for syndication campaigns.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    'Automated email deliverability and phone connectivity checks',
                    'Zero PII exposure on public analytics layers',
                    'Direct title-to-seniority taxonomic normalization',
                    'Strict compliance with international privacy protocols'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs sm:text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Illustration with Subtle Floating Micro-Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative flex items-center justify-center p-2 sm:p-4"
              >
                {/* Ambient Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/25 via-emerald-500/20 to-transparent rounded-3xl blur-3xl pointer-events-none" />

                {/* Animated Image Illustration */}
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10 w-full max-w-lg flex items-center justify-center"
                >
                  <img
                    src="/images/data_standards_illustration.svg"
                    alt="Data Standards and Quality Verification Illustration"
                    className="w-full h-auto max-h-[380px] object-contain drop-shadow-[0_20px_35px_rgba(10,174,239,0.25)] select-none pointer-events-none"
                    loading="lazy"
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. Enterprise CTA ── */}
      <section className="py-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Target Your Ideal Customer Profile?
            </h2>
            <p className={`mt-4 text-sm sm:text-base ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Speak directly with the Taraj Global publishing and demand generation team to activate
              custom content syndication, whitepaper distribution, or CXO outreach.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#F7941D] to-[#E67E00] hover:from-[#FB923C] hover:to-[#F7941D] shadow-lg shadow-amber-500/25 transition-all cursor-pointer">
                  <span>Speak with Audience Specialist</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link to="/case-studies">
                <button
                  className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                    darkMode
                      ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#0AAEEF]" />
                  <span>View Customer Case Studies</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
