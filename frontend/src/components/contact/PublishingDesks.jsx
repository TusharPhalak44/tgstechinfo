import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Megaphone, PenTool, Building2, ArrowRight, Sparkles } from 'lucide-react';

const desks = [
  {
    id: 'editorial',
    title: 'Editorial & Pitches',
    badge: 'Guest Articles',
    email: 'editorial@tgstechinfo.com',
    desc: 'Pitch news tips, expert opinion pieces, tech press releases, or guest articles.',
    icon: Newspaper,
    categoryKey: 'editorial',
    highlights: ['Guest Posts', 'Press Releases']
  },
  {
    id: 'partnership',
    title: 'Media & Advertising',
    badge: 'Sponsorships',
    email: 'partnerships@tgstechinfo.com',
    desc: 'Inquire about corporate sponsorships, native advertising, media kits, or events.',
    icon: Megaphone,
    categoryKey: 'partnership',
    highlights: ['Media Kits', 'Sponsored Ads']
  },
  {
    id: 'authors',
    title: 'Writer Support',
    badge: 'Author Desk',
    email: 'authors@tgstechinfo.com',
    desc: 'Support for registered contributors, publishing rules, profile verification & tools.',
    icon: PenTool,
    categoryKey: 'feedback',
    highlights: ['Author Accounts', 'Editorial Rules']
  },
  {
    id: 'corporate',
    title: 'Corporate & HQ Desk',
    badge: 'Operations',
    email: 'info@tgstechinfo.com',
    desc: 'General inquiries, corporate communications, data privacy, or office visits.',
    icon: Building2,
    categoryKey: 'general',
    highlights: ['General Q&A', 'Data Requests']
  }
];

export const PublishingDesks = ({ onSelectDesk, activeCategory }) => {
  return (
    <div className="max-w-7xl mx-auto my-10 px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Direct Desk Routing
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-heading)' }}>
          Choose Your Communication Desk
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm max-w-xl mx-auto font-medium" style={{ color: 'var(--color-body)' }}>
          Click any desk to automatically route your message to the appropriate publishing team.
        </p>
      </motion.div>

      {/* Clean Professional Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {desks.map((desk, idx) => {
          const Icon = desk.icon;
          const isSelected = activeCategory === desk.categoryKey;

          return (
            <motion.div
              key={desk.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ 
                duration: 0.7, 
                delay: idx * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ 
                y: -6, 
                scale: 1.02,
                transition: { duration: 0.25, ease: 'easeOut' }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectDesk(desk.categoryKey)}
              className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden min-h-[200px] ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                  : 'hover:border-amber-500/50 shadow-sm hover:shadow-md'
              }`}
              style={{
                background: 'var(--color-surface)',
                borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            >
              <div>
                {/* Header: Icon & Clean Badge */}
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xs"
                    style={{
                      backgroundColor: 'var(--color-bg-alt)',
                      color: 'var(--color-heading)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <Icon className="w-5 h-5 text-amber-500" />
                  </div>

                  <span 
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'var(--color-bg-alt)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-muted)'
                    }}
                  >
                    {desk.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold mb-1.5 group-hover:text-amber-500 transition-colors" style={{ color: 'var(--color-heading)' }}>
                  {desk.title}
                </h3>

                {/* Shortened Description */}
                <p className="text-xs leading-relaxed mb-3 line-clamp-2 font-normal" style={{ color: 'var(--color-body)' }}>
                  {desk.desc}
                </p>
              </div>

              {/* Action Link Footer */}
              <div
                className="pt-3 border-t flex items-center justify-between text-xs font-bold transition-colors group-hover:text-amber-500"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
              >
                <span className="flex items-center gap-1.5">
                  {isSelected ? '✓ Desk Selected' : 'Route to Desk'}
                </span>
                
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-500/10 text-slate-400 group-hover:bg-amber-500 group-hover:text-white'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
