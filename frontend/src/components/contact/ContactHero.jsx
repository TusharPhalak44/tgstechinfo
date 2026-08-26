import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ShieldCheck, Zap, Globe2 } from 'lucide-react';

export const ContactHero = ({ bgImage = '/contact_hero_bg.jpg' }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden py-16 md:py-24 mb-10 rounded-3xl shadow-2xl border border-white/10 group"
    >
      {/* Background Image - Clean & Crisp */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      
      {/* Subtle Neutral Dark Vignette (No Heavy Tint) for High Contrast */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.70) 100%)'
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Live Desk Badge with Smooth Motion */}
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full text-xs font-bold bg-black/45 backdrop-blur-md text-amber-300 border border-white/20 mb-6 shadow-xl"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold tracking-wide">EDITORIAL DESK ACTIVE</span>
          <span className="text-white/40">•</span>
          <span className="text-slate-100">24–48 Hr Response Guarantee</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-xl"
        >
          Connect with Our <br className="hidden sm:inline" />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #FFFFFF 30%, #F7941D 100%)',
            }}
          >
            Editorial & Media Newsroom
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 text-base sm:text-lg text-slate-100 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow"
        >
          Pitch tech news stories, guest opinion columns, corporate press releases, or sponsorship inquiries directly to our publishing board.
        </motion.p>

        {/* Quick Stats Cards with Staggered Entrance & Hover Motion */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-white/20 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -5, scale: 1.03 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/20 shadow-lg"
          >
            <Newspaper className="w-7 h-7 text-amber-400 shrink-0" />
            <div>
              <div className="text-base font-extrabold text-white">10,000+</div>
              <div className="text-[11px] text-slate-200">Articles Published</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -5, scale: 1.03 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/20 shadow-lg"
          >
            <Globe2 className="w-7 h-7 text-sky-400 shrink-0" />
            <div>
              <div className="text-base font-extrabold text-white">50+ Verticals</div>
              <div className="text-[11px] text-slate-200">Global Coverage</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -5, scale: 1.03 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/20 shadow-lg"
          >
            <Zap className="w-7 h-7 text-emerald-400 shrink-0" />
            <div>
              <div className="text-base font-extrabold text-white">Direct Desk</div>
              <div className="text-[11px] text-slate-200">Instant Routing</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -5, scale: 1.03 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/20 shadow-lg"
          >
            <ShieldCheck className="w-7 h-7 text-purple-400 shrink-0" />
            <div>
              <div className="text-base font-extrabold text-white">Verified Privacy</div>
              <div className="text-[11px] text-slate-200">Protected Inquiries</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
