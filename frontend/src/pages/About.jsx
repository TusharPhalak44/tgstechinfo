import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  Globe,
  Building2,
  Target,
  Eye,
  BookOpen,
  Users,
  Award,
  ShieldCheck,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowRight,
  Layers,
  Cpu,
  Share2,
  Briefcase,
  Lightbulb,
  HeartHandshake,
  Rocket,
  Compass,
  Check,
  ChevronRight,
  Milestone
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
  }
};

const About = () => {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('who-we-are');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const stats = [
    { label: 'Founded Year', value: '2021', icon: Building2, desc: 'Established in India' },
    { label: 'Content Published', value: '10K+', icon: BookOpen, desc: 'Articles & Guides' },
    { label: 'Tech Categories', value: '50+', icon: Layers, desc: 'Specialized Verticals' },
    { label: 'Global Audience', value: '100%', icon: Globe, desc: 'Worldwide Reach' },
  ];

  const contentTopics = [
    'Technology Insights',
    'Business Articles',
    'Industry Research',
    'Whitepapers',
    'eBooks',
    'Case Studies',
    'Product Announcements',
    'Press Releases',
    'SaaS & AI Guides',
    'Marketing Resources',
    'Educational Content',
    'Professional Opinions'
  ];

  const milestones = [
    {
      year: '2021',
      title: 'Company Foundation',
      desc: 'Taraj Global Solutions Pvt. Ltd. was founded with a mission to bridge global B2B digital marketing and tech knowledge.',
      icon: Building2
    },
    {
      year: '2022',
      title: 'TGS Tech Info Launch',
      desc: 'Created TGS Tech Info as an enterprise content publishing ecosystem for tech writers and organizations.',
      icon: Rocket
    },
    {
      year: '2023',
      title: 'Ecosystem & Author Scaling',
      desc: 'Expanded publishing tools to support over 50 technology categories and dedicated author portals.',
      icon: TrendingUp
    },
    {
      year: '2024',
      title: 'Advanced CMS & Lead Engine',
      desc: 'Integrated modern SEO architecture, B2B demand generation tools, and content analytics.',
      icon: Cpu
    },
    {
      year: 'Present & Beyond',
      title: 'Global Knowledge Network',
      desc: 'Empowering thousands of readers, creators, and business leaders with world-class digital publishing.',
      icon: Globe
    }
  ];

  const whyChooseUs = [
    {
      icon: Layers,
      title: 'Professional Content Management',
      desc: 'Manage and curate all your articles, whitepapers, and blogs from one centralized, intuitive publishing dashboard.'
    },
    {
      icon: Users,
      title: 'User & Author Portal',
      desc: 'Registered creators and businesses get a dedicated author profile and content library management system.'
    },
    {
      icon: TrendingUp,
      title: 'Search Engine Optimized',
      desc: 'Every article structure follows modern SEO best practices to ensure high discoverability across major search engines.'
    },
    {
      icon: Award,
      title: 'Thought Leadership',
      desc: 'Publish expert insights that position your enterprise or personal brand as an authoritative voice in tech.'
    },
    {
      icon: Globe,
      title: 'Global Business Reach',
      desc: 'Extend your digital footprint by engaging tech professionals, decision-makers, and researchers globally.'
    },
    {
      icon: Zap,
      title: 'Scalable Publishing',
      desc: 'Designed to support individual writers as well as enterprise marketing teams publishing hundreds of resources.'
    },
    {
      icon: BookOpen,
      title: 'Structured Organization',
      desc: 'Seamlessly categorize and tag articles for optimal reader navigation and rapid knowledge discovery.'
    },
    {
      icon: Share2,
      title: 'Knowledge Sharing Hub',
      desc: 'Build an accessible, high-value repository of industry intelligence for readers and customers.'
    }
  ];

  const coreValues = [
    { title: 'Quality Content', icon: Award, desc: 'Prioritizing accuracy, clarity, and genuine value in every publication.' },
    { title: 'Transparency', icon: ShieldCheck, desc: 'Open, honest publishing guidelines and authentic author attribution.' },
    { title: 'Innovation', icon: Lightbulb, desc: 'Continuously enhancing platform capabilities to meet evolving tech needs.' },
    { title: 'Knowledge Sharing', icon: BookOpen, desc: 'Fostering an open ecosystem where tech intelligence benefits everyone.' },
    { title: 'User-Centricity', icon: Users, desc: 'Designing every feature around the needs of authors, editors, and readers.' },
    { title: 'Digital Excellence', icon: Zap, desc: 'Striving for fast performance, modern UX, and reliable uptime.' },
    { title: 'Continuous Growth', icon: TrendingUp, desc: 'Evolving content reach and platform features alongside industry trends.' },
    { title: 'Trust & Integrity', icon: HeartHandshake, desc: 'Maintaining high standards for data privacy and content quality.' }
  ];

  const b2bSectors = [
    'Software & SaaS',
    'Artificial Intelligence',
    'Cybersecurity',
    'Cloud Computing',
    'Information Technology',
    'Healthcare Tech',
    'FinTech & Finance',
    'Manufacturing',
    'Telecommunications',
    'EdTech & Education'
  ];

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        paddingTop: 'clamp(16px, 2.5vw, 32px)',
        paddingBottom: 'clamp(40px, 6vw, 64px)',
        transition: 'background-color 0.3s ease',
        color: 'var(--color-body)'
      }}
    >
      <div className="container-custom">
        {/* ── ANIMATED HERO SECTION ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="about-hero-wrapper p-6 sm:p-10 md:p-14 text-white mb-14"
        >
          {/* Ambient Glows with Framer Motion floating physics */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.4, 0.25]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="about-hero-glow"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.35, 0.2]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="about-hero-glow-secondary"
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 max-w-4xl mx-auto text-center"
          >
            {/* Pill Badge */}
            <motion.div variants={itemVariants} className="inline-block mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-[var(--color-accent)] font-semibold text-xs md:text-sm uppercase tracking-widest shadow-lg">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
                <span>About TGS Tech Info</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              Empowering Global Tech & Enterprise Leaders Through{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F7941D] via-[#FFD1A3] to-[#60A5FA]">
                Knowledge & Digital Reach
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto mb-10"
            >
              TGS Tech Info is an advanced Content Management System (CMS) and digital publishing ecosystem. 
              We enable businesses, writers, and tech experts to publish high-value content and expand their global digital footprint.
            </motion.p>

            {/* Interactive Animated Stats Grid */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
            >
              {stats.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -6, scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center hover:bg-white/15 hover:border-white/40 transition-all duration-300 shadow-md cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <IconComponent className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {item.value}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-200 font-semibold mt-1">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.desc}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── INTERACTIVE TABBED ECOSYSTEM (SHADCN STYLE) ── */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] dark:bg-blue-950 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Platform Explorer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
              Discover TGS Tech Info Ecosystem
            </h2>
            <p className="text-base text-[var(--color-muted)]">
              Click through the tabs below to explore who we are, our parent organization, and our content reach.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-[var(--color-bg-alt)] border border-[var(--color-border)] gap-1 flex-wrap justify-center">
              {[
                { id: 'who-we-are', label: 'Who We Are', icon: Building2 },
                { id: 'content-ecosystem', label: 'Content Ecosystem', icon: BookOpen },
                { id: 'parent-company', label: 'Taraj Global Solutions', icon: Briefcase },
                { id: 'global-impact', label: 'Global Impact', icon: Globe }
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`about-tab-btn flex items-center gap-2 ${isActive ? 'active' : ''}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated Tab Panels */}
          <div className="about-card p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'who-we-are' && (
                <motion.div
                  key="who-we-are"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)]">
                      A User-Driven Content Platform & Digital CMS
                    </h3>
                    <p className="text-base text-[var(--color-body)] leading-relaxed">
                      TGS Tech Info was established to build a scalable content ecosystem that enables organizations, writers, and tech experts to publish high-quality knowledge without managing complex web server infrastructure.
                    </p>
                    <p className="text-base text-[var(--color-body)] leading-relaxed">
                      Every registered author gets a dedicated workspace to draft, structure, organize, and publish their research, articles, whitepapers, and blogs.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[var(--color-bg-alt)] border border-[var(--color-border)] flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
                        <span className="text-sm font-semibold text-[var(--color-heading)]">Author Dashboard</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--color-bg-alt)] border border-[var(--color-border)] flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
                        <span className="text-sm font-semibold text-[var(--color-heading)]">SEO Engine</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 bg-[var(--color-bg-alt)] p-6 rounded-2xl border border-[var(--color-border)]">
                    <h4 className="text-base font-bold text-[var(--color-heading)] mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[var(--color-accent)]" />
                      <span>Key Highlights</span>
                    </h4>
                    <ul className="space-y-3 text-sm text-[var(--color-body)]">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                        <span>Centralized author portfolio and content library</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                        <span>Support for whitepapers, case studies, & eBooks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                        <span>Audience engagement and B2B lead generation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                        <span>Multi-category tagging and responsive reading UX</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {activeTab === 'content-ecosystem' && (
                <motion.div
                  key="content-ecosystem"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--color-border)] pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--color-heading)]">
                        Multi-Industry Content Taxonomy
                      </h3>
                      <p className="text-sm text-[var(--color-muted)]">
                        Articles, blogs, whitepapers, and guides across 50+ specialized topics.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-bold">
                      12 Core Content Verticals
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {contentTopics.map((topic, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.03, y: -2 }}
                        className="p-3.5 rounded-xl bg-[var(--color-bg-alt)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-heading)] flex items-center gap-2 cursor-pointer hover:border-[var(--color-accent)] transition-all"
                      >
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                        <span>{topic}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'parent-company' && (
                <motion.div
                  key="parent-company"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Est. 2021</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)]">
                      Taraj Global Solutions Pvt. Ltd.
                    </h3>
                    <p className="text-base text-[var(--color-body)] leading-relaxed">
                      TGS Tech Info is owned and operated by Taraj Global Solutions Pvt. Ltd., a technology-driven organization specializing in B2B demand generation, content marketing, lead development, and marketing technologies.
                    </p>
                    <p className="text-base text-[var(--color-body)] leading-relaxed">
                      Our international expertise in supporting global businesses helps shape TGS Tech Info into a high-performance content engine.
                    </p>
                  </div>

                  <div className="lg:col-span-5 bg-[var(--color-bg-alt)] p-6 rounded-2xl border border-[var(--color-border)]">
                    <h4 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wider mb-3">
                      Supported B2B Verticals
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {b2bSectors.map((sector, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-heading)]"
                        >
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'global-impact' && (
                <motion.div
                  key="global-impact"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="p-6 rounded-2xl bg-[var(--color-bg-alt)] border border-[var(--color-border)] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-[var(--color-heading)]">Global Distribution</h4>
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                      Connecting readers, decision-makers, and researchers across North America, Europe, Asia, and worldwide markets.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--color-bg-alt)] border border-[var(--color-border)] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-[var(--color-heading)]">Thought Leadership</h4>
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                      Establishing authority for enterprises through data-backed articles, case studies, and industry whitepapers.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--color-bg-alt)] border border-[var(--color-border)] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-[var(--color-heading)]">B2B Growth</h4>
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                      Transforming valuable tech knowledge into customer engagement and marketing-qualified opportunities.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── COMPANY MILESTONES & TIMELINE ── */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold text-xs uppercase tracking-wider mb-3">
              <Milestone className="w-3.5 h-3.5" />
              <span>Growth Story</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
              Our Journey & Key Milestones
            </h2>
            <p className="text-base text-[var(--color-muted)]">
              From our founding in 2021 to a global digital publishing ecosystem.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto px-4">
            <div className="about-timeline-line" />

            <div className="space-y-8 relative z-10">
              {milestones.map((m, idx) => {
                const IconComp = m.icon;
                const isEven = idx % 2 === 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className={`flex flex-col md:flex-row items-start md:items-center ${
                      isEven ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="w-full md:w-1/2 p-2">
                      <div className="about-card p-6 hover:border-[var(--color-accent)] transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-bold">
                            {m.year}
                          </span>
                          <IconComp className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-heading)] mb-2">
                          {m.title}
                        </h3>
                        <p className="text-sm text-[var(--color-body)] leading-relaxed">
                          {m.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MISSION & VISION DUAL SPOTLIGHT ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="about-card border-l-4 border-l-[var(--color-primary)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="about-icon-wrapper">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider">Our Purpose</span>
                <h3 className="text-xl font-bold text-[var(--color-heading)]">Our Mission</h3>
              </div>
            </div>
            <p className="text-base text-[var(--color-body)] leading-relaxed">
              To make professional content publishing accessible, efficient, and impactful for businesses, researchers, and creators worldwide. We aim to foster a trusted environment where knowledge is seamlessly created and shared.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="about-card border-l-4 border-l-[var(--color-accent)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="about-icon-wrapper bg-[var(--color-accent-light)] text-[var(--color-accent)] dark:bg-amber-900/30">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider">Future Goal</span>
                <h3 className="text-xl font-bold text-[var(--color-heading)]">Our Vision</h3>
              </div>
            </div>
            <p className="text-base text-[var(--color-body)] leading-relaxed">
              To become a globally recognized digital content platform that empowers organizations, thought leaders, and innovators to manage, publish, and distribute valuable intelligence driving global business growth.
            </p>
          </motion.div>
        </div>

        {/* ── WHY CHOOSE US (ANIMATED CARDS GRID) ── */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--color-accent-light)] text-[var(--color-accent)] font-semibold text-xs uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Platform Advantages</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
              Why Choose TGS Tech Info
            </h2>
            <p className="text-base text-[var(--color-muted)]">
              Built with state-of-the-art tools for modern digital publishers and readers.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {whyChooseUs.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="about-card-accent cursor-pointer"
                >
                  <div className="about-icon-wrapper mb-4">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-heading)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--color-body)] leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ── CORE VALUES GRID ── */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>What Drives Us</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
              Our Core Values
            </h2>
            <p className="text-base text-[var(--color-muted)]">
              Principles guiding our tech standards, author experience, and content integrity.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
          >
            {coreValues.map((val, idx) => {
              const IconComp = val.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="about-card p-5 text-center flex flex-col items-center hover:border-[var(--color-accent)] transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-light)] dark:bg-amber-900/30 text-[var(--color-accent)] flex items-center justify-center mb-3">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-heading)] mb-1">
                    {val.title}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    {val.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ── ANIMATED CALL TO ACTION (CTA) BANNER ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="about-cta-banner text-center text-white"
        >
          <div className="about-cta-glow" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4"
            >
              Join the TGS Tech Info Community
            </motion.h2>

            <p className="text-base sm:text-lg text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Whether you are an industry practitioner, startup leader, or tech enterprise, TGS Tech Info gives you the platform to share knowledge and connect with global readers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/"
                  className="btn-accent px-7 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 text-white shadow-xl transition-all"
                >
                  <span>Explore Latest Insights</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/register"
                  className="px-7 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 transition-all"
                >
                  <span>Start Publishing Today</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
