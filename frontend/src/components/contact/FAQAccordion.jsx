import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, BookOpen, Megaphone, Clock, MapPin, ShieldAlert } from 'lucide-react';

const faqData = [
  {
    category: 'editorial',
    question: 'How do I submit an article pitch or guest contribution?',
    answer: 'Select "Editorial / Pitch" in our contact form or email editorial@tgstechinfo.com. Please include a short summary (150-200 words), key takeaways, your target technology vertical, and relevant writer credentials. Our editorial board reviews pitches within 24–48 hours.',
    icon: BookOpen
  },
  {
    category: 'media',
    question: 'How can our brand request a Media Kit or custom sponsorship package?',
    answer: 'Choose "Partnerships & Media" in the form above. Our partnerships team will send our comprehensive Media Kit containing audience demographics, newsletter sponsorship options, webinar co-hosting details, and custom display advertising rate cards.',
    icon: Megaphone
  },
  {
    category: 'editorial',
    question: 'What are the guidelines for press releases and product announcements?',
    answer: 'Press releases must relate directly to B2B technology, SaaS, AI, enterprise software, or digital transformation. High-resolution logos, executive quotes, and launch dates speed up our review process.',
    icon: BookOpen
  },
  {
    category: 'general',
    question: 'What is the typical response timeline for inquiries?',
    answer: 'Standard editorial and partnership inquiries receive a response within 24 to 48 business hours (Mon–Fri, 9:00 AM – 6:00 PM EST). Urgent press announcements can flag "Urgent Press" in the subject line.',
    icon: Clock
  },
  {
    category: 'general',
    question: 'Can I schedule a physical meeting at your office in Pune?',
    answer: 'Yes! Visitors are welcome at our office in The Space Business Complex, Kharadi, Pune. Please schedule an appointment in advance via our Corporate Desk so our team can prepare visitor access credentials.',
    icon: MapPin
  },
  {
    category: 'general',
    question: 'How do I report a content error, copyright concern, or update request?',
    answer: 'We take editorial integrity seriously. Please select "Report Issue" or email info@tgstechinfo.com with the article URL and specific concern. Our editorial compliance team will review and respond promptly.',
    icon: ShieldAlert
  }
];

export const FAQAccordion = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);

  const filteredFaqs = activeCategory === 'all'
    ? faqData
    : faqData.filter(item => item.category === activeCategory);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div
      className="p-6 sm:p-8 rounded-2xl border shadow-md transition-all duration-300 relative overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Theme Color Accent Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%)' }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b relative z-10" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-heading)' }}>
            <HelpCircle className="w-6 h-6 text-amber-500" />
            Publishing Knowledge Base & FAQs
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Quick answers regarding editorial submissions, media kits, and corporate guidelines.
          </p>
        </div>
      </div>

      {/* FAQ Category Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
        {[
          { id: 'all', label: 'All FAQs' },
          { id: 'editorial', label: 'Editorial & Pitches' },
          { id: 'media', label: 'Media & Advertising' },
          { id: 'general', label: 'General & Support' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveCategory(tab.id); setOpenIndex(null); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === tab.id
                ? 'bg-amber-500 text-white shadow-sm'
                : 'hover:bg-slate-500/10'
            }`}
            style={{
              backgroundColor: activeCategory === tab.id ? 'var(--color-accent)' : 'var(--color-bg-alt)',
              color: activeCategory === tab.id ? '#FFFFFF' : 'var(--color-body)',
              border: '1px solid var(--color-border)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3 relative z-10">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const Icon = faq.icon;

          return (
            <div
              key={faq.question}
              className={`rounded-xl border transition-all overflow-hidden ${
                isOpen ? 'border-amber-500/50 shadow-xs' : 'hover:border-slate-400 dark:hover:border-slate-600'
              }`}
              style={{
                backgroundColor: isOpen ? 'var(--color-bg-alt)' : 'transparent',
                borderColor: isOpen ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm transition-colors"
                style={{ color: 'var(--color-heading)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}>
                    <Icon className="w-4 h-4 text-amber-500" />
                  </div>
                  <span>{faq.question}</span>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-amber-500 text-white' : 'bg-slate-500/10 text-slate-400'}`}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-4 pb-4 pt-1 text-xs leading-relaxed border-t border-slate-500/10" style={{ color: 'var(--color-body)' }}>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
