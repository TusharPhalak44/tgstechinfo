import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Sparkles, Globe } from 'lucide-react';

// Custom Publishing Contact Components
import { ContactHero } from '../components/contact/ContactHero';
import { PublishingDesks } from '../components/contact/PublishingDesks';
import { ContactForm } from '../components/contact/ContactForm';
import { OfficeMap } from '../components/contact/OfficeMap';
import { FAQAccordion } from '../components/contact/FAQAccordion';
import { ThemeToggle } from '../components/contact/ThemeToggle';

export const ContactUs = () => {
  const [agreed, setAgreed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSelectDesk = (categoryKey) => {
    setSelectedCategory(categoryKey);
    // Smooth scroll down to the contact form section
    const formElem = document.getElementById('contact-form-section');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Theme switcher toggle */}
      <ThemeToggle />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* 1. Newsroom Background Image Hero Section (Text gradient retained) */}
        <ContactHero />

        {/* 2. Compact Professional Communication Desks */}
        <PublishingDesks
          onSelectDesk={handleSelectDesk}
          activeCategory={selectedCategory}
        />

        {/* 3. Main Form & FAQ Side-by-Side Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (7 cols on large screen) */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <ContactForm
              agreed={agreed}
              setAgreed={setAgreed}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </motion.div>

          {/* Right Column: FAQ Knowledge Base (5 cols on large screen) */}
          <motion.div
            className="lg:col-span-5 space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <FAQAccordion />

            {/* Clean Professional Contact Hotline Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-2xl border shadow-md relative overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Media & Editorial Hotlines
                </span>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-heading)' }}>
                  Need Immediate Press Assistance?
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--color-body)' }}>
                  For time-sensitive technology press coverage, product launch exclusives, or executive interviews, call our global desks directly:
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <motion.a
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    href="tel:+13464878307"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-amber-500 dark:hover:bg-amber-500 transition-colors shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>US: +1 346-487-8307</span>
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    href="tel:+919665599442"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-amber-500 dark:hover:bg-amber-500 transition-colors shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>IN: +91 96655-99442</span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* 4. Global HQ & Office Map */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <OfficeMap />
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;
