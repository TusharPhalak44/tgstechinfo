import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  Globe,
  Building2,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Rocket,
  CheckCircle2,
  BarChart3,
  PenTool,
  Award,
  ChevronRight,
  Cpu,
  Lock,
  Cloud,
  Briefcase,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const tabContent = {
  'our-story': {
    title: 'Our Story & Legacy',
    subtitle: 'Building a Bridge Between Tech Innovation and Global Decision-Makers',
    description: 'Founded in 2021 under Taraj Global Solutions Pvt. Ltd., TGS Tech Info was established to redefine enterprise technology journalism and digital B2B publishing. We recognized a growing gap between rapid technological breakthroughs and actionable intelligence for business leaders.',
    highlights: [
      'Founded in 2021 as part of Taraj Global Solutions Pvt. Ltd.',
      'Grown to over 10,000+ published technical articles and whitepapers',
      'Trusted by technology executives, developers, and SaaS founders across 50+ verticals',
      'Headquartered in Kharadi, Pune, India with worldwide audience reach'
    ]
  },
  'our-mission': {
    title: 'Our Corporate Mission',
    subtitle: 'Democratizing Enterprise Tech Knowledge with Uncompromising Editorial Quality',
    description: 'Our mission is to empower business leaders, IT architects, and technology enthusiasts with expert-vetted analysis, unbiased industry news, and actionable research needed to navigate digital transformation.',
    highlights: [
      'Delivering rigorous, peer-reviewed technology insights',
      'Empowering independent authors and industry experts to publish research',
      'Maintaining complete editorial independence and transparency',
      'Accelerating B2B technology adoption through educational content'
    ]
  },
  'our-vision': {
    title: 'Our Global Vision',
    subtitle: 'To Be the Most Trusted B2B Tech Media Ecosystem Worldwide',
    description: 'We envision a connected digital ecosystem where organizations of all sizes can discover, publish, and scale technology intelligence seamlessly, bridging the gap between vendor innovation and enterprise adoption.',
    highlights: [
      'Expanding coverage across emerging AI, Cybersecurity, and Cloud paradigms',
      'Fostering a global community of verified technology contributors',
      'Pioneering interactive multi-format media including whitepapers and webinars',
      'Setting global standards for digital media compliance and privacy'
    ]
  },
  'editorial-standards': {
    title: 'Editorial Standards & Integrity',
    subtitle: 'Fact-Checked, Vetted, and Value-Driven Journalism',
    description: 'Every article, whitepaper, and interview published on TGS Tech Info undergoes rigorous editorial review. We strictly adhere to plagiarism checks, source verification, and transparent disclosure of editorial partnerships.',
    highlights: [
      'Zero-tolerance policy for misleading claims or unverified stats',
      'Clear demarcation between independent editorial content and sponsored media',
      'Comprehensive attribution and data source citations in all reports',
      'Regular content audits to maintain accuracy over time'
    ]
  }
};

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Editorial Integrity & Quality',
    desc: 'Every piece of content is thoroughly fact-checked, peer-reviewed, and written by domain experts to ensure accuracy and actionable value.',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    accentBorder: 'hover:border-blue-500/60'
  },
  {
    icon: Globe,
    title: 'Global B2B Tech Network',
    desc: 'We connect technology vendors, enterprise buyer personas, C-suite executives, and IT professionals across international markets.',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    accentBorder: 'hover:border-emerald-500/60'
  },
  {
    icon: PenTool,
    title: 'Author & Creator Platform',
    desc: 'Empowering independent technology analysts, engineers, and thought leaders with robust publishing tools and global reach.',
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    accentBorder: 'hover:border-purple-500/60'
  },
  {
    icon: BarChart3,
    title: 'Data & Market Intelligence',
    desc: 'In-depth market reports, case studies, whitepaper syndication, and research webinars tailored for enterprise digital transformation.',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    accentBorder: 'hover:border-amber-500/60'
  }
];

// Timeline Data for Alternating Centered Scroll Journey
const journeyItems = [
  {
    year: '2021',
    title: 'Corporate Incorporation & Pune Desk',
    subtitle: 'Taraj Global Solutions Pvt. Ltd.',
    desc: 'Founded in Kharadi, Pune with an initial editorial team dedicated to B2B technology communication and enterprise digital publishing.',
    metric: 'Founded 2021',
    mediaImage: '/about_hero_banner.jpg',
    tags: ['Incorporated in India', 'Initial Editorial Team', 'B2B Digital Media']
  },
  {
    year: '2022',
    title: 'Launch of TGS Tech Info Platform',
    subtitle: 'Digital Publishing Ecosystem',
    desc: 'Engineered and launched the TGS Tech Info platform, introducing whitepaper syndication, author submission portals, and tech news vertical feeds.',
    metric: '1,000+ Articles',
    mediaImage: '/about_mission_img.jpg',
    tags: ['Platform Launch', 'Whitepaper Syndication', 'Author Portals']
  },
  {
    year: '2023',
    title: '50+ Verticals & Global Scaling',
    subtitle: '100,000+ Monthly IT Decision-Makers',
    desc: 'Expanded coverage across AI, Cybersecurity, Cloud Computing, SaaS, and DevOps, reaching over 100,000 monthly technology leaders worldwide.',
    metric: '100K+ Monthly Readers',
    mediaImage: '/about_hero_banner.jpg',
    tags: ['50+ Tech Verticals', 'Global Reach', 'SaaS & AI Focus']
  },
  {
    year: '2024+',
    title: 'Enterprise AI & Media Network Expansion',
    subtitle: 'Global Intelligence Distribution',
    desc: 'Integrating AI-driven editorial tools, interactive research webinars, enterprise case studies, and dedicated media kits for global partners.',
    metric: '10,000+ Total Articles',
    mediaImage: '/about_mission_img.jpg',
    tags: ['AI Content Tools', 'Webinars & eBooks', 'Media Partnerships']
  }
];

// Technology Verticals Matrix Data
const verticalMatrix = [
  {
    id: 'ai-data',
    title: 'AI & Data Science',
    icon: Cpu,
    desc: 'Deep dives into generative AI, machine learning pipelines, MLOps, and enterprise data analytics.',
    badge: '12 Verticals',
    topics: ['Artificial Intelligence', 'Machine Learning', 'Data Analytics', 'Big Data', 'Generative AI', 'Neural Networks', 'MLOps']
  },
  {
    id: 'cyber-sec',
    title: 'Cybersecurity & Governance',
    icon: Lock,
    desc: 'Actionable guidance on Zero Trust architecture, threat intelligence, cloud security, and GDPR compliance.',
    badge: '10 Verticals',
    topics: ['Cybersecurity', 'Zero Trust Architecture', 'Cloud Security', 'Threat Intelligence', 'GDPR & Privacy', 'Network Defense']
  },
  {
    id: 'cloud-dev',
    title: 'Cloud & Infrastructure',
    icon: Cloud,
    desc: 'SaaS architecture, Kubernetes orchestration, CI/CD pipelines, and multi-cloud infrastructure strategy.',
    badge: '14 Verticals',
    topics: ['Cloud Computing', 'DevOps & CI/CD', 'SaaS Architecture', 'Microservices', 'Edge Computing', 'Kubernetes']
  },
  {
    id: 'b2b-growth',
    title: 'Enterprise IT & B2B Strategy',
    icon: Briefcase,
    desc: 'Digital transformation blueprints, Fintech innovations, IoT frameworks, and B2B tech growth models.',
    badge: '15 Verticals',
    topics: ['Digital Transformation', 'Fintech & Blockchain', 'IoT Systems', 'B2B Marketing', 'Enterprise SaaS', 'IT Leadership']
  }
];

// Centered Scroll-Linked Alternating Timeline Component
const CenteredScrollJourney = () => {
  const containerRef = useRef(null);
  
  // Track scroll progress inside the timeline container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 60%', 'end 80%']
  });

  // Animated vertical line height from 0% to 100%
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      ref={containerRef}
      className="p-6 sm:p-12 rounded-3xl border shadow-xl relative overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* Section Title */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Evolutionary Path
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--color-heading)' }}>
          Our Journey
        </h2>
        <p className="mt-2 text-xs sm:text-sm" style={{ color: 'var(--color-body)' }}>
          From company incorporation in Pune to a premier global enterprise technology publishing platform.
        </p>
      </div>

      {/* Centered Timeline Container */}
      <div className="relative max-w-6xl mx-auto">
        
        {/* Background Track Line (Static Line in Center for Desktop, Left for Mobile) */}
        <div className="absolute left-4 md:left-1/2 top-4 bottom-8 w-1 bg-slate-200 dark:bg-slate-800 rounded-full md:-translate-x-1/2" />

        {/* Scroll-Linked Dynamic Blue/Amber Progress Line (Center Axis) */}
        <motion.div
          style={{ scaleY, transformOrigin: 'top' }}
          className="absolute left-4 md:left-1/2 top-4 bottom-8 w-1 bg-gradient-to-b from-amber-500 via-blue-500 to-emerald-500 rounded-full z-10 md:-translate-x-1/2"
        />

        {/* Alternating Milestone Rows */}
        <div className="space-y-16 sm:space-y-24 relative">
          {journeyItems.map((item, idx) => {
            const isContentLeft = idx % 2 === 0;

            return (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: idx * 0.12 }}
                className="relative flex flex-col md:flex-row items-center gap-8 group"
              >
                {/* Central Year Bullet Node (Center on Desktop, Left on Mobile) */}
                <div className="absolute left-4 md:left-1/2 top-2 md:top-6 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-slate-900 border-4 border-amber-500 flex items-center justify-center shadow-xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>

                {/* Left Side Container */}
                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:pr-12">
                  {isContentLeft ? (
                    /* Content Text Block (Left Side) */
                    <div className="space-y-3 md:text-right">
                      <div className="flex items-center gap-3 md:justify-end">
                        <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                          {item.year}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-slate-500/10" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                          {item.subtitle}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--color-heading)' }}>
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                        {item.desc}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1 md:justify-end">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border"
                            style={{
                              backgroundColor: 'var(--color-bg-alt)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-heading)'
                            }}
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Image Media Card (Left Side) */
                    <div className="w-full">
                      <div className="relative rounded-2xl overflow-hidden border shadow-lg group-hover:shadow-2xl transition-all h-48 sm:h-56" style={{ borderColor: 'var(--color-border)' }}>
                        <img
                          src={item.mediaImage}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white text-xs font-extrabold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>{item.metric}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side Container */}
                <div className="w-full md:w-1/2 pl-12 md:pl-12 md:pr-0">
                  {isContentLeft ? (
                    /* Image Media Card (Right Side) */
                    <div className="w-full">
                      <div className="relative rounded-2xl overflow-hidden border shadow-lg group-hover:shadow-2xl transition-all h-48 sm:h-56" style={{ borderColor: 'var(--color-border)' }}>
                        <img
                          src={item.mediaImage}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white text-xs font-extrabold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>{item.metric}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Content Text Block (Right Side) */
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                          {item.year}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-slate-500/10" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                          {item.subtitle}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--color-heading)' }}>
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                        {item.desc}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border"
                            style={{
                              backgroundColor: 'var(--color-bg-alt)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-heading)'
                            }}
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const About = () => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('our-story');
  const [activeMatrixTab, setActiveMatrixTab] = useState('ai-data');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentMatrixData = verticalMatrix.find(m => m.id === activeMatrixTab) || verticalMatrix[0];

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* 1. Top Asymmetric Editorial Intro Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2 pb-6">
          {/* Left Column: Bold Editorial Typography */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 tracking-wide uppercase">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Taraj Global Solutions Pvt. Ltd.</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--color-heading)' }}>
              Empowering Global B2B Leaders with <span className="text-amber-500">Tech Intelligence</span>
            </h1>

            <p className="text-sm sm:text-base leading-relaxed max-w-2xl font-normal" style={{ color: 'var(--color-body)' }}>
              TGS Tech Info is a premier enterprise technology media platform. We bridge the gap between rapid technological innovation and strategic decision-making for business leaders, architects, and SaaS pioneers worldwide.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">10,000+</div>
                <div className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Published Articles</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">50+</div>
                <div className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Tech Verticals</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-amber-500">100K+</div>
                <div className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Monthly Readers</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#who-we-are-section"
                className="px-5 py-3 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-all flex items-center gap-2"
              >
                <span>Our Corporate Story</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <Link
                to="/contact"
                className="px-5 py-3 rounded-xl font-bold text-xs border transition-all hover:bg-slate-500/10"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
              >
                Editorial Inquiries
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Layered Media Frame */}
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden border shadow-2xl group" style={{ borderColor: 'var(--color-border)' }}>
              <img
                src="/about_hero_banner.jpg"
                alt="TGS Tech Info Editorial Room"
                className="w-full h-80 sm:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Global Newsroom Operations
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  Headquartered in Kharadi, Pune, India
                </div>
              </div>
            </div>

            {/* Floating Glass Badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 -left-6 px-4 py-3 rounded-2xl border shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center gap-3 hidden sm:flex"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: 'var(--color-heading)' }}>Verified Standards</div>
                <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Peer-Reviewed Technical Research</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* 2. "About Our Organization" (IMAGE ON LEFT, TABS ON RIGHT) */}
        <motion.div
          id="who-we-are-section"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4"
        >
          {/* LEFT Column: Mission Visual Card */}
          <div
            className="lg:col-span-5 rounded-3xl border shadow-md overflow-hidden relative min-h-[380px] flex flex-col justify-end p-6 group"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <img
              src="/about_mission_img.jpg"
              alt="Global Operations Center"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15, 23, 42, 0.85) 100%)'
              }}
            />

            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/50 backdrop-blur-md text-emerald-300 border border-white/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Global Operations Center
              </span>
            </div>

            <div className="relative z-10 text-white">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                Global Media Footprint
              </div>
              <h3 className="text-xl font-bold mb-2">
                Connecting 100,000+ IT Decision-Makers
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                Our global editorial desk curates and distributes high-impact research, whitepapers, and tech opinion pieces across 50+ specialized verticals.
              </p>
            </div>
          </div>

          {/* RIGHT Column: Interactive Tabs */}
          <div
            className="lg:col-span-7 p-6 sm:p-8 rounded-3xl border shadow-md flex flex-col justify-between"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> About Our Organization
              </span>

              {/* Multi-Colored Tab Selector Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: 'our-story', label: 'Our Story', activeColor: 'bg-blue-600 text-white' },
                  { id: 'our-mission', label: 'Mission', activeColor: 'bg-emerald-600 text-white' },
                  { id: 'our-vision', label: 'Vision', activeColor: 'bg-purple-600 text-white' },
                  { id: 'editorial-standards', label: 'Editorial Standards', activeColor: 'bg-amber-500 text-white' },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? `${tab.activeColor} shadow-md`
                          : 'hover:bg-slate-500/10'
                      }`}
                      style={{
                        backgroundColor: !isActive ? 'var(--color-bg-alt)' : undefined,
                        color: !isActive ? 'var(--color-body)' : undefined,
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-heading)' }}>
                    {tabContent[activeTab].title}
                  </h3>
                  <h4 className="text-xs sm:text-sm font-semibold mb-4 text-blue-600 dark:text-blue-400">
                    {tabContent[activeTab].subtitle}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: 'var(--color-body)' }}>
                    {tabContent[activeTab].description}
                  </p>

                  <div className="space-y-2.5">
                    {tabContent[activeTab].highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-medium" style={{ color: 'var(--color-heading)' }}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="pt-6 mt-6 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-slate-400 font-medium">Taraj Global Solutions Pvt. Ltd.</span>
              <Link to="/contact" className="font-bold text-amber-500 hover:underline flex items-center gap-1">
                <span>Contact Executive Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 3. The Four Pillars of TGS Tech Info */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full uppercase mb-2">
              Our Strategic Foundation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-heading)' }}>
              The Four Pillars of TGS Tech Info
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm" style={{ color: 'var(--color-body)' }}>
              Distinct operational foundations powering our digital B2B media platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.12 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className={`p-6 rounded-2xl border shadow-sm hover:shadow-xl transition-all flex flex-col justify-between ${pillar.accentBorder}`}
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${pillar.iconBg} shadow-xs`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${pillar.badgeBg}`}>
                        Pillar 0{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-heading)' }}>
                      {pillar.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-body)' }}>
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 4. DEMAND-TECH STYLE CENTERED SCROLL-LINKED ALTERNATING TIMELINE */}
        <CenteredScrollJourney />

        {/* 5. TECHNOLOGY VERTICALS COVERAGE MATRIX */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="p-8 sm:p-10 rounded-3xl border shadow-xl relative"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full uppercase mb-2">
              Publishing Catalog Matrix
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: 'var(--color-heading)' }}>
              Technology Verticals We Cover
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-body)' }}>
              Explore our core technology verticals spanning AI, Cybersecurity, Cloud, and B2B SaaS.
            </p>
          </div>

          {/* Interactive Cluster Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {verticalMatrix.map((mat) => {
              const isActive = activeMatrixTab === mat.id;
              const Icon = mat.icon;

              return (
                <button
                  key={mat.id}
                  onClick={() => setActiveMatrixTab(mat.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10 shadow-md ring-2 ring-blue-500/30'
                      : 'hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'var(--color-bg-alt)',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-500/10 text-slate-400'}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold line-clamp-1" style={{ color: 'var(--color-heading)' }}>
                      {mat.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">{mat.badge}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Matrix Detail Showcase */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMatrixTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6"
              style={{
                backgroundColor: 'var(--color-bg-alt)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <span>{currentMatrixData.badge}</span>
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--color-heading)' }}>
                  {currentMatrixData.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  {currentMatrixData.desc}
                </p>
              </div>

              {/* Topics Pill Cluster */}
              <div className="flex flex-wrap gap-2 md:max-w-md">
                {currentMatrixData.topics.map((tp) => (
                  <span
                    key={tp}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 shadow-xs hover:border-amber-500 transition-all cursor-pointer flex items-center gap-1"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
                  >
                    <span>{tp}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 6. Call to Action Editorial Banner */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="p-8 sm:p-12 rounded-3xl border shadow-xl text-center relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #0F172A 100%)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="relative z-10 max-w-3xl mx-auto text-white">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Join Our Publishing Network
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Ready to Share Your Technology Expertise or Partner with Our Desk?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-8 max-w-2xl mx-auto">
              Whether you are an enterprise tech writer pitching a story or a brand seeking media partnerships, our editorial team is here to collaborate.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/articles"
                className="px-6 py-3 rounded-xl font-bold text-xs text-slate-900 bg-white hover:bg-amber-400 transition-colors shadow-lg"
              >
                Explore Tech Articles
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
              >
                Contact Editorial Desk
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default About;
